# LLM API Testing Guide

This guide explains how to test the LLM API endpoints using curl and Python.

## Prerequisites

1. **Running Backend**: Make sure the backend server is running on `http://localhost:8000`
2. **Access Token**: You need a valid access token for authentication
3. **API Key**: Make sure you have set your LLM provider API key (Anthropic, OpenAI, or Google) in your profile settings

## Getting Your Access Token

### Method 1: From Browser (easiest)
1. Open your browser and log in to the application
2. Open Developer Tools (F12)
3. Go to Application/Storage → Local Storage
4. Copy the value of `access_token`

### Method 2: Via Login API
```bash
curl -X POST "http://localhost:8000/v2/login/access-token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=your_email@example.com&password=your_password"
```

## Testing with Bash/cURL

### 1. Set your access token
```bash
export ACCESS_TOKEN="your_access_token_here"
```

### 2. Run the test script
```bash
./test_llm_api.sh
```

### Manual cURL Examples

#### List Available Models
```bash
curl -X GET "http://localhost:8000/v2/llm-models/?is_active=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### Create Chat Completion
```bash
# First, get a model ID from the list above
MODEL_ID="your-model-id-here"

curl -X POST "http://localhost:8000/v2/llm/chat/completions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "'$MODEL_ID'",
    "messages": [
      {"role": "user", "content": "Hello! What is 2+2?"}
    ],
    "max_tokens": 1024,
    "temperature": 0.7
  }'
```

#### Streaming Chat Completion
```bash
curl -X POST "http://localhost:8000/v2/llm/chat/completions/stream" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "'$MODEL_ID'",
    "messages": [
      {"role": "user", "content": "Count from 1 to 5"}
    ],
    "max_tokens": 100,
    "temperature": 0.7
  }'
```

#### Check Usage & Billing
```bash
curl -X GET "http://localhost:8000/v2/billing/usage/my-usage?days=30" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Testing with Python

### 1. Install dependencies
```bash
pip install requests
```

### 2. Set your access token and run
```bash
export ACCESS_TOKEN="your_access_token_here"
python test_llm_api.py
```

### Python Example (Standalone)
```python
import requests

# Configuration
BASE_URL = "http://localhost:8000"
ACCESS_TOKEN = "your_access_token_here"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

# List models
response = requests.get(f"{BASE_URL}/v2/llm-models/?is_active=true", headers=headers)
models = response.json()
model_id = models['data'][0]['id']

# Create chat completion
response = requests.post(
    f"{BASE_URL}/v2/llm/chat/completions",
    headers=headers,
    json={
        "model_id": model_id,
        "messages": [
            {"role": "user", "content": "What is the capital of France?"}
        ],
        "max_tokens": 1024,
        "temperature": 0.7
    }
)

result = response.json()
print(f"Response: {result['content']}")
print(f"Cost: ${result['cost']:.6f}")
print(f"Input tokens: {result['input_tokens']}")
print(f"Output tokens: {result['output_tokens']}")
```

## API Endpoints

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v2/llm-models/` | List available LLM models |
| POST | `/v2/llm/chat/completions` | Create chat completion (non-streaming) |
| POST | `/v2/llm/chat/completions/stream` | Create chat completion (streaming SSE) |
| GET | `/v2/billing/usage/my-usage` | Get user's LLM usage and billing |

### Request Parameters

#### Chat Completion Request
```json
{
  "model_id": "uuid-of-model",           // Required
  "messages": [                          // Required
    {"role": "user", "content": "..."}
  ],
  "max_tokens": 1024,                    // Optional (default: 4096)
  "temperature": 0.7,                    // Optional (default: 1.0)
  "conversation_id": "uuid"              // Optional (to continue conversation)
}
```

### Response Format

#### Chat Completion Response
```json
{
  "id": "msg_abc123",
  "conversation_id": "uuid",
  "message_id": "uuid",
  "content": "The response text...",
  "model": "claude-3-5-sonnet-20241022",
  "input_tokens": 15,
  "output_tokens": 25,
  "cost": 0.000120
}
```

#### Streaming Response (SSE)
```
data: {"id": "...", "conversation_id": "...", "content": "The", "done": false}
data: {"id": "...", "conversation_id": "...", "content": " response", "done": false}
data: {"id": "...", "conversation_id": "...", "message_id": "...", "cost": 0.00012, "input_tokens": 15, "output_tokens": 25, "done": true}
```

## Usage Tracking

All API requests are automatically logged and tracked:
- Every request creates a `LLMUsageLog` entry
- Costs are calculated based on actual token usage
- View your usage in the web UI at `/language-models/billing`
- Or query via API: `/v2/billing/usage/my-usage?days=30`

## Troubleshooting

### Authentication Failed (403)
- Check that your access token is valid
- Verify you have an active subscription or trial period
- Make sure you're sending the token in the Authorization header

### Model Not Found (404)
- Verify the model ID is correct
- Check that the model is active: `/v2/llm-models/?is_active=true`

### API Key Error (400)
- You need to set your LLM provider API key in your profile settings
- Go to `/profile` in the web UI and add your Anthropic, OpenAI, or Google API key

### Rate Limiting
- The API respects provider rate limits
- If you hit limits, wait a few seconds and retry

## Next Steps

1. **View API Documentation**: Visit `/language-models/api` in the web UI for interactive documentation
2. **Monitor Usage**: Check `/language-models/billing` to see your usage and costs
3. **Explore Models**: Visit `/language-models` to see all available models and their pricing
4. **Try Playground**: Use `/language-models/llm-service` for an interactive testing interface

## Support

- For API issues, check the backend logs
- For billing questions, visit the billing page
- For model availability, check the models page
