#!/usr/bin/env python3
"""
Concurrency test for LLM API endpoints.
Tests that multiple simultaneous requests are handled correctly.
"""
import asyncio
import httpx
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8000"
TEST_CREDENTIALS = {
    "username": "admin@example.com",  # Update with your test credentials
    "password": "changethis"
}


def get_auth_token():
    """Get authentication token"""
    with httpx.Client() as client:
        response = client.post(
            f"{BASE_URL}/v2/login/access-token",
            data=TEST_CREDENTIALS,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            raise Exception(f"Failed to authenticate: {response.status_code} {response.text}")


def test_concurrent_api_key_status(token: str, thread_id: int):
    """Test concurrent API key status requests"""
    with httpx.Client() as client:
        start = time.time()
        response = client.get(
            f"{BASE_URL}/v2/users/me/api-key-status",
            headers={"Authorization": f"Bearer {token}"}
        )
        duration = time.time() - start

        return {
            "thread_id": thread_id,
            "status": response.status_code,
            "duration": duration,
            "success": response.status_code == 200
        }


def test_concurrent_user_info(token: str, thread_id: int):
    """Test concurrent user info requests"""
    with httpx.Client() as client:
        start = time.time()
        response = client.get(
            f"{BASE_URL}/v2/users/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        duration = time.time() - start

        return {
            "thread_id": thread_id,
            "status": response.status_code,
            "duration": duration,
            "success": response.status_code == 200
        }


def main():
    print("=" * 60)
    print("Concurrency Test for LLM API")
    print("=" * 60)

    # Get auth token
    print("\n1. Authenticating...")
    try:
        token = get_auth_token()
        print("   ✓ Authentication successful")
    except Exception as e:
        print(f"   ✗ Authentication failed: {e}")
        return

    # Test concurrent API key status requests
    print("\n2. Testing concurrent API key status requests (20 requests)...")
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [
            executor.submit(test_concurrent_api_key_status, token, i)
            for i in range(20)
        ]

        results = [future.result() for future in as_completed(futures)]

    success_count = sum(1 for r in results if r["success"])
    avg_duration = sum(r["duration"] for r in results) / len(results)

    print(f"   Results: {success_count}/{len(results)} successful")
    print(f"   Average duration: {avg_duration:.3f}s")

    if success_count == len(results):
        print("   ✓ All requests succeeded")
    else:
        print(f"   ✗ {len(results) - success_count} requests failed")
        failed = [r for r in results if not r["success"]]
        print(f"   Failed: {failed}")

    # Test concurrent user info requests
    print("\n3. Testing concurrent user info requests (20 requests)...")
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = [
            executor.submit(test_concurrent_user_info, token, i)
            for i in range(20)
        ]

        results = [future.result() for future in as_completed(futures)]

    success_count = sum(1 for r in results if r["success"])
    avg_duration = sum(r["duration"] for r in results) / len(results)

    print(f"   Results: {success_count}/{len(results)} successful")
    print(f"   Average duration: {avg_duration:.3f}s")

    if success_count == len(results):
        print("   ✓ All requests succeeded")
    else:
        print(f"   ✗ {len(results) - success_count} requests failed")

    print("\n" + "=" * 60)
    print("Concurrency test completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
