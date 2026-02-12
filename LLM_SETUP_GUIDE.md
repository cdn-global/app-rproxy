# LLM Feature Setup Guide

This guide explains the complete LLM chat feature setup for your application.

## Overview

The LLM feature allows users to chat with AI models (Claude) through a web interface. Users can:
- Try different AI models from the Language Models page
- Have conversations with AI
- Store conversation history
- Track token usage and costs

## Architecture

### Frontend Components

1. **Routes**
   - `/language-models/` - Lists available AI models ([frontend/src/routes/_layout/language-models/index.tsx](frontend/src/routes/_layout/language-models/index.tsx))
   - `/language-models/$modelName` - Chat interface for specific model ([frontend/src/routes/_layout/language-models/$modelName.tsx](frontend/src/routes/_layout/language-models/$modelName.tsx))
   - `/profile` - User profile with API key settings ([frontend/src/routes/_layout/profile.tsx](frontend/src/routes/_layout/profile.tsx))

2. **Components**
   - `ChatInterface` - Main chat UI ([frontend/src/components/LLM/ChatInterface.tsx](frontend/src/components/LLM/ChatInterface.tsx))
   - `ApiKeySettings` - Manage Anthropic API key ([frontend/src/components/UserSettings/ApiKeySettings.tsx](frontend/src/components/UserSettings/ApiKeySettings.tsx))

3. **Hooks**
   - `useLLMInference` - Handle chat API calls ([frontend/src/hooks/useLLMInference.ts](frontend/src/hooks/useLLMInference.ts))

### Backend API

1. **Endpoints**
   - `GET /v2/llm-models/` - List available models
   - `GET /v2/llm-models/{id}` - Get model details
   - `POST /v2/llm/chat/completions` - Send chat messages
   - `GET /v2/conversations/` - List user conversations
   - `GET /v2/conversations/{id}` - Get conversation details
   - `GET /v2/conversations/{id}/messages` - Get conversation messages
   - `PATCH /v2/users/me/api-key` - Update user's API key
   - `DELETE /v2/users/me/api-key` - Remove user's API key

2. **Database Tables**
   - `llm_provider` - AI providers (Anthropic, etc.)
   - `llm_model` - Available AI models with pricing
   - `conversation` - User conversations
   - `llm_message` - Individual messages in conversations
   - `llm_usage_log` - Track usage and costs
   - `user.anthropic_api_key` - Store user's API key

## Setup Instructions

### 1. Run Database Migrations

Apply the migrations to create the LLM tables:

```bash
cd backend
# If using alembic directly
alembic upgrade head

# Or if using uv
uv run alembic upgrade head
```

This will create:
- LLM provider and model tables
- Conversation and message tables
- Usage logging tables
- Add `anthropic_api_key` column to user table
- Pre-populate with Claude models (Sonnet 4.5, Opus 4.6, Haiku 4.5)

### 2. Configure Backend Environment

Add the following to `backend/.env` (optional - system fallback):

```env
# LLM Provider API Keys (System-wide fallback keys)
# These keys are used when users haven't configured their own API keys
# Users can override these by setting their own keys in the Profile page

# Anthropic API Key - Get from https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Google AI API Key - Get from https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=your-actual-google-key-here
```

**Note:**
- Users can set their own API keys in the Profile settings, which take priority over the system keys
- All usage is tracked for billing, including playground and API usage
- Only configure the providers you want to enable (you don't need all three)

### 3. Start the Services

```bash
# Terminal 1: Start backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Start frontend
cd frontend
npm run dev
```

### 4. Get API Keys from Providers

Choose which providers you want to enable:

**Anthropic (Claude)**
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)

**OpenAI (GPT)**
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-proj-` or `sk-`)

**Google AI (Gemini)**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 5. Configure API Keys

**Option A: System-wide keys (in backend/.env)**
- Paste the API keys in `backend/.env`
- These act as fallback when users don't have their own keys
- All usage is tracked and monitored

**Option B: User-specific keys (in Profile page)**
1. Log in to the application
2. Navigate to Profile (`/profile`)
3. Scroll to "API Configuration" section
4. Enter your API keys for the providers you want to use
5. Click "Save API Keys"
6. Only configured providers will be shown once saved

## Usage

### Testing the Feature

1. **View Models**
   - Go to `/language-models`
   - See list of available AI models with pricing

2. **Try a Model**
   - Click "Try Now" on any model
   - This opens `/language-models/{modelName}`
   - Select a model from the dropdown
   - Type a message and press Send

3. **Check Conversations**
   - Conversations are automatically created
   - Each message is saved with token usage and cost
   - Usage is logged for tracking

## API Key Priority

The system checks for API keys in this order:
1. **User's personal API key** (from Profile settings)
2. **System fallback key** (from backend/.env)

If neither is available, users will see an error prompting them to set their API key.

**Important:** All usage is tracked for billing, regardless of whether you use:
- System fallback keys
- User personal keys
- Playground
- Production API calls

## Security Notes

- API keys are stored encrypted in the database
- Keys are never exposed in API responses (only booleans like `has_anthropic_key`, `has_openai_key`, `has_google_key`)
- Each user's key is used only for their own requests
- SSL/TLS should be enabled in production
- System fallback keys in `.env` should be protected with proper file permissions

## Cost Tracking

The system tracks:
- Input tokens used
- Output tokens used
- Total cost per message
- Usage logs per user/model/conversation

You can query `llm_usage_log` table for analytics and billing.

## Model Pricing (per million tokens)

| Model | Input Price | Output Price |
|-------|------------|--------------|
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Opus 4.6 | $15.00 | $75.00 |
| Claude Haiku 4.5 | $0.80 | $4.00 |

## Troubleshooting

### "Page not found" error
- Ensure frontend dev server was restarted after adding the route
- Check that `routeTree.gen.ts` includes the `$modelName` route

### "API key required" error
- Set your API key in Profile settings
- Or add `ANTHROPIC_API_KEY` to backend/.env

### "Subscription required" error
- User must have an active subscription or trial
- Check `has_subscription` or `is_trial` in user table

### Migration errors
- Ensure all previous migrations are applied
- Check database connection
- Verify PostgreSQL is running

## Files Modified/Created

### Frontend
- ✅ `frontend/src/routes/_layout/language-models/$modelName.tsx` (new)
- ✅ `frontend/src/components/LLM/ChatInterface.tsx` (new)
- ✅ `frontend/src/components/UserSettings/ApiKeySettings.tsx` (new)
- ✅ `frontend/src/hooks/useLLMInference.ts` (new)
- ✅ `frontend/src/routes/_layout/profile.tsx` (modified)
- ✅ `frontend/src/routeTree.gen.ts` (auto-generated)

### Backend
- ✅ `backend/app/api/routes/llm_models.py` (new)
- ✅ `backend/app/api/routes/llm_inference.py` (new)
- ✅ `backend/app/api/routes/conversations.py` (new)
- ✅ `backend/app/api/main.py` (modified - added LLM routes)
- ✅ `backend/app/models.py` (modified - added LLM models)
- ✅ `backend/app/alembic/versions/4f9c8a7b2e1d_add_anthropic_api_key_to_user.py` (new)
- ✅ `backend/app/alembic/versions/5e9d7f3c2b1a_add_llm_tables.py` (new)

## Next Steps

1. Run the database migrations
2. Start both frontend and backend servers
3. Set your Anthropic API key in Profile
4. Try the "Try Now" button on the Language Models page
5. Start chatting with Claude!

## Support

For issues or questions:
- Check the browser console for frontend errors
- Check backend logs for API errors
- Verify database migrations were successful
- Ensure API key is valid and has credits
