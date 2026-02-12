# LLM API Key Management - REST API Guide

This guide shows how to manage system-wide LLM API keys via REST API.

## Endpoints

### 1. Get System API Keys Status

**GET** `/v2/admin/llm-keys/`

Returns the current status of system API keys (superuser only).

**Request:**
```bash
curl -X GET "http://localhost:8000/v2/admin/llm-keys/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "anthropic_masked": "sk-ant-a...b123",
  "openai_masked": "sk-proj-...xyz9",
  "google_masked": null,
  "anthropic_configured": true,
  "openai_configured": true,
  "google_configured": false
}
```

### 2. Update System API Keys

**PATCH** `/v2/admin/llm-keys/`

Updates system API keys in the `.env` file (superuser only).

**Request:**
```bash
curl -X PATCH "http://localhost:8000/v2/admin/llm-keys/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anthropic_api_key": "sk-ant-YOUR-REAL-KEY-HERE",
    "openai_api_key": "sk-proj-YOUR-REAL-KEY-HERE",
    "google_api_key": "YOUR-GOOGLE-KEY-HERE"
  }'
```

**Response:**
```json
{
  "message": "System API keys updated successfully",
  "note": "Changes are applied immediately. No restart required."
}
```

## Authentication

You need a superuser access token. Get it by logging in as admin:

```bash
# Login as superuser
curl -X POST "http://localhost:8000/v2/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@ROAMINGPROXY.com&password=YOUR_ADMIN_PASSWORD"

# Extract token from response
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

## Features

- ✅ **Superuser only** - Only admins can view/update system keys
- ✅ **Masked display** - Keys are shown partially (first 8 + last 4 chars)
- ✅ **Live updates** - Changes apply immediately without restart
- ✅ **Persistent** - Keys are saved to `.env` file
- ✅ **Placeholder filtering** - Invalid/placeholder keys are marked as not configured

## Example Workflow

```bash
# 1. Get your admin token
TOKEN=$(curl -X POST "http://localhost:8000/v2/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@ROAMINGPROXY.com&password=x7k9p2m4n5q8r" \
  | jq -r '.access_token')

# 2. Check current API key status
curl -X GET "http://localhost:8000/v2/admin/llm-keys/" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Update Anthropic API key
curl -X PATCH "http://localhost:8000/v2/admin/llm-keys/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anthropic_api_key": "sk-ant-api03-YOUR-REAL-KEY-HERE"
  }' | jq

# 4. Verify models are now available
curl "http://localhost:8000/v2/llm-models/?is_active=true" | jq '.data[].display_name'
```

## Security Notes

- ⚠️ **Never commit** API keys to version control
- 🔒 **Use HTTPS** in production to protect keys in transit
- 👤 **Superuser only** - Regular users cannot access these endpoints
- 📝 **Audit trail** - Consider logging API key updates
- 🔐 **Environment variables** - Keys are stored in `.env` file

## Troubleshooting

**403 Forbidden**
- You need to be logged in as a superuser
- Check that your user has `is_superuser=True`

**404 .env not found**
- Ensure `.env` file exists in backend directory
- Check file permissions

**Keys not showing after update**
- Verify the key doesn't contain placeholder patterns
- Check that the key format is correct (starts with `sk-ant-`, `sk-proj-`, etc.)

