#!/bin/bash

# LLM API Test Script
# This script tests the LLM API endpoints with curl

echo "=================================================="
echo "LLM API Test Script"
echo "=================================================="
echo ""

# Configuration
BASE_URL="http://localhost:8000"
# You'll need to replace this with a valid access token
ACCESS_TOKEN="${ACCESS_TOKEN:-your_token_here}"

echo "Base URL: $BASE_URL"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Test 1: List available models
echo "Test 1: Listing available LLM models..."
echo "=================================================="
curl -s -X GET "$BASE_URL/v2/llm-models/?is_active=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""
echo ""

# Get first model ID from the list
MODEL_ID=$(curl -s -X GET "$BASE_URL/v2/llm-models/?is_active=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.data[0].id')

if [ "$MODEL_ID" = "null" ] || [ -z "$MODEL_ID" ]; then
  echo "Error: No models available or authentication failed"
  exit 1
fi

echo "Using model ID: $MODEL_ID"
echo ""

# Test 2: Create a chat completion
echo "Test 2: Creating a chat completion..."
echo "=================================================="
RESPONSE=$(curl -s -X POST "$BASE_URL/v2/llm/chat/completions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"model_id\": \"$MODEL_ID\",
    \"messages\": [
      {\"role\": \"user\", \"content\": \"What is 2+2? Answer in one sentence.\"}
    ],
    \"max_tokens\": 100,
    \"temperature\": 0.7
  }")

echo "$RESPONSE" | jq '.'
echo ""

# Extract usage information
INPUT_TOKENS=$(echo "$RESPONSE" | jq -r '.input_tokens')
OUTPUT_TOKENS=$(echo "$RESPONSE" | jq -r '.output_tokens')
COST=$(echo "$RESPONSE" | jq -r '.cost')

echo ""
echo "Usage Summary:"
echo "  Input Tokens: $INPUT_TOKENS"
echo "  Output Tokens: $OUTPUT_TOKENS"
echo "  Cost: \$$COST"
echo ""

# Test 3: Check billing/usage endpoint
echo "Test 3: Checking usage/billing report..."
echo "=================================================="
curl -s -X GET "$BASE_URL/v2/billing/usage/my-usage?days=30" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
echo ""

echo "=================================================="
echo "All tests completed!"
echo "=================================================="
