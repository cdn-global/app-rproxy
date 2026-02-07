#!/bin/bash
# PostgreSQL database provisioning script

set -e

# Arguments
INSTANCE_ID=$1
USER_ID=$2
INSTANCE_NAME=$3
POSTGRES_VERSION=${4:-16}
STORAGE_GB=${5:-10}
CPU_CORES=${6:-1}
MEMORY_GB=${7:-2}

if [ -z "$INSTANCE_ID" ] || [ -z "$USER_ID" ] || [ -z "$INSTANCE_NAME" ]; then
    echo "Usage: $0 <instance_id> <user_id> <instance_name> [postgres_version] [storage_gb] [cpu_cores] [memory_gb]"
    exit 1
fi

echo "Provisioning PostgreSQL database instance: $INSTANCE_ID"
echo "User: $USER_ID"
echo "Instance Name: $INSTANCE_NAME"
echo "PostgreSQL Version: $POSTGRES_VERSION"
echo "Storage: ${STORAGE_GB}GB"
echo "CPUs: $CPU_CORES"
echo "Memory: ${MEMORY_GB}GB"

# Generate random database credentials
DB_PASSWORD=$(openssl rand -base64 32)
DB_USER="user_$(echo $USER_ID | tr -d '-')"
DB_NAME=$(echo $INSTANCE_NAME | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr '-' '_')
CONTAINER_NAME="db-${INSTANCE_ID}"
VOLUME_NAME="db-${INSTANCE_ID}-data"

echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Create Docker volume for persistent storage
docker volume create "$VOLUME_NAME"

# Create and start PostgreSQL container
docker run -d \
    --name "$CONTAINER_NAME" \
    --memory "${MEMORY_GB}g" \
    --cpus="$CPU_CORES" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -e PGDATA="/var/lib/postgresql/data/pgdata" \
    -v "${VOLUME_NAME}:/var/lib/postgresql/data" \
    -l "managed_by=app-rproxy" \
    -l "user_id=$USER_ID" \
    -l "instance_id=$INSTANCE_ID" \
    -l "instance_name=$INSTANCE_NAME" \
    -l "storage_gb=$STORAGE_GB" \
    -p 5432 \
    --shm-size=256m \
    "postgres:${POSTGRES_VERSION}"

# Wait for container to start
sleep 5

# Get container ID
CONTAINER_ID=$(docker ps -q -f name="$CONTAINER_NAME")

if [ -z "$CONTAINER_ID" ]; then
    echo "Failed to create container"
    exit 1
fi

# Get mapped PostgreSQL port
DB_PORT=$(docker port "$CONTAINER_NAME" 5432 | cut -d: -f2)

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_USER" > /dev/null 2>&1; then
        echo "PostgreSQL is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "PostgreSQL failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

echo "Database instance created successfully!"
echo "Container ID: $CONTAINER_ID"
echo "Database Port: $DB_PORT"
echo "Database Password: $DB_PASSWORD"
echo "Connection String: postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"
