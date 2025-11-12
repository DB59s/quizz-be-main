"""
Quick Query - Hỏi đáp trực tiếp không cần API server
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api_service import QueryEngine


def main():
    """Quick query interface"""

    print("\n" + "="*80)
    print("QUICK QUERY - Hỏi đáp trực tiếp")
    print("="*80)

    # Khởi tạo query engine
    print("\nĐang khởi tạo...")
    try:
        engine = QueryEngine()
        print("✓ Sẵn sàng!\n")
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        print("\n💡 Bạn cần chạy pipeline trước:")
        print("   1. Copy file text: copy text.txt data\\input\\text.txt")
        print("   2. Chạy pipeline: python scripts/run_pipeline.py --file data/input/text.txt")
        print()
        return 1

    # Interactive loop
    print("Nhập câu hỏi (hoặc 'exit' để thoát):")

    while True:
        try:
            # Get question
            question = input("\n🔍 Câu hỏi: ").strip()

            if not question:
                continue

            if question.lower() in ['exit', 'quit', 'q']:
                print("\n👋 Tạm biệt!")
                break

            # Query
            print("\n⏳ Đang tìm kiếm...")
            results = engine.search(question, top_k=10)

            # Display results
            print(f"\n{'='*80}")
            print(f"TÌM THẤY {len(results)} NGUỒN THÔNG TIN")
            print(f"{'='*80}\n")

            for i, result in enumerate(results[:5], 1):  # Hiển thị top 5
                print(f"┌─ NGUỒN #{i} ─ Độ chính xác: {result['similarity_score']:.1%} {'─'*45}")
                print(f"│ 📍 {result['chapter']}")
                print(f"│ 📑 {result['section']}")
                print(f"│")

                # Get content
                content = result['content']

                # Remove context if present
                if '\n\n' in content:
                    parts = content.split('\n\n', 1)
                    if len(parts) > 1:
                        content = parts[1]

                # Limit length
                max_len = 400
                if len(content) > max_len:
                    content = content[:max_len] + "..."

                print(f"│ 💬 Nội dung:")
                print(f"│ {'-'*76}")
                for line in content.split('\n'):
                    if line.strip():
                        # Wrap long lines
                        if len(line) > 76:
                            words = line.split()
                            current = ""
                            for word in words:
                                if len(current) + len(word) + 1 <= 76:
                                    current += word + " "
                                else:
                                    if current:
                                        print(f"│ {current}")
                                    current = word + " "
                            if current:
                                print(f"│ {current}")
                        else:
                            print(f"│ {line}")
                print(f"└{'─'*78}\n")

            if len(results) > 5:
                print(f"... và {len(results) - 5} nguồn khác\n")

        except KeyboardInterrupt:
            print("\n\n👋 Tạm biệt!")
            break
        except Exception as e:
            print(f"\n❌ Lỗi: {e}")
            import traceback
            traceback.print_exc()

    return 0


if __name__ == "__main__":
    sys.exit(main())
