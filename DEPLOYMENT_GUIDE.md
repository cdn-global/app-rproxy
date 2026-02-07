# 🚀 Deployment Guide - Storage & Inference Platform

## Prerequisites Checklist

- [ ] API Keys obtained (see below)
- [ ] `.env` file updated with actual keys
- [ ] MinIO configuration added to docker-compose.yml ✅
- [ ] Storage models and routes created ✅
- [ ] Alembic migration ready ✅

---

## Part 1: Get API Keys (5-10 minutes)

### 1. Anthropic (Claude) - Required for Claude models
1. Visit: https://console.anthropic.com/settings/keys
2. Sign up → Create API key
3. Copy key starting with `sk-ant-api03-`
4. Paste into `.env`: `ANTHROPIC_API_KEY=sk-ant-api03-...`

### 2. OpenAI (GPT) - Required for GPT models
1. Visit: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy key starting with `sk-proj-` or `sk-`
4. Paste into `.env`: `OPENAI_API_KEY=sk-proj-...`

### 3. HuggingFace - Required for Llama/Qwen models
1. Visit: https://huggingface.co/settings/tokens
2. Create new token (Read access)
3. Copy token starting with `hf_`
4. Paste into `.env`: `HUGGINGFACE_API_KEY=hf_...`

---

## Part 2: Local Testing (5 minutes)

```bash
# 1. Test your API keys
./test_api_keys.sh

# 2. Restart backend to pick up new keys
docker compose restart backend

# 3. Check logs for errors
docker compose logs backend | tail -50

# 4. Test inference endpoint
curl -X GET http://localhost:8000/v2/inference/models \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Part 3: Deploy to EC2 (10-15 minutes)

### Step 1: Update .env on EC2

**IMPORTANT**: The `.env` file is gitignored, so you must manually update it on EC2.

```bash
# Option A: Edit directly on EC2 (via AWS Console browser terminal)
cd ~/platform-roamingproxy.com
nano .env

# Add your API keys:
# ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY
# OPENAI_API_KEY=sk-proj-YOUR_KEY
# HUGGINGFACE_API_KEY=hf_YOUR_KEY
#
# MINIO_ENDPOINT=minio:9000
# MINIO_ROOT_USER=minioadmin
# MINIO_ROOT_PASSWORD=minioadmin
# MINIO_USE_SSL=false

# Save: Ctrl+O, Enter, Ctrl+X
```

**Option B**: Use environment variables (recommended for secrets)

```bash
# On EC2, create a .env.production file:
cd ~/platform-roamingproxy.com
cat > .env.production <<'EOF'
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY
HUGGINGFACE_API_KEY=hf_YOUR_ACTUAL_KEY
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_USE_SSL=false
EOF

# Merge with existing .env
cat .env.production >> .env
rm .env.production
```

### Step 2: Deploy Code

```bash
# Pull latest code
cd ~/platform-roamingproxy.com
git pull origin main

# Build and restart services
docker compose build
docker compose up -d

# Wait for services to start
sleep 30
```

### Step 3: Run Database Migrations

```bash
# Run storage migration
docker compose exec backend alembic upgrade head

# Verify current migration
docker compose exec backend alembic current
# Should show: d8f3a9b2c1e5 (head)
```

### Step 4: Seed Inference Models

```bash
# Get your access token first by logging in at cloud.roamingproxy.com
# Then run:

curl -X POST https://api.roamingproxy.com/v2/inference/models/seed \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected response:
# {"created": 7, "skipped": 0}
```

### Step 5: Verify Services

```bash
# Check all containers are running
docker compose ps

# Check backend logs for errors
docker compose logs backend | tail -100

# Check MinIO is running
curl http://localhost:9000/minio/health/live
# Expected: <ServerStatus>ok</ServerStatus>

