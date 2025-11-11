"""
Example API Client - Ví dụ sử dụng API trong ứng dụng thực tế
"""

import requests
from typing import List, Dict, Optional


class ChatbotRAGClient:
    """Client để tương tác với Chatbot RAG API"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Khởi tạo client

        Args:
            base_url: URL của API server
        """
        self.base_url = base_url.rstrip('/')

    def health_check(self) -> Dict:
        """
        Kiểm tra trạng thái service

        Returns:
            Dict với status, collection_name, total_documents, model
        """
        url = f"{self.base_url}/health"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def query(
        self,
        question: str,
        top_k: int = 10,
        filter_chapter: Optional[str] = None,
        filter_section: Optional[str] = None
    ) -> Dict:
        """
        Query chatbot

        Args:
            question: Câu hỏi
            top_k: Số lượng nguồn trả về
            filter_chapter: Lọc theo chương (optional)
            filter_section: Lọc theo mục (optional)

        Returns:
            Dict với question, total_sources, sources
        """
        url = f"{self.base_url}/query"

        payload = {
            "question": question,
            "top_k": top_k
        }

        if filter_chapter:
            payload["filter_chapter"] = filter_chapter
        if filter_section:
            payload["filter_section"] = filter_section

        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()

    def get_stats(self) -> Dict:
        """
        Lấy thống kê về database

        Returns:
            Dict với collection stats
        """
        url = f"{self.base_url}/stats"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()

    def format_sources(self, sources: List[Dict], max_content_length: int = 200) -> str:
        """
        Format sources thành string đẹp

        Args:
            sources: List of sources
            max_content_length: Độ dài tối đa của content

        Returns:
            Formatted string
        """
        output = []

        for source in sources:
            output.append(f"\n{'='*80}")
            output.append(f"Rank #{source['rank']} - Similarity: {source['similarity_score']:.2%}")
            output.append(f"{'='*80}")
            output.append(f"Chapter: {source['chapter']}")
            output.append(f"Section: {source['section']}")
            output.append(f"Chunk ID: {source['chunk_id']}")
            output.append(f"\nContent:")
            output.append(f"{'-'*80}")

            content = source['content']
            if len(content) > max_content_length:
                content = content[:max_content_length] + "..."

            output.append(content)
            output.append(f"{'-'*80}")

        return "\n".join(output)


def example_1_basic_query():
    """Ví dụ 1: Query cơ bản"""
    print("\n" + "="*80)
    print("VÍ DỤ 1: QUERY CƠ BẢN")
    print("="*80)

    # Khởi tạo client
    client = ChatbotRAGClient()

    # Health check
    health = client.health_check()
    print(f"\n✓ Service healthy")
    print(f"  Collection: {health['collection_name']}")
    print(f"  Total documents: {health['total_documents']}")

    # Query
    question = "Tiến trình trong hệ điều hành là gì?"
    print(f"\n🔍 Question: {question}")

    result = client.query(question, top_k=3)

    print(f"\n✓ Found {result['total_sources']} sources")
    print(client.format_sources(result['sources']))


def example_2_filtered_query():
    """Ví dụ 2: Query với filter"""
    print("\n" + "="*80)
    print("VÍ DỤ 2: QUERY VỚI FILTER")
    print("="*80)

    client = ChatbotRAGClient()

    # Query với filter chapter
    question = "Điều độ CPU"
    filter_chapter = "CHƯƠNG 2: QUẢN LÝ TIẾN TRÌNH"

    print(f"\n🔍 Question: {question}")
    print(f"📁 Filter: {filter_chapter}")

    result = client.query(
        question,
        top_k=3,
        filter_chapter=filter_chapter
    )

    print(f"\n✓ Found {result['total_sources']} sources")
    print(client.format_sources(result['sources']))


def example_3_batch_queries():
    """Ví dụ 3: Batch queries"""
    print("\n" + "="*80)
    print("VÍ DỤ 3: BATCH QUERIES")
    print("="*80)

    client = ChatbotRAGClient()

    questions = [
        "Tiến trình là gì?",
        "Bộ nhớ ảo hoạt động thế nào?",
        "Deadlock là gì?"
    ]

    for i, question in enumerate(questions, 1):
        print(f"\n{'-'*80}")
        print(f"Query {i}/{len(questions)}: {question}")
        print(f"{'-'*80}")

        result = client.query(question, top_k=2)

        print(f"✓ Found {result['total_sources']} sources")

        # In source đầu tiên
        if result['sources']:
            top_source = result['sources'][0]
            print(f"\nTop result:")
            print(f"  Chapter: {top_source['chapter']}")
            print(f"  Similarity: {top_source['similarity_score']:.2%}")
            print(f"  Preview: {top_source['content'][:150]}...")


def example_4_chatbot_loop():
    """Ví dụ 4: Interactive chatbot loop"""
    print("\n" + "="*80)
    print("VÍ DỤ 4: INTERACTIVE CHATBOT")
    print("="*80)
    print("Type 'exit' to quit")

    client = ChatbotRAGClient()

    while True:
        try:
            question = input("\n🤖 You: ").strip()

            if not question:
                continue

            if question.lower() in ['exit', 'quit', 'q']:
                print("\n👋 Goodbye!")
                break

            # Query
            result = client.query(question, top_k=3)

            # Format response
            print(f"\n🤖 Bot: Tìm thấy {result['total_sources']} nguồn có thể trả lời câu hỏi của bạn:")

            for i, source in enumerate(result['sources'][:3], 1):
                print(f"\n  [{i}] {source['chapter']}")
                print(f"      Similarity: {source['similarity_score']:.2%}")
                print(f"      {source['content'][:200]}...")

        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


def main():
    """Main function"""
    import sys

    examples = {
        '1': ('Basic Query', example_1_basic_query),
        '2': ('Filtered Query', example_2_filtered_query),
        '3': ('Batch Queries', example_3_batch_queries),
        '4': ('Interactive Chatbot', example_4_chatbot_loop),
    }

    if len(sys.argv) > 1:
        choice = sys.argv[1]
        if choice in examples:
            _, func = examples[choice]
            func()
        else:
            print(f"Invalid choice: {choice}")
            print(f"Valid choices: {', '.join(examples.keys())}")
    else:
        print("\n" + "="*80)
        print("CHATBOT RAG API - EXAMPLES")
        print("="*80)
        print("\nUsage: python example_api_client.py <example_number>")
        print("\nAvailable examples:")
        for key, (name, _) in examples.items():
            print(f"  {key}. {name}")
        print("\nExample:")
        print("  python scripts/example_api_client.py 1")
        print("\nRunning all examples...\n")

        # Run all examples except interactive
        for key in ['1', '2', '3']:
            _, func = examples[key]
            func()
            input("\nPress Enter to continue to next example...")


if __name__ == "__main__":
    main()
