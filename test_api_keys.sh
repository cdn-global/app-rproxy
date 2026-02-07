#!/bin/bash

# Test API Keys for Roaming Proxy
# Run this after adding your keys to .env

set -e

echo "🔍 Testing API Keys..."
echo ""

# Load environment variables
source .env

# Test Anthropic
if [ -n "$ANTHROPIC_API_KEY" ] && [ "$ANTHROPIC_API_KEY" != "sk-ant-api03-YOUR_KEY_HERE" ]; then
    echo "✅ Anthropic key found: ${ANTHROPIC_API_KEY:0:20}..."

    # Test API call
    response=$(curl -s -w "\n%{http_code}" https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d '{
            "model": "claude-3-haiku-20240307",
            "max_tokens": 10,
            "messages": [{"role": "user", "content": "Hi"}]
        }')

    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Anthropic API works!"
    else
        echo "   ❌ Anthropic API failed (HTTP $http_code)"
    fi
else
    echo "⚠️  Anthropic key not set or using placeholder"
fi

echo ""

# Test OpenAI
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "sk-proj-YOUR_KEY_HERE" ]; then
    echo "✅ OpenAI key found: ${OPENAI_API_KEY:0:20}..."

    response=$(curl -s -w "\n%{http_code}" https://api.openai.com/v1/models \
        -H "Authorization: Bearer $OPENAI_API_KEY")

    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        echo "   ✅ OpenAI API works!"
    else
        echo "   ❌ OpenAI API failed (HTTP $http_code)"
    fi
else
    echo "⚠️  OpenAI key not set or using placeholder"
fi

echo ""

# Test HuggingFace
if [ -n "$HUGGINGFACE_API_KEY" ] && [ "$HUGGINGFACE_API_KEY" != "hf_YOUR_TOKEN_HERE" ]; then
    echo "✅ HuggingFace token found: ${HUGGINGFACE_API_KEY:0:20}..."

    response=$(curl -s -w "\n%{http_code}" https://huggingface.co/api/whoami-v2 \
        -H "Authorization: Bearer $HUGGINGFACE_API_KEY")

    http_code=$(echo "$response" | tail -n1)
    if [ "$http_code" = "200" ]; then
        echo "   ✅ HuggingFace API works!"
    else
        echo "   ❌ HuggingFace API failed (HTTP $http_code)"
    fi
else
    echo "⚠️  HuggingFace token not set or using placeholder"
fi

echo ""
echo "✅ API key test complete!"
echo ""
echo "Next steps:"
echo "1. Fix any failed keys above"
echo "2. Run: docker compose restart backend"
echo "3. Test inference at: https://cloud.roamingproxy.com/language-models/llm-service"
