"""
Test Query Simple - Test API đơn giản
"""

import requests
import json


def test_api():
    """Test API với một câu hỏi đơn giản"""

    print("\n" + "="*80)
    print("TEST API - SIMPLE EXAMPLE")
    print("="*80)

    # API endpoint
    url = "http://localhost:8000/query"

    # Payload gửi đi
    payload = {
        "question": "Tiến trình trong hệ điều hành là gì?",
        "top_k": 10
    }

    print("\n📤 REQUEST:")
    print(f"URL: {url}")
    print(f"Method: POST")
    print(f"Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))

    try:
        # Gửi request
        print("\n⏳ Đang gửi request...")
        response = requests.post(url, json=payload)

        # Check status code
        print(f"\n✓ Status Code: {response.status_code}")

        if response.status_code == 200:
            # Parse response
            data = response.json()

            print("\n📥 RESPONSE:")
            print(f"Question: {data['question']}")
            print(f"Total Sources: {data['total_sources']}")

            # Hiển thị top 3 nguồn
            print(f"\n{'='*80}")
            print("TOP 3 NGUỒN THÔNG TIN:")
            print(f"{'='*80}")

            for source in data['sources'][:3]:
                print(f"\n┌─ NGUỒN #{source['rank']} ─ Độ chính xác: {source['similarity_score']:.1%} {'─'*40}")
                print(f"│ Chapter: {source['chapter']}")
                print(f"│ Section: {source['section']}")
                print(f"│")
                print(f"│ Content (first 300 chars):")
                print(f"│ {'-'*76}")

                content = source['content'][:300]
                for line in content.split('\n'):
                    if line.strip():
                        print(f"│ {line[:76]}")

                if len(source['content']) > 300:
                    print(f"│ ... (+{len(source['content']) - 300} chars)")

                print(f"└{'─'*78}")

            print(f"\n✓ API hoạt động tốt!")

        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("\n❌ Không thể kết nối đến API server!")
        print("\n💡 Hãy chạy API server trước:")
        print("   python scripts/run_api.py")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main function"""
    test_api()

    print("\n" + "="*80)
    print("MẪU CODE GỬI REQUEST:")
    print("="*80)

    print("""
# Python (requests)
import requests

response = requests.post(
    "http://localhost:8000/query",
    json={
        "question": "Tiến trình là gì?",
        "top_k": 10
    }
)

data = response.json()
print(f"Tìm thấy {data['total_sources']} nguồn")

# curl
curl -X POST "http://localhost:8000/query" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "Tiến trình là gì?", "top_k": 10}'

# JavaScript (fetch)
fetch('http://localhost:8000/query', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    question: 'Tiến trình là gì?',
    top_k: 10
  })
})
.then(res => res.json())
.then(data => console.log(data.sources));
    """)

    print("\n" + "="*80)
    print("ĐỌC THÊM: API_GUIDE.md")
    print("="*80)


if __name__ == "__main__":
    main()
