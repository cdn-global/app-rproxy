# Quick Start Guide - LLM Service

## Problem: "No models available"

You're seeing this because there are no **real** API keys configured. Here are your options:

---

## Option 1: User API Keys (Recommended for BYOK)

**Best for:** Users bring their own API keys, each user is billed separately

### Via UI (Frontend)

1. **Login** to your account
2. Go to **Profile** page
3. Scroll to **"API Configuration"**
4. Enter your API key(s):
   ```
   Anthropic: sk-ant-api03-YOUR-KEY-HERE
   OpenAI: sk-YOUR-KEY-HERE
   Google: YOUR-KEY-HERE
   ```
5. Click **"Save API Keys"**
6. Go to **Language Models** page → Models will appear! ✅

### Via REST API

```bash
# Login
TOKEN=$(curl -s -X POST "http://localhost:8000/v2/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your@email.com&password=yourpassword" \
  | jq -r '.access_token')

# Add your API key
curl -X PATCH "http://localhost:8000/v2/users/me/api-key" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"anthropic_api_key": "sk-ant-YOUR-REAL-KEY"}'

# Verify models appear
curl "http://localhost:8000/v2/llm-models/?is_active=true" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[].display_name'
```

---

## Option 2: System-Wide Keys (For Shared Usage)

**Best for:** All users share the same API keys, billed to the system

### Method A: Edit .env File

```bash
cd /workspaces/app-rproxy/backend

# Edit .env
nano .env

# Replace placeholders with real keys:
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-REAL-KEY-HERE
OPENAI_API_KEY=sk-YOUR-REAL-KEY-HERE
GOOGLE_API_KEY=YOUR-REAL-KEY-HERE

# No restart needed! Changes apply immediately
```

### Method B: Use Admin REST API

```bash
# Login as admin
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8000/v2/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@ROAMINGPROXY.com&password=x7k9p2m4n5q8r" \
  | jq -r '.access_token')

# Update system keys
curl -X PATCH "http://localhost:8000/v2/admin/llm-keys/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "anthropic_api_key": "sk-ant-YOUR-REAL-KEY",
    "openai_api_key": "sk-YOUR-REAL-KEY"
  }'

# Models will appear for ALL users
```

---

## Where to Get API Keys

### Anthropic (Claude)
- https://console.anthropic.com/settings/keys
- Click "Create Key"
- Copy key starting with `sk-ant-`

### OpenAI (GPT)
- https://platform.openai.com/api-keys
- Click "+ Create new secret key"
- Copy key starting with `sk-` or `sk-proj-`

### Google AI (Gemini)
- https://aistudio.google.com/app/apikey
- Click "Create API key"
- Copy the key

---

## Verify It's Working

```bash
# Check models endpoint
curl -s http://localhost:8000/v2/llm-models/?is_active=true | jq

# Should return models like:
# {
#   "data": [
#     {"display_name": "Claude Sonnet 4.5", "provider": "anthropic"},
#     {"display_name": "GPT-4o", "provider": "openai"}
#   ],
#   "count": 8
# }
```

---

## Understanding the Two-Tier System

```
┌───────────────────────────────────────────┐
│  User's Personal API Key (Priority 1)     │
│  - Configured in Profile                  │
│  - Overrides system key                   │
│  - Billed to user                         │
└───────────────────────────────────────────┘
                    ↓ (if not set)
┌───────────────────────────────────────────┐
│  System Fallback Key (Priority 2)         │
│  - Configured in .env or via admin API    │
│  - Used when user has no key             │
│  - Billed to system                       │
└───────────────────────────────────────────┘
                    ↓ (if not set)
┌───────────────────────────────────────────┐
│  Error: No API key configured             │
└───────────────────────────────────────────┘
```

---

## Usage Examples

### Make a Chat Request

```bash
# Get model ID
MODEL_ID=$(curl -s "http://localhost:8000/v2/llm-models/?is_active=true" \
  -H "Authorization: Bearer $TOKEN" \
  | jq -r '.data[0].id')

# Send chat message
curl -X POST "http://localhost:8000/v2/llm/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"model_id\": \"$MODEL_ID\",
    \"messages\": [{\"role\": \"user\", \"content\": \"Hello!\"}],
    \"max_tokens\": 1024,
    \"temperature\": 0.7
  }"
```

### View Your Usage

```bash
curl "http://localhost:8000/v2/billing/usage/my-usage?days=30" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Documentation Files

- **[USER_API_KEY_GUIDE.md](USER_API_KEY_GUIDE.md)** - End user guide for personal API keys
- **[API_KEY_MANAGEMENT.md](API_KEY_MANAGEMENT.md)** - Admin guide for system-wide keys
- **[LLM_ARCHITECTURE.md](LLM_ARCHITECTURE.md)** - Architecture diagrams and data flow
- **[LLM_SETUP_GUIDE.md](LLM_SETUP_GUIDE.md)** - Complete setup and configuration guide

---

## Troubleshooting

**"No models available"**
→ Add a real API key (not placeholder) via User or System method above

**Models still not showing after adding key**
→ Check key doesn't contain placeholder patterns like "your-key-here"

**"API key required" error when chatting**
→ That provider needs an API key. Add one for that specific provider.

**Want to test without real keys?**
→ You can't! The system filters out placeholder values for security.
→ Sign up for free tier at Anthropic/OpenAI/Google to get test keys.

---

## Next Steps

1. ✅ Add at least one real API key (user or system)
2. ✅ Verify models appear on `/language-models` page
3. ✅ Test the playground with a simple message
4. ✅ Set up usage tracking and billing reports
5. ✅ Configure rate limits and quotas (optional)

