"""
Script để test API
"""

import sys
from pathlib import Path
import requests
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.config import settings


def test_health():
    """Test health endpoint"""
    print(f"\n{'='*80}")
    print("Testing /health endpoint")
    print(f"{'='*80}")

    url = f"http://{settings.API_HOST}:{settings.API_PORT}/health"

    try:
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()
        print(f"Status: {data['status']}")
        print(f"Collection: {data['collection_name']}")
        print(f"Total Documents: {data['total_documents']}")
        print(f"Model: {data['model']}")
        print("\n✓ Health check passed")

    except Exception as e:
        print(f"\n✗ Health check failed: {e}")
        return False

    return True


def test_query(question: str, top_k: int = 10):
    """Test query endpoint"""
    print(f"\n{'='*80}")
    print(f"Testing /query endpoint")
    print(f"{'='*80}")
    print(f"Question: {question}")
    print(f"Top K: {top_k}")

    url = f"http://{settings.API_HOST}:{settings.API_PORT}/query"

    payload = {
        "question": question,
        "top_k": top_k
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()

        data = response.json()

        print(f"\nTotal Sources: {data['total_sources']}")
        print(f"\nTop {min(3, len(data['sources']))} Results:")

        for i, source in enumerate(data['sources'][:3], 1):
            print(f"\n--- Source #{i} (Rank: {source['rank']}) ---")
            print(f"Similarity: {source['similarity_score']:.4f}")
            print(f"Chapter: {source['chapter']}")
            print(f"Section: {source['section']}")
            print(f"Content Preview: {source['content'][:200]}...")

        print("\n✓ Query test passed")

        return data

    except Exception as e:
        print(f"\n✗ Query test failed: {e}")
        return None


def main():
    """Main function"""
    print(f"\n{'='*80}")
    print("API TEST SUITE")
    print(f"{'='*80}")

    # Test 1: Health check
    if not test_health():
        print("\n✗ Tests failed: API not healthy")
        sys.exit(1)

    # Test 2: Sample queries
    test_queries = [
        "Tiến trình trong hệ điều hành là gì?",
        "Bộ nhớ ảo hoạt động như thế nào?",
        "Điều độ CPU"
    ]

    for query in test_queries:
        test_query(query, top_k=5)

    print(f"\n{'='*80}")
    print("✓ ALL TESTS PASSED")
    print(f"{'='*80}\n")


if __name__ == "__main__":
    main()
