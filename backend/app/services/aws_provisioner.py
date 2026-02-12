"""
AWS EC2 provisioning service for remote servers (SSH, GPU, inference)
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional
import boto3
from botocore.exceptions import ClientError, BotoCoreError

from app.core.config import settings

logger = logging.getLogger(__name__)


class AWSProvisioner:
    """Handles provisioning and management of AWS EC2 instances"""

    # Ubuntu 22.04 LTS AMI IDs by region (updated as of 2024)
    UBUNTU_AMIS = {
        "us-east-1": "ami-0c7217cdde317cfec",
        "us-east-2": "ami-0a695f0d95cefc163",
        "us-west-1": "ami-0ce2cb35386fc22e9",
        "us-west-2": "ami-0875d33dff2aae0d5",
        "eu-west-1": "ami-0905a3c97561e0b69",
        "eu-west-2": "ami-0eb260c4d5475b901",
        "eu-central-1": "ami-0faab6bdbac9486fb",
        "ap-southeast-1": "ami-0c802847a7dd848c0",
        "ap-southeast-2": "ami-0310483fb2b488153",
        "ap-northeast-1": "ami-0b20f552f63953f0e",
    }

    # AWS on-demand pricing (approximate, updated 2024)
    # Format: instance_type -> hourly_cost_usd
    AWS_PRICING = {
        # SSH instances (t3 family)
        "t3.micro": 0.0104,
        "t3.small": 0.0208,
        "t3.medium": 0.0416,
        "t3.large": 0.0832,
        "t3.xlarge": 0.1664,
        # GPU instances
        "g4dn.xlarge": 0.526,  # T4
        "p3.2xlarge": 3.06,  # V100
        "p4d.24xlarge": 32.77,  # A100
        # Inference instances
        "g5.xlarge": 1.006,
        "inf2.xlarge": 0.76,
    }

    # Pricing markup multiplier
    PRICING_MARKUP = 1.3

    def __init__(self):
        """Initialize AWS provisioner with credentials from settings"""
        self.aws_access_key = settings.AWS_ACCESS_KEY_ID
        self.aws_secret_key = settings.AWS_SECRET_ACCESS_KEY
        self.aws_default_region = settings.AWS_DEFAULT_REGION

        if not self.aws_access_key or not self.aws_secret_key:
            logger.warning("AWS credentials not configured in settings")

    def _get_ec2_client(self, region: str):
        """Get boto3 EC2 client for specified region"""
        try:
            return boto3.client(
                "ec2",
                region_name=region,
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key,
            )
        except Exception as e:
            logger.error(f"Failed to create EC2 client for region {region}: {e}")
            raise Exception(f"Failed to initialize AWS client: {str(e)}")

    def _get_user_data_script(self, app_slug: Optional[str]) -> str:
        """Get the User Data script to install the selected app on first boot"""
        if not app_slug:
            return ""

        base_script = """#!/bin/bash
        apt-get update
        apt-get install -y docker.io docker-compose
        systemctl start docker
        systemctl enable docker
        usermod -aG docker ubuntu
        """
        
        apps = {
            "wordpress": """
        mkdir -p /opt/wordpress
        cat <<EOF > /opt/wordpress/docker-compose.yml
version: '3.1'
services:
  wordpress:
    image: wordpress:latest
    restart: always
    ports:
      - 80:80
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress_password
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wordpress:/var/www/html

  db:
    image: mysql:5.7
    restart: always
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress_password
      MYSQL_RANDOM_ROOT_PASSWORD: '1'
    volumes:
      - db:/var/lib/mysql

volumes:
  wordpress:
  db:
