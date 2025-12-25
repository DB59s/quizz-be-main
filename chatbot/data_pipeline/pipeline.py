"""
Data Pipeline - Orchestrator chính cho data processing
"""

from pathlib import Path
from typing import Optional

from .chunker import DocumentChunker
from .normalizer import TextNormalizer
from core.vector_store import VectorStore
from core.config import settings


class DataPipeline:
    """
    Pipeline chính để xử lý data (optimized streaming):
    1. Đọc file text
    2. Chunking (semantic)
    3. Normalize (light)
    4. Stream processing: Embed và upload theo batch → ChromaDB

    Không có file trung gian, xử lý trực tiếp từ text → vector DB
    """

    def __init__(self):
        """Khởi tạo pipeline"""
        self.chunker = DocumentChunker()
        self.normalizer = TextNormalizer()
        self.vector_store = VectorStore()

    def process_file(
        self,
        input_file: str,
        recreate_collection: bool = True
    ):
        """
        Xử lý một file text và lưu vào vector database

        Args:
            input_file: Đường dẫn file text đầu vào
            recreate_collection: Có tạo lại collection hay không
        """
        print(f"\n{'='*80}")
        print(f"DATA PIPELINE - Processing: {input_file}")
        print(f"{'='*80}\n")

        # 1. Đọc file
        print("Step 1: Reading file...")
        file_path = Path(input_file)
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {input_file}")

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"✓ Read {len(content)} characters\n")

        # 2. Chunking
        print("Step 2: Chunking document...")
        chunks = self.chunker.chunk_document(content)
        print(f"✓ Created {len(chunks)} chunks\n")

        # 3. Normalize
        print("Step 3: Normalizing chunks...")
        chunks = self.normalizer.normalize_chunks(chunks)
        print(f"✓ Normalized {len(chunks)} chunks\n")

        # 4. Setup vector store
        print("Step 4: Setting up vector store...")
        if recreate_collection:
            self.vector_store.create_collection(delete_if_exists=True)
        else:
            self.vector_store.get_collection()
        print()

        # 5. Stream processing: Embed and store (batch by batch)
        print("Step 5: Embedding and storing to ChromaDB...")
        self.vector_store.add_chunks(chunks, batch_size=100)
        print()

        # 6. Show stats
        print("Step 6: Getting statistics...")
        stats = self.vector_store.get_stats()
        print(f"\n{'='*80}")
        print("PIPELINE COMPLETED SUCCESSFULLY")
        print(f"{'='*80}")
        print(f"Collection: {stats['collection_name']}")
        print(f"Total documents: {stats['total_documents']}")
        print(f"Model: {self.vector_store.model_name}")
        print(f"{'='*80}\n")

        # Return result
        return {
            'chunks_processed': len(chunks),
            'collection_name': stats['collection_name'],
            'total_documents': stats['total_documents']
        }

    def process_directory(
        self,
        input_dir: Optional[str] = None,
        pattern: str = "*.txt"
    ):
        """
        Xử lý tất cả files trong một directory

        Args:
            input_dir: Thư mục chứa file (default: settings.INPUT_DIR)
            pattern: Pattern để filter files (default: "*.txt")
        """
        input_path = Path(input_dir) if input_dir else settings.INPUT_DIR

        if not input_path.exists():
            raise FileNotFoundError(f"Directory not found: {input_path}")

        files = list(input_path.glob(pattern))

        if not files:
            print(f"No files found matching pattern '{pattern}' in {input_path}")
            return

        print(f"Found {len(files)} files to process\n")

        # Tạo collection mới cho lần đầu
        recreate = True

        for i, file_path in enumerate(files):
            print(f"\nProcessing file {i+1}/{len(files)}: {file_path.name}")
            self.process_file(str(file_path), recreate_collection=recreate)

            # Các file tiếp theo chỉ add vào collection
            recreate = False

        print(f"\n{'='*80}")
        print(f"ALL FILES PROCESSED: {len(files)} files")
        print(f"{'='*80}\n")
