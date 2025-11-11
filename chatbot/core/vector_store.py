"""
Vector Store - Wrapper cho ChromaDB operations
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Optional
from sentence_transformers import SentenceTransformer
from .config import settings


class VectorStore:
    """Wrapper class cho ChromaDB với multilingual-e5-large"""

    def __init__(
        self,
        model_name: Optional[str] = None,
        collection_name: Optional[str] = None,
        persist_directory: Optional[str] = None
    ):
        """
        Khởi tạo Vector Store

        Args:
            model_name: Tên model embedding (default từ settings)
            collection_name: Tên collection (default từ settings)
            persist_directory: Thư mục lưu ChromaDB (default từ settings)
        """
        self.model_name = model_name or settings.EMBEDDING_MODEL
        self.collection_name = collection_name or settings.COLLECTION_NAME
        self.persist_directory = persist_directory or str(settings.CHROMADB_DIR)

        # Load embedding model
        print(f"Loading embedding model: {self.model_name}...")
        self.model = SentenceTransformer(self.model_name)

        # Kết nối ChromaDB
        print(f"Connecting to ChromaDB at: {self.persist_directory}")
        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        self.collection = None

    def create_collection(self, delete_if_exists: bool = True):
        """
        Tạo collection mới

        Args:
            delete_if_exists: Xóa collection cũ nếu tồn tại
        """
        if delete_if_exists:
            try:
                self.client.delete_collection(name=self.collection_name)
                print(f"Deleted existing collection: {self.collection_name}")
            except:
                pass

        self.collection = self.client.create_collection(
            name=self.collection_name,
            metadata={
                "description": "RAG Chatbot Vector Database",
                "model": self.model_name,
                "embedding_dimension": settings.EMBEDDING_DIMENSION,
            }
        )
        print(f"Created new collection: {self.collection_name}")

    def get_collection(self):
        """Lấy collection hiện có, tự động tạo nếu chưa có"""
        try:
            self.collection = self.client.get_collection(name=self.collection_name)
            print(f"Connected to collection: {self.collection_name}")
        except Exception as e:
            print(f"Collection '{self.collection_name}' not found, creating new one...")
            self.create_collection(delete_if_exists=False)

    def embed_text(self, text: str, is_query: bool = False) -> List[float]:
        """
        Embedding text với multilingual-e5-large

        Args:
            text: Text cần embedding
            is_query: True nếu là query, False nếu là document

        Returns:
            Embedding vector
        """
        prefix = "query: " if is_query else "passage: "
        embedding = self.model.encode(prefix + text, normalize_embeddings=True)
        return embedding.tolist()

    def add_chunks(
        self,
        chunks: List[Dict],
        batch_size: int = 100
    ):
        """
        Xử lý và thêm chunks vào collection (stream processing)

        Args:
            chunks: List of chunk dicts với 'chunk_id', 'content', 'context', metadata
            batch_size: Batch size cho embed và upload
        """
        if not self.collection:
            raise ValueError("Collection not initialized. Call create_collection() first.")

        total = len(chunks)
        print(f"Processing {total} chunks in batches of {batch_size}...")

        # Stream processing: process và upload từng batch
        for batch_idx in range(0, total, batch_size):
            batch_end = min(batch_idx + batch_size, total)
            batch_chunks = chunks[batch_idx:batch_end]

            # Prepare batch
            batch_ids = []
            batch_documents = []
            batch_metadatas = []
            batch_embeddings = []

            for chunk in batch_chunks:
                # Combine context + content
                context = chunk.get('context', '')
                content = chunk.get('content', '')

                if context and context not in content:
                    combined_text = f"{context}\n\n{content}"
                else:
                    combined_text = content

                # Embed ngay
                embedding = self.embed_text(combined_text, is_query=False)

                batch_ids.append(chunk['chunk_id'])
                batch_documents.append(combined_text)
                batch_embeddings.append(embedding)
                batch_metadatas.append({
                    'chunk_id': chunk['chunk_id'],
                    'chapter': chunk['chapter'],
                    'section': chunk['section'],
                    'context': chunk['context'],
                    'type': chunk['type'],
                    'estimated_tokens': chunk['estimated_tokens']
                })

            # Upload batch
            self.collection.add(
                ids=batch_ids,
                embeddings=batch_embeddings,
                documents=batch_documents,
                metadatas=batch_metadatas
            )

            batch_num = batch_idx // batch_size + 1
            total_batches = (total - 1) // batch_size + 1
            print(f"  Batch {batch_num}/{total_batches}: Embedded and uploaded {len(batch_ids)} chunks")

        print(f"✓ Successfully processed and added {total} chunks to collection")

    def query(
        self,
        query_text: str,
        n_results: int = 10,
        where: Optional[Dict] = None
    ) -> Dict:
        """
        Query vector database

        Args:
            query_text: Câu hỏi
            n_results: Số lượng kết quả
            where: Filter metadata (optional)

        Returns:
            Query results
        """
        if not self.collection:
            self.get_collection()

        # Embed query
        query_embedding = self.embed_text(query_text, is_query=True)

        # Query ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where
        )

        return results

    def get_stats(self) -> Dict:
        """Lấy thống kê về collection"""
        if not self.collection:
            self.get_collection()

        count = self.collection.count()

        return {
            "collection_name": self.collection_name,
            "total_documents": count,
            "metadata": self.collection.metadata
        }
