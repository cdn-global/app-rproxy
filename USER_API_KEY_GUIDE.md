# User API Key Setup Guide

This guide shows **end users** how to configure their personal API keys to use the LLM service.

## Overview

There are TWO ways to configure API keys:

### 1. System-Wide Keys (Admin Only)
- Configured by admins via REST API or `.env` file
- Acts as fallback for all users
- **Use this if:** You want all users to share the same API keys (billed to you)

### 2. Personal API Keys (Any User)
- Each user configures their own keys in Profile settings
- Takes priority over system keys
- **Use this if:** Users bring their own API keys (BYOK model)

---

## For End Users: Configure Your Personal API Keys

### Step 1: Get API Keys from Providers

Choose which providers you want to use:

**Anthropic (Claude)**
1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the key (starts with `sk-ant-`)

**OpenAI (GPT)**
1. Go to https://platform.openai.com/api-keys
2. Click "+ Create new secret key"
3. Copy the key (starts with `sk-` or `sk-proj-`)

**Google AI (Gemini)**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API key"
3. Copy the key

### Step 2: Add Keys in Profile

1. **Login** to your account
2. Navigate to **Profile** page (`/profile`)
3. Scroll to **"API Configuration"** section
4. Enter your API keys:
   - Paste Anthropic key in "Anthropic API Key" field
   - Paste OpenAI key in "OpenAI API Key" field
   - Paste Google key in "Google API Key" field
5. Click **"Save API Keys"**

### Step 3: Verify Models Are Available

1. Go to **Language Models** page (`/language-models`)
2. You should now see models for the providers you configured
3. Click "Try Now" to test the playground

---

## API Endpoints for User Keys

### Get Your API Key Status

**GET** `/v2/users/me/api-key-status`

Check which of your personal API keys are configured.

```bash
curl -X GET "http://localhost:8000/v2/users/me/api-key-status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "has_anthropic_key": true,
  "has_openai_key": false,
  "has_google_key": true
}
```

### Update Your API Keys

**PATCH** `/v2/users/me/api-key`

Update your personal API keys.

```bash
curl -X PATCH "http://localhost:8000/v2/users/me/api-key" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anthropic_api_key": "sk-ant-YOUR-KEY-HERE",
    "openai_api_key": "sk-YOUR-KEY-HERE"
  }'
```

### Delete Your API Keys

**DELETE** `/v2/users/me/api-key`

Remove all your API keys.

```bash
curl -X DELETE "http://localhost:8000/v2/users/me/api-key" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## API Key Priority

When you make an LLM request, the system checks for API keys in this order:

1. ✅ **Your personal API key** (if configured in Profile)
2. ⬇️ **System fallback key** (if admin configured one)
3. ❌ **Error** (if neither exists)

**Example:**
- You configured Anthropic key: ✅ Uses YOUR key
- You didn't configure OpenAI key, but admin did: ✅ Uses SYSTEM key
- Neither you nor admin configured Google key: ❌ Error

---

## Usage Tracking

**IMPORTANT:** All usage is tracked for billing, including:
- Playground usage
- API calls
- Both personal and system API keys

You can view your usage in:
- **Billing** page (`/language-models/billing`)
- **Usage Reports** (My Usage section)

---

## Example: Complete Setup

```bash
# 1. Get your access token
curl -X POST "http://localhost:8000/v2/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your@email.com&password=yourpassword"

# Save the token
export TOKEN="eyJhbGc..."

# 2. Check current API key status
curl -X GET "http://localhost:8000/v2/users/me/api-key-status" \
  -H "Authorization: Bearer $TOKEN"

# 3. Add your Anthropic API key
curl -X PATCH "http://localhost:8000/v2/users/me/api-key" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"anthropic_api_key": "sk-ant-api03-YOUR-REAL-KEY-HERE"}'

# 4. Verify models are now available
curl "http://localhost:8000/v2/llm-models/?is_active=true" \
  -H "Authorization: Bearer $TOKEN"

# 5. Use the chat endpoint
curl -X POST "http://localhost:8000/v2/llm/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "564e8710-43a9-406f-b0ab-e8d651a33e82",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 1024,
    "temperature": 0.7
  }'
```

---

## Wrapping Provider Requests

When you configure your API key, the system:

1. ✅ **Stores your key encrypted** in the database
2. ✅ **Uses YOUR key** for all requests you make
3. ✅ **Tracks all usage** under your account
4. ✅ **Never exposes keys** in API responses

Your API calls flow like this:
```
Your App → Your API Key Request → This Service → Provider (Anthropic/OpenAI/Google)
                                       ↓
                                 Usage Tracked
                                       ↓
                                 Response → Your App
```

---

## Security Best Practices

- 🔐 **Never share** your API keys
- 🔄 **Rotate keys** regularly
- 📊 **Monitor usage** to detect anomalies
- 🚫 **Delete keys** when not needed
- 🔒 **Use HTTPS** in production

---

## Troubleshooting

**"No models available"**
- You haven't configured any API keys yet
- Or only placeholder keys exist (not real ones)
- Solution: Add real API keys in Profile

**"API key required" error**
- Neither you nor admin have configured an API key for that provider
- Solution: Add an API key for that provider

**Keys not saving**
- Check browser console for errors
- Ensure you're logged in
- Verify the key format is correct

