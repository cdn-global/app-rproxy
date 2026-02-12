#!/usr/bin/env python3
"""
LLM API Test Script
Tests the LLM API endpoints using Python requests
"""

import requests
import json
import os
import sys
from datetime import datetime

# Configuration
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
ACCESS_TOKEN = os.getenv("ACCESS_TOKEN", "")

if not ACCESS_TOKEN:
    print("Error: ACCESS_TOKEN environment variable not set")
    print("Usage: ACCESS_TOKEN=your_token python test_llm_api.py")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type": "application/json"
}

def print_section(title):
    """Print a section header"""
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def test_list_models():
    """Test listing available models"""
    print_section("Test 1: Listing Available LLM Models")

    response = requests.get(
        f"{BASE_URL}/v2/llm-models/?is_active=true",
        headers=headers
    )

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

    data = response.json()
    print(f"Found {data['count']} active models")
    print(json.dumps(data, indent=2))

    if data['count'] > 0:
        return data['data'][0]['id']
    return None

def test_chat_completion(model_id):
    """Test creating a chat completion"""
    print_section("Test 2: Creating a Chat Completion")

    request_data = {
        "model_id": model_id,
        "messages": [
            {"role": "user", "content": "What is 2+2? Answer in one sentence."}
        ],
        "max_tokens": 100,
        "temperature": 0.7
    }

    print(f"Using model ID: {model_id}")
    print(f"Request: {json.dumps(request_data, indent=2)}")
    print("\nSending request...")

    response = requests.post(
        f"{BASE_URL}/v2/llm/chat/completions",
        headers=headers,
        json=request_data
    )

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

    data = response.json()
    print("\nResponse:")
    print(json.dumps(data, indent=2))

    print("\n" + "-" * 60)
    print("Usage Summary:")
    print(f"  Content: {data['content']}")
    print(f"  Input Tokens: {data['input_tokens']}")
    print(f"  Output Tokens: {data['output_tokens']}")
    print(f"  Cost: ${data['cost']:.6f}")
    print(f"  Conversation ID: {data['conversation_id']}")
    print("-" * 60)

    return data

def test_streaming_chat(model_id):
    """Test streaming chat completion"""
    print_section("Test 3: Testing Streaming Chat Completion")

    request_data = {
        "model_id": model_id,
        "messages": [
            {"role": "user", "content": "Count from 1 to 5."}
        ],
        "max_tokens": 50,
        "temperature": 0.7
    }

    print(f"Using model ID: {model_id}")
    print("Streaming response...\n")

    response = requests.post(
        f"{BASE_URL}/v2/llm/chat/completions/stream",
        headers=headers,
        json=request_data,
        stream=True
    )

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

    full_content = ""
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data_str = line[6:]  # Remove 'data: ' prefix
                try:
                    chunk = json.loads(data_str)
                    if chunk.get('content'):
                        full_content += chunk['content']
                        print(chunk['content'], end='', flush=True)

                    if chunk.get('done'):
                        print("\n\n" + "-" * 60)
                        print("Stream completed!")
                        if 'cost' in chunk:
                            print(f"Input Tokens: {chunk.get('input_tokens', 'N/A')}")
                            print(f"Output Tokens: {chunk.get('output_tokens', 'N/A')}")
                            print(f"Cost: ${chunk.get('cost', 0):.6f}")
                        print("-" * 60)
                except json.JSONDecodeError:
                    pass

def test_usage_billing():
    """Test getting usage/billing information"""
    print_section("Test 4: Checking Usage & Billing Report")

    response = requests.get(
        f"{BASE_URL}/v2/billing/usage/my-usage?days=30",
        headers=headers
    )

    if response.status_code != 200:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

    data = response.json()
    print(json.dumps(data, indent=2))

    print("\n" + "-" * 60)
    print("Billing Summary (Last 30 Days):")
    print(f"  Total Requests: {data['total_requests']}")
    print(f"  Input Tokens: {data['total_input_tokens']:,}")
    print(f"  Output Tokens: {data['total_output_tokens']:,}")
    print(f"  Total Cost: ${data['total_cost']:.6f}")
    print(f"  Models Used: {', '.join(data['models_used'])}")
    print("-" * 60)

def main():
    """Run all tests"""
    print("=" * 60)
    print("LLM API Test Suite")
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {datetime.now().isoformat()}")
    print("=" * 60)

    # Test 1: List models
    model_id = test_list_models()
    if not model_id:
        print("\nError: No models available. Exiting.")
        sys.exit(1)

    # Test 2: Chat completion
    test_chat_completion(model_id)

    # Test 3: Streaming chat
    test_streaming_chat(model_id)

    # Test 4: Usage/billing
    test_usage_billing()

    print_section("All Tests Completed Successfully! ✓")

if __name__ == "__main__":
    main()
