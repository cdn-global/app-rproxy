# LLM Service Architecture

## Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User/Client                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 1. Login & Get Token
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Layer                         │
│  POST /v2/login/access-token                                    │
│  Returns: JWT Token                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 2. Configure API Keys (Optional)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User API Key Management                       │
│  GET    /v2/users/me/api-key-status                             │
│  PATCH  /v2/users/me/api-key                                    │
│  DELETE /v2/users/me/api-key                                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 3. Get Available Models
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Model Discovery Layer                         │
│  GET /v2/llm-models/?is_active=true                            │
│                                                                  │
│  Filters models based on:                                       │
│  - User's API keys (if configured)                              │
│  - System fallback keys (if configured)                         │
│  - Returns: List of available models with pricing               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 4. Make LLM Request
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Inference Layer                           │
│  POST /v2/llm/chat/completions                                  │
│  POST /v2/llm/chat/completions/stream                           │
│                                                                  │
│  API Key Selection Priority:                                    │
│  1. User's personal API key (from database)                     │
│  2. System fallback key (from .env/settings)                    │
│  3. Error if neither exists                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                   ┌─────────┴──────────┐
                   │                    │
                   ▼                    ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Provider APIs   │  │  Usage Tracking  │
         │                  │  │                  │
         │ • Anthropic      │  │ • llm_usage_log  │
         │ • OpenAI         │  │ • Token counts   │
         │ • Google         │  │ • Cost calc      │
         └──────────────────┘  └──────────────────┘
                   │                    │
                   └─────────┬──────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │   Response to    │
                   │   User/Client    │
                   └──────────────────┘
```

## API Key Management

### Two-Tier System

```
┌────────────────────────────────────────────────────────┐
│                  System-Wide Keys                       │
│  Location: backend/.env                                 │
│  Access: Admin only                                     │
│  Purpose: Fallback for all users                        │
│                                                         │
│  ANTHROPIC_API_KEY=sk-ant-...                          │
│  OPENAI_API_KEY=sk-proj-...                            │
│  GOOGLE_API_KEY=...                                     │
└────────────────────────────────────────────────────────┘
                             │
                             │ Fallback (if user has no key)
                             ▼
┌────────────────────────────────────────────────────────┐
│                   User Personal Keys                    │
│  Location: database (encrypted)                         │
│  Access: Each user manages their own                    │
│  Purpose: BYOK (Bring Your Own Key) model              │
│                                                         │
│  user.anthropic_api_key                                 │
│  user.openai_api_key                                    │
│  user.google_api_key                                    │
└────────────────────────────────────────────────────────┘
```

## Usage Tracking Flow

```
Request → API Key Check → Provider Call → Response
   │                                          │
   │                                          │
   ▼                                          ▼
┌─────────────────┐                ┌─────────────────┐
│  Conversation   │                │  LLM Message    │
│  - User ID      │                │  - Role         │
│  - Model ID     │                │  - Content      │
│  - Created At   │                │  - Tokens       │
└─────────────────┘                │  - Cost         │
                                   └─────────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │ LLM Usage Log   │
                                   │  - User ID      │
                                   │  - Model ID     │
                                   │  - Input Tokens │
                                   │  - Output Tokens│
                                   │  - Total Cost   │
                                   └─────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layer                        │
└─────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────┐ ┌─────────────────┐
│  Authentication  │ │  Key Storage │ │ Request Isolation│
│                  │ │              │ │                  │
│ • JWT Tokens     │ │ • Encrypted  │ │ • User keys only │
│ • User Sessions  │ │ • Database   │ │   for that user  │
│ • Superuser      │ │ • Masked API │ │ • No key leakage │
│   checks         │ │   responses  │ │ • Rate limiting  │
└──────────────────┘ └──────────────┘ └─────────────────┘
```

## Data Flow Example

### Scenario: User makes a chat request

```
1. User Login
   POST /v2/login/access-token
   username=user@example.com&password=secret
   ← Returns: JWT Token

2. User Configures API Key
   PATCH /v2/users/me/api-key
   Header: Authorization: Bearer {token}
   Body: {"anthropic_api_key": "sk-ant-real-key"}
   ← Saves encrypted to database

3. User Gets Available Models
   GET /v2/llm-models/?is_active=true
   Header: Authorization: Bearer {token}
   ← Returns: Claude models (because user has Anthropic key)

4. User Sends Chat Message
   POST /v2/llm/chat/completions
   Header: Authorization: Bearer {token}
   Body: {
     "model_id": "564e8710-43a9-406f-b0ab-e8d651a33e82",
     "messages": [{"role": "user", "content": "Hello"}]
   }
   
   Backend:
   a. Checks user.anthropic_api_key (found!)
   b. Calls Anthropic API with user's key
   c. Tracks usage in llm_usage_log
   d. Returns response
   
   ← Returns: Assistant message

5. User Views Usage
   GET /v2/billing/usage/my-usage?days=30
   Header: Authorization: Bearer {token}
   ← Returns: Usage stats with costs
```

## Cost Calculation

```
Input Tokens × (Input Price / 1M) = Input Cost
Output Tokens × (Output Price / 1M) = Output Cost
Total Cost = Input Cost + Output Cost

Example:
  Input: 1000 tokens @ $3/M  = $0.003
  Output: 500 tokens @ $15/M = $0.0075
  Total = $0.0105
```

## Admin vs User Permissions

```
┌──────────────────────────────────────────────────────┐
│                 Admin (Superuser)                     │
├──────────────────────────────────────────────────────┤
│ ✓ Manage system-wide API keys                        │
│ ✓ View all users' usage                              │
│ ✓ Access /v2/admin/llm-keys/ endpoints               │
│ ✓ Configure fallback keys in .env                    │
│ ✓ View billing reports for all users                 │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  Regular User                         │
├──────────────────────────────────────────────────────┤
│ ✓ Manage own API keys                                │
│ ✓ View own usage only                                │
│ ✓ Access /v2/users/me/* endpoints                    │
│ ✓ Use LLM chat features                              │
│ ✗ Cannot access admin endpoints                      │
│ ✗ Cannot view other users' data                      │
└──────────────────────────────────────────────────────┘
```

