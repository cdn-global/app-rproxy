#!/bin/bash
# Server provisioning script for Docker-based remote servers

set -e

# Arguments
SERVER_ID=$1
USER_ID=$2
SERVER_TYPE=$3
CPU_CORES=${4:-1}
MEMORY_GB=${5:-2}
GPU_TYPE=${6:-""}

if [ -z "$SERVER_ID" ] || [ -z "$USER_ID" ] || [ -z "$SERVER_TYPE" ]; then
    echo "Usage: $0 <server_id> <user_id> <server_type> [cpu_cores] [memory_gb] [gpu_type]"
    exit 1
fi

echo "Provisioning server: $SERVER_ID"
echo "User: $USER_ID"
echo "Type: $SERVER_TYPE"
echo "CPUs: $CPU_CORES"
echo "Memory: ${MEMORY_GB}GB"

# Generate random SSH password
SSH_PASSWORD=$(openssl rand -base64 32)
CONTAINER_NAME="server-${SERVER_ID}"

# Select Docker image based on server type
case $SERVER_TYPE in
    ssh)
        IMAGE="linuxserver/openssh-server:latest"
        ;;
    gpu)
        IMAGE="nvidia/cuda:12.0-runtime-ubuntu22.04"
        ;;
    inference)
        IMAGE="ubuntu:22.04"
        ;;
    *)
        echo "Unknown server type: $SERVER_TYPE"
        exit 1
        ;;
esac

echo "Using image: $IMAGE"

# Create and start container
if [ "$SERVER_TYPE" = "gpu" ] && [ -n "$GPU_TYPE" ]; then
    # GPU-enabled container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --gpus all \
        --memory "${MEMORY_GB}g" \
        --cpus="$CPU_CORES" \
        -e PASSWORD="$SSH_PASSWORD" \
        -e USER_NAME="user_${USER_ID}" \
        -l "managed_by=app-rproxy" \
        -l "user_id=$USER_ID" \
        -l "server_id=$SERVER_ID" \
        -l "server_type=$SERVER_TYPE" \
        -p 2222 \
        "$IMAGE"
else
    # Regular container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --memory "${MEMORY_GB}g" \
        --cpus="$CPU_CORES" \
        -e PASSWORD="$SSH_PASSWORD" \
        -e USER_NAME="user_${USER_ID}" \
        -l "managed_by=app-rproxy" \
        -l "user_id=$USER_ID" \
        -l "server_id=$SERVER_ID" \
        -l "server_type=$SERVER_TYPE" \
        -p 2222 \
        "$IMAGE"
fi

# Get container ID
CONTAINER_ID=$(docker ps -q -f name="$CONTAINER_NAME")

if [ -z "$CONTAINER_ID" ]; then
    echo "Failed to create container"
    exit 1
fi

# Get mapped SSH port
SSH_PORT=$(docker port "$CONTAINER_NAME" 2222 | cut -d: -f2)

echo "Container created successfully!"
echo "Container ID: $CONTAINER_ID"
echo "SSH Port: $SSH_PORT"
echo "SSH Password: $SSH_PASSWORD"
echo "Connection: ssh user_${USER_ID}@localhost -p $SSH_PORT"