EOF
        cd /opt/wordpress
        docker-compose up -d
            """,
            "docker": "", # Base script already installs docker
            "nodejs": """
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        npm install -g pm2
            """,
            "nginx": """
        apt-get install -y nginx mysql-server php-fpm php-mysql
        systemctl enable nginx
        systemctl start nginx
            """,
            "postgres": """
        apt-get install -y postgresql postgresql-contrib
        systemctl enable postgresql
        systemctl start postgresql
            """,
            "redis": """
        apt-get install -y redis-server
        systemctl enable redis-server
        systemctl start redis-server
            """
        }
        
        return base_script + apps.get(app_slug, "")

    def calculate_hourly_rate(self, instance_type: str) -> float:
        """
        Calculate hourly rate with markup over AWS on-demand pricing

        Args:
            instance_type: EC2 instance type (e.g., "t3.medium", "g4dn.xlarge")

        Returns:
            Hourly rate in USD with markup applied
        """
        base_cost = self.AWS_PRICING.get(instance_type, 0.10)  # Default fallback
        return round(base_cost * self.PRICING_MARKUP, 4)

    def _get_or_create_security_group(
        self, region: str, server_type: str
    ) -> str:
        """
        Get or create security group for server type in region.
        Security groups are shared per server_type per region.

        Args:
            region: AWS region
            server_type: "ssh", "gpu", or "inference"

        Returns:
            Security group ID
        """
        ec2 = self._get_ec2_client(region)
        sg_name = f"app-rproxy-{server_type}-sg"
        sg_description = f"Security group for {server_type} servers - managed by app-rproxy"

        try:
            # Check if security group already exists
            response = ec2.describe_security_groups(
                Filters=[
                    {"Name": "group-name", "Values": [sg_name]},
                ]
            )

            if response["SecurityGroups"]:
                sg_id = response["SecurityGroups"][0]["GroupId"]
                logger.info(f"Found existing security group {sg_id} for {server_type} in {region}")
                return sg_id

            # Create new security group
            logger.info(f"Creating security group {sg_name} in {region}")

            # Get default VPC
            vpcs = ec2.describe_vpcs(Filters=[{"Name": "is-default", "Values": ["true"]}])
            if not vpcs["Vpcs"]:
                raise Exception(f"No default VPC found in region {region}")

            vpc_id = vpcs["Vpcs"][0]["VpcId"]

            # Create security group
            response = ec2.create_security_group(
                GroupName=sg_name,
                Description=sg_description,
                VpcId=vpc_id,
            )
            sg_id = response["GroupId"]

            # Add tags
            ec2.create_tags(
                Resources=[sg_id],
                Tags=[
                    {"Key": "Name", "Value": sg_name},
                    {"Key": "ManagedBy", "Value": "app-rproxy"},
                    {"Key": "ServerType", "Value": server_type},
                ],
            )

            # Configure ingress rules
            ingress_rules = [
                {
                    "IpProtocol": "tcp",
                    "FromPort": 22,
                    "ToPort": 22,
                    "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "SSH access"}],
                }
            ]

            # Add port 8080 for inference servers
            if server_type == "inference":
                ingress_rules.append({
                    "IpProtocol": "tcp",
                    "FromPort": 8080,
                    "ToPort": 8080,
                    "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "Inference API"}],
                })

            ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=ingress_rules,
            )

            logger.info(f"Created security group {sg_id} for {server_type} in {region}")
            return sg_id

        except ClientError as e:
            logger.error(f"Failed to get/create security group: {e}")
            raise Exception(f"Security group creation failed: {str(e)}")

    def _get_or_create_key_pair(
        self, region: str, user_id: uuid.UUID, server_id: uuid.UUID
    ) -> tuple[str, str]:
        """
        Get or create SSH key pair for user's server.
        Each user gets a unique key pair per server.

        Args:
            region: AWS region
            user_id: User UUID
            server_id: Server UUID

        Returns:
            Tuple of (key_pair_name, private_key_pem)
        """
        ec2 = self._get_ec2_client(region)
        key_pair_name = f"app-rproxy-{user_id}-{server_id}"

        try:
            # Check if key pair already exists
            response = ec2.describe_key_pairs(KeyNames=[key_pair_name])
            if response["KeyPairs"]:
                logger.warning(
                    f"Key pair {key_pair_name} already exists but we don't have the private key. "
                    "This shouldn't happen in normal operations."
                )
                # Delete and recreate to get the private key
                ec2.delete_key_pair(KeyName=key_pair_name)

        except ClientError as e:
            if e.response["Error"]["Code"] != "InvalidKeyPair.NotFound":
                logger.error(f"Error checking key pair: {e}")
                raise

        # Create new key pair
        logger.info(f"Creating key pair {key_pair_name} in {region}")
        response = ec2.create_key_pair(
            KeyName=key_pair_name,
            TagSpecifications=[
                {
                    "ResourceType": "key-pair",
                    "Tags": [
                        {"Key": "ManagedBy", "Value": "app-rproxy"},
                        {"Key": "UserId", "Value": str(user_id)},
                        {"Key": "ServerId", "Value": str(server_id)},
                    ],
                }
            ],
        )

        private_key = response["KeyMaterial"]
        logger.info(f"Created key pair {key_pair_name}")
        return key_pair_name, private_key

    def provision_server(
        self,
        server_id: uuid.UUID,
        user_id: uuid.UUID,
        name: str,
        server_type: str,
        aws_instance_type: str,
        aws_region: str,
        gpu_type: Optional[str] = None,
        app_slug: Optional[str] = None,
    ) -> dict:
        """
        Provision a new EC2 instance.

        Args:
            server_id: Server UUID
            user_id: User UUID
            name: Server name
            server_type: "ssh", "gpu", or "inference"
            aws_instance_type: EC2 instance type (e.g., "t3.medium")
            aws_region: AWS region (e.g., "us-east-1")
            gpu_type: Optional GPU type for tagging

        Returns:
            Dict with: instance_id, public_ip, instance_type, region, ami_id,
                       key_pair_name, security_group_id, hourly_rate,
                       connection_string_encrypted (encrypted PEM key)
        """
        if not self.aws_access_key or not self.aws_secret_key:
            raise Exception("AWS credentials not configured")

        try:
            ec2 = self._get_ec2_client(aws_region)

            # Get AMI for region
            ami_id = self.UBUNTU_AMIS.get(aws_region)
            if not ami_id:
                logger.warning(f"No predefined AMI for region {aws_region}, using SSM lookup")
                # Fallback: lookup latest Ubuntu 22.04 AMI via SSM
                ssm = boto3.client(
                    "ssm",
                    region_name=aws_region,
                    aws_access_key_id=self.aws_access_key,
                    aws_secret_access_key=self.aws_secret_key,
                )
                response = ssm.get_parameter(
                    Name="/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
                )
                ami_id = response["Parameter"]["Value"]

            # Get User Data script
            user_data = self._get_user_data_script(app_slug)

            # Get or create security group
            security_group_id = self._get_or_create_security_group(aws_region, server_type)

            # Get or create key pair
            key_pair_name, private_key_pem = self._get_or_create_key_pair(
                aws_region, user_id, server_id
            )

            # Calculate hourly rate
            hourly_rate = self.calculate_hourly_rate(aws_instance_type)

            # Prepare instance tags
            tags = [
                {"Key": "Name", "Value": name},
                {"Key": "ManagedBy", "Value": "app-rproxy"},
                {"Key": "UserId", "Value": str(user_id)},
                {"Key": "ServerId", "Value": str(server_id)},
                {"Key": "ServerType", "Value": server_type},
                {"Key": "Environment", "Value": settings.ENVIRONMENT},
                {"Key": "AppSlug", "Value": app_slug or "os-only"},
            ]
            if gpu_type:
                tags.append({"Key": "GPUType", "Value": gpu_type})

            # Launch EC2 instance
            logger.info(
                f"Launching EC2 instance {aws_instance_type} in {aws_region} for server {server_id} with app {app_slug}"
            )

            run_instances_params = {
                "ImageId": ami_id,
                "InstanceType": aws_instance_type,
                "KeyName": key_pair_name,
                "SecurityGroupIds": [security_group_id],
                "MinCount": 1,
                "MaxCount": 1,
                "TagSpecifications": [
                    {
                        "ResourceType": "instance",
                        "Tags": tags,
                    }
                ],
                "BlockDeviceMappings": [
                    {
                        "DeviceName": "/dev/sda1",
                        "Ebs": {
                            "VolumeSize": 30,  # 30 GB root volume
                            "VolumeType": "gp3",
                            "DeleteOnTermination": True,
                        },
                    }
                ],
            }

            if user_data:
                run_instances_params["UserData"] = user_data

            # For GPU instances, ensure we're using an instance type that supports GPUs
            # (no additional configuration needed for GPU support in run_instances)

            response = ec2.run_instances(**run_instances_params)
            instance_id = response["Instances"][0]["InstanceId"]

            logger.info(f"EC2 instance {instance_id} launched, waiting for running state...")

            # Wait for instance to be running
            waiter = ec2.get_waiter("instance_running")
            waiter.wait(
                InstanceIds=[instance_id],
                WaiterConfig={"Delay": 5, "MaxAttempts": 60},  # 5 minutes max
            )

            # Get public IP address
            response = ec2.describe_instances(InstanceIds=[instance_id])
            instance = response["Reservations"][0]["Instances"][0]
            public_ip = instance.get("PublicIpAddress")

            if not public_ip:
                logger.error(f"Instance {instance_id} has no public IP address")
                raise Exception("Failed to get public IP address for instance")

            logger.info(
                f"Successfully provisioned EC2 instance {instance_id} with IP {public_ip}"
            )

            return {
                "instance_id": instance_id,
                "public_ip": public_ip,
                "instance_type": aws_instance_type,
                "region": aws_region,
                "ami_id": ami_id,
                "key_pair_name": key_pair_name,
                "security_group_id": security_group_id,
                "hourly_rate": hourly_rate,
                "private_key_pem": private_key_pem,
            }

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to provision EC2 instance: {e}")
            # Cleanup on failure
            try:
                if "key_pair_name" in locals():
                    ec2.delete_key_pair(KeyName=key_pair_name)
            except Exception:
                pass
            raise Exception(f"EC2 provisioning failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during provisioning: {e}")
            raise Exception(f"Server provisioning failed: {str(e)}")

    def stop_server(self, instance_id: str, region: str) -> bool:
        """
        Stop a running EC2 instance.

        Args:
            instance_id: EC2 instance ID
            region: AWS region

        Returns:
            True if successful, False otherwise
        """
        try:
            ec2 = self._get_ec2_client(region)
            ec2.stop_instances(InstanceIds=[instance_id])

            logger.info(f"Stopping EC2 instance {instance_id}")

            # Wait for instance to stop
            waiter = ec2.get_waiter("instance_stopped")
            waiter.wait(
                InstanceIds=[instance_id],
                WaiterConfig={"Delay": 5, "MaxAttempts": 60},
            )

            logger.info(f"EC2 instance {instance_id} stopped successfully")
            return True

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to stop instance {instance_id}: {e}")
            return False

    def start_server(self, instance_id: str, region: str) -> bool:
        """
        Start a stopped EC2 instance.

        Args:
            instance_id: EC2 instance ID
            region: AWS region

        Returns:
            True if successful, False otherwise
        """
        try:
            ec2 = self._get_ec2_client(region)
            ec2.start_instances(InstanceIds=[instance_id])

            logger.info(f"Starting EC2 instance {instance_id}")

            # Wait for instance to start
            waiter = ec2.get_waiter("instance_running")
            waiter.wait(
                InstanceIds=[instance_id],
                WaiterConfig={"Delay": 5, "MaxAttempts": 60},
            )

            logger.info(f"EC2 instance {instance_id} started successfully")
            return True

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to start instance {instance_id}: {e}")
            return False

    def terminate_server(self, instance_id: str, region: str) -> bool:
        """
        Terminate an EC2 instance (permanent deletion).

        Args:
            instance_id: EC2 instance ID
            region: AWS region

        Returns:
            True if successful, False otherwise
        """
        try:
            ec2 = self._get_ec2_client(region)

            # Get instance details to find key pair name
            response = ec2.describe_instances(InstanceIds=[instance_id])
            if response["Reservations"]:
                instance = response["Reservations"][0]["Instances"][0]
                key_name = instance.get("KeyName")

                # Terminate instance
                ec2.terminate_instances(InstanceIds=[instance_id])
                logger.info(f"Terminated EC2 instance {instance_id}")

                # Delete associated key pair
                if key_name:
                    try:
                        ec2.delete_key_pair(KeyName=key_name)
                        logger.info(f"Deleted key pair {key_name}")
                    except Exception as e:
                        logger.warning(f"Failed to delete key pair {key_name}: {e}")

                return True
            else:
                logger.warning(f"Instance {instance_id} not found")
                return False

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to terminate instance {instance_id}: {e}")
            return False

    def get_server_status(self, instance_id: str, region: str) -> str:
        """
        Get current status of an EC2 instance.

        Args:
            instance_id: EC2 instance ID
            region: AWS region

        Returns:
            Status string: "pending", "running", "stopping", "stopped", "terminated", or "error"
        """
        try:
            ec2 = self._get_ec2_client(region)
            response = ec2.describe_instances(InstanceIds=[instance_id])

            if response["Reservations"]:
                instance = response["Reservations"][0]["Instances"][0]
                status = instance["State"]["Name"]
                return status
            else:
                logger.warning(f"Instance {instance_id} not found")
                return "error"

        except (ClientError, BotoCoreError) as e:
            logger.error(f"Failed to get status for instance {instance_id}: {e}")
            return "error"


# Singleton instance
aws_provisioner = AWSProvisioner()