# Access MinIO console
echo "MinIO Console: http://YOUR_EC2_IP:9001"
echo "Username: minioadmin"
echo "Password: minioadmin"
```

---

## Part 4: Test Everything (5 minutes)

### 1. Test Inference Playground

1. Visit: https://cloud.roamingproxy.com/language-models/llm-service
2. Select a model (e.g., "Claude Haiku 4.5")
3. Enter prompt: "Say hello in 5 words"
4. Click "Run Inference"
5. Verify response appears with token/cost metrics

### 2. Test Storage API

```bash
# Create a test bucket
curl -X POST https://api.roamingproxy.com/v2/storage/buckets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bucket_name": "test-bucket-001",
    "region": "us-east-1",
    "storage_class": "standard"
  }'

# List buckets
curl https://api.roamingproxy.com/v2/storage/buckets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get usage summary
curl https://api.roamingproxy.com/v2/storage/usage/summary \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Storage UI

1. Visit: https://cloud.roamingproxy.com/storage
2. Verify "test-bucket-001" appears in the list
3. Check usage summary displays correctly

---

## Troubleshooting

### "Inference failed: Anthropic API key not configured"
- Run `test_api_keys.sh` to verify keys
- Ensure `.env` has actual keys (not placeholders)
- Restart backend: `docker compose restart backend`
- Check logs: `docker compose logs backend | grep -i anthropic`

### "Bucket provisioning failed"
- Check MinIO is running: `docker compose ps minio`
- Check MinIO logs: `docker compose logs minio`
- Verify network: `docker compose exec backend ping minio`

### "Migration failed"
- Check current version: `docker compose exec backend alembic current`
- View migration history: `docker compose exec backend alembic history`
- Force stamp: `docker compose exec backend alembic stamp head`

### "Connection closed" (Terminal WebSocket)
- Verify asyncssh installed: `docker compose exec backend pip show asyncssh`
- Check EC2 security group allows port 22
- Verify server has public IP
- Test direct SSH: `ssh -i key.pem ubuntu@EC2_IP`

---

## Quick Reference

### Useful Commands

```bash
# View all containers
docker compose ps

# View backend logs
docker compose logs -f backend

# Restart specific service
docker compose restart backend

# Rebuild after code changes
docker compose build backend
docker compose up -d backend

# Access backend shell
docker compose exec backend bash

# Run database migrations
docker compose exec backend alembic upgrade head

# Check migration status
docker compose exec backend alembic current

# Access MinIO console
# http://YOUR_EC2_IP:9001 (minioadmin / minioadmin)
```

### API Endpoints

- **Inference**: https://api.roamingproxy.com/v2/inference/
- **Storage**: https://api.roamingproxy.com/v2/storage/
- **Frontend**: https://cloud.roamingproxy.com/

### File Locations

- Backend code: `/Users/nik/app-rproxy/backend/`
- Frontend code: `/Users/nik/app-rproxy/frontend/`
- Migrations: `/Users/nik/app-rproxy/backend/app/alembic/versions/`
- Docker compose: `/Users/nik/app-rproxy/docker-compose.yml`
- Environment: `/Users/nik/app-rproxy/.env`

---

## Success Criteria ✅

- [ ] All API keys working (run `test_api_keys.sh`)
- [ ] Backend container running
- [ ] MinIO container running
- [ ] Database migration at `d8f3a9b2c1e5`
- [ ] 7 inference models seeded
- [ ] Inference playground works (can run prompts)
- [ ] Storage page loads (shows buckets)
- [ ] Can create storage buckets
- [ ] No errors in `docker compose logs`

---

## Next Steps After Deployment

1. **Set Up Monitoring**: Add health checks and alerts
2. **Configure Backups**: Set up automated backups for PostgreSQL and MinIO
3. **Add Bucket Upload UI**: Build frontend for presigned URL uploads
4. **Set Usage Limits**: Implement rate limiting and quotas
5. **Documentation**: Create user guide for storage and inference features

---

**Need help?** Check logs with `docker compose logs backend | tail -100`
