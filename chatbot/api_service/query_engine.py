"""
Query Engine - Xử lý queries và trả về kết quả
"""

from typing import List, Dict, Optional
from core.vector_store import VectorStore


class QueryEngine:
    """Engine để xử lý queries"""

    def __init__(self):
        """Khởi tạo query engine"""
        self.vector_store = VectorStore()
        # Load collection
        try:
            self.vector_store.get_collection()
            print(f"✓ Query engine ready with collection: {self.vector_store.collection_name}")
        except Exception as e:
            print(f"✗ Failed to load collection: {e}")
            raise

    def search(
        self,
        question: str,
        top_k: int = 10,
        filter_chapter: Optional[str] = None,
        filter_section: Optional[str] = None
    ) -> List[Dict]:
        """
        Tìm kiếm nguồn thông tin cho câu hỏi

        Args:
            question: Câu hỏi
            top_k: Số lượng nguồn trả về
            filter_chapter: Lọc theo chương (optional)
            filter_section: Lọc theo mục (optional)

        Returns:
            List of source info dicts
        """
        # Tạo where filter với ChromaDB syntax
        where_filter = None

        if filter_chapter and filter_section:
            # Cả hai filter: dùng $and
            where_filter = {
                "$and": [
                    {"chapter": {"$eq": filter_chapter}},
                    {"section": {"$eq": filter_section}}
                ]
            }
        elif filter_chapter:
            # Chỉ filter chapter
            where_filter = {"chapter": {"$eq": filter_chapter}}
        elif filter_section:
            # Chỉ filter section
            where_filter = {"section": {"$eq": filter_section}}

        # Query vector database
        results = self.vector_store.query(
            query_text=question,
            n_results=top_k,
            where=where_filter
        )

        # Format kết quả
        sources = []

        for i, (chunk_id, distance, document, metadata) in enumerate(zip(
            results['ids'][0],
            results['distances'][0],
            results['documents'][0],
            results['metadatas'][0]
        )):
            # Lấy content (loại bỏ context ở đầu nếu có)
            content = document
            if '\n\n' in content:
                parts = content.split('\n\n', 1)
                if len(parts) > 1:
                    # Kiểm tra xem phần đầu có phải context không
                    if parts[0] == metadata.get('context', ''):
                        content = parts[1]

            source = {
                'rank': i + 1,
                'chunk_id': chunk_id,
                'similarity_score': 1 - distance,  # Convert distance to similarity
                'chapter': metadata['chapter'],
                'section': metadata['section'],
                'content': content,
                'estimated_tokens': metadata['estimated_tokens'],
                'type': metadata['type']
            }

            sources.append(source)

        return sources

    def get_stats(self) -> Dict:
        """Lấy thống kê về vector database"""
        return self.vector_store.get_stats()
