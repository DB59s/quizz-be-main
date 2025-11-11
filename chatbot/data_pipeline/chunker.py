"""
Document Chunker - Chia document thành các chunks có semantic
Dựa trên chunking_strategy.py
"""

import re
from typing import List, Dict
from core.config import settings


class DocumentChunker:
    """Chunker cho documents, hỗ trợ cấu trúc chương-mục"""

    def __init__(
        self,
        max_chunk_size: int = None,
        avg_chars_per_token: int = None
    ):
        """
        Khởi tạo chunker

        Args:
            max_chunk_size: Số tokens tối đa mỗi chunk
            avg_chars_per_token: Số ký tự trung bình mỗi token
        """
        self.max_chunk_size = max_chunk_size or settings.MAX_TOKENS
        self.avg_chars_per_token = avg_chars_per_token or settings.AVG_CHARS_PER_TOKEN
        self.max_chars = self.max_chunk_size * self.avg_chars_per_token

    def estimate_tokens(self, text: str) -> int:
        """Ước lượng số tokens từ text"""
        return len(text) // self.avg_chars_per_token

    def extract_chapters(self, content: str) -> Dict[str, Dict]:
        """
        Trích xuất các chương từ document

        Args:
            content: Nội dung document

        Returns:
            Dict mapping chapter_id -> {title, content}
        """
        chapters = {}

        # Pattern để tìm các chương
        chapter_pattern = r'CHƯƠNG\s+(\d+):\s*([^\n]+)'
        matches = list(re.finditer(chapter_pattern, content))

        for i, match in enumerate(matches):
            chapter_num = match.group(1)
            chapter_title = match.group(2).strip()
            start_pos = match.start()

            # Tìm vị trí kết thúc của chương
            if i < len(matches) - 1:
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(content)

            chapter_content = content[start_pos:end_pos]
            chapters[f"chuong_{chapter_num}"] = {
                'title': f"CHƯƠNG {chapter_num}: {chapter_title}",
                'content': chapter_content.strip()
            }

        return chapters

    def extract_sections(self, chapter_content: str) -> List[Dict[str, str]]:
        """
        Trích xuất các mục từ nội dung chương

        Args:
            chapter_content: Nội dung chương

        Returns:
            List of sections với section_num, section_title, content
        """
        sections = []

        # Pattern cho các mục (1.1, 1.2, 2.1, 2.2, etc.)
        section_pattern = r'(\d+\.\d+\.?\d*\.?\d*)\s+([A-ZÀÁẢÃẠÂẦẤẨẪẬĂẰẮẲẴẶÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][^\n]{1,100})'
        matches = list(re.finditer(section_pattern, chapter_content))

        for i, match in enumerate(matches):
            section_num = match.group(1)
            section_title = match.group(2).strip()
            start_pos = match.start()

            if i < len(matches) - 1:
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(chapter_content)

            section_content = chapter_content[start_pos:end_pos].strip()

            sections.append({
                'section_num': section_num,
                'section_title': section_title,
                'content': section_content
            })

        return sections

    def split_into_semantic_chunks(
        self,
        text: str,
        context: str = ""
    ) -> List[str]:
        """
        Chia văn bản thành các chunks có semantic dựa trên đoạn văn

        Args:
            text: Text cần chia
            context: Context để thêm vào đầu mỗi chunk

        Returns:
            List of chunks
        """
        chunks = []

        # Tách theo đoạn văn
        paragraphs = text.split('\n\n')

        current_chunk = context  # Bắt đầu với context

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Kiểm tra nếu thêm đoạn này vào chunk hiện tại có vượt quá giới hạn không
            potential_chunk = current_chunk + "\n\n" + para if current_chunk else para

            if self.estimate_tokens(potential_chunk) <= self.max_chunk_size:
                current_chunk = potential_chunk
            else:
                # Lưu chunk hiện tại và bắt đầu chunk mới
                if current_chunk:
                    chunks.append(current_chunk.strip())

                # Nếu đoạn văn quá dài, chia nhỏ hơn
                if self.estimate_tokens(para) > self.max_chunk_size:
                    # Chia theo câu
                    sentences = re.split(r'([.!?]\s+)', para)
                    current_chunk = context

                    for j in range(0, len(sentences), 2):
                        sentence = sentences[j]
                        if j + 1 < len(sentences):
                            sentence += sentences[j + 1]

                        potential = current_chunk + " " + sentence if current_chunk else sentence

                        if self.estimate_tokens(potential) <= self.max_chunk_size:
                            current_chunk = potential
                        else:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                            current_chunk = context + " " + sentence if context else sentence
                else:
                    current_chunk = context + "\n\n" + para if context else para

        # Thêm chunk cuối cùng
        if current_chunk:
            chunks.append(current_chunk.strip())

        return chunks

    def chunk_document(self, content: str) -> List[Dict]:
        """
        Chunk toàn bộ document với metadata

        Args:
            content: Nội dung document

        Returns:
            List of chunks với metadata
        """
        all_chunks = []
        chunk_id = 0

        # Trích xuất phần giới thiệu (trước chương 1)
        intro_pattern = r'^(.*?)(?=CHƯƠNG\s+1:)'
        intro_match = re.search(intro_pattern, content, re.DOTALL)

        if intro_match:
            intro_content = intro_match.group(1).strip()

            if intro_content:
                # Tạo chunks cho phần giới thiệu
                intro_chunks = self.split_into_semantic_chunks(
                    intro_content,
                    context="GIỚI THIỆU"
                )

                for chunk_text in intro_chunks:
                    all_chunks.append({
                        'chunk_id': f'chunk_{chunk_id:04d}',
                        'chapter': 'Giới thiệu',
                        'section': 'Lời nói đầu và Mục lục',
                        'context': 'GIỚI THIỆU',
                        'content': chunk_text,
                        'estimated_tokens': self.estimate_tokens(chunk_text),
                        'type': 'introduction'
                    })
                    chunk_id += 1

        # Xử lý từng chương
        chapters = self.extract_chapters(content)

        for chapter_key, chapter_data in chapters.items():
            chapter_title = chapter_data['title']
            chapter_content = chapter_data['content']

            # Trích xuất các mục trong chương
            sections = self.extract_sections(chapter_content)

            if sections:
                # Nếu có các mục, xử lý từng mục
                for section in sections:
                    section_num = section['section_num']
                    section_title = section['section_title']
                    section_content = section['content']

                    # Tạo context cho chunk
                    context = f"{chapter_title}\n{section_num} {section_title}"

                    # Chia section thành các chunks
                    section_chunks = self.split_into_semantic_chunks(
                        section_content,
                        context=context
                    )

                    for chunk_text in section_chunks:
                        all_chunks.append({
                            'chunk_id': f'chunk_{chunk_id:04d}',
                            'chapter': chapter_title,
                            'section': f"{section_num} {section_title}",
                            'context': context,
                            'content': chunk_text,
                            'estimated_tokens': self.estimate_tokens(chunk_text),
                            'type': 'section_content'
                        })
                        chunk_id += 1
            else:
                # Nếu không có mục, xử lý toàn bộ chương
                context = chapter_title
                chapter_chunks = self.split_into_semantic_chunks(
                    chapter_content,
                    context=context
                )

                for chunk_text in chapter_chunks:
                    all_chunks.append({
                        'chunk_id': f'chunk_{chunk_id:04d}',
                        'chapter': chapter_title,
                        'section': 'Toàn chương',
                        'context': context,
                        'content': chunk_text,
                        'estimated_tokens': self.estimate_tokens(chunk_text),
                        'type': 'chapter_content'
                    })
                    chunk_id += 1

        return all_chunks

    def chunk_file(self, file_path: str) -> List[Dict]:
        """
        Chunk file text

        Args:
            file_path: Đường dẫn file

        Returns:
            List of chunks với metadata
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        return self.chunk_document(content)
