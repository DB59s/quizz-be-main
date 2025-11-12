"""
Text Normalizer - Chuẩn hóa text cho embedding
Dựa trên normalize_light.py
"""

import re


class TextNormalizer:
    """Chuẩn hóa text giữ tối đa thông tin"""

    @staticmethod
    def normalize(text: str) -> str:
        """
        Chuẩn hóa NHẸ - giữ tối đa thông tin:
        1. GIỮ NGUYÊN chữ hoa/thường (case-sensitive)
        2. GIỮ NGUYÊN xuống dòng cơ bản (\n)
        3. Chỉ xóa ký tự vẽ box (─│┌└...)
        4. Chuẩn hóa khoảng trắng thừa
        5. Giữ TẤT CẢ dấu câu

        Args:
            text: Text cần chuẩn hóa

        Returns:
            Normalized text
        """
        if not text:
            return text

        # 1. Xóa ký tự vẽ box và ký tự đặc biệt trang trí
        text = re.sub(
            r'[─│┌└┐┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬▀▄█▌▐░▒▓■□▪▫●○◘◙✓✗✅❌]',
            '',
            text
        )

        # 2. Chuẩn hóa nhiều xuống dòng liên tiếp -> 2 xuống dòng (giữ đoạn văn)
        text = re.sub(r'\n{3,}', '\n\n', text)

        # 3. Xóa khoảng trắng đầu/cuối mỗi dòng
        lines = text.split('\n')
        lines = [line.strip() for line in lines]
        text = '\n'.join(lines)

        # 4. Chuẩn hóa nhiều khoảng trắng liên tiếp -> 1 khoảng trắng
        text = re.sub(r'[ \t]+', ' ', text)

        # 5. Xóa khoảng trắng trước dấu câu
        text = re.sub(r'\s+([.,;!?:])', r'\1', text)

        # 6. Thêm khoảng trắng sau dấu câu nếu chưa có
        text = re.sub(r'([.,;!?:])([^\s\n])', r'\1 \2', text)

        # 7. Trim toàn bộ
        text = text.strip()

        return text

    @staticmethod
    def normalize_chunk(chunk: dict) -> dict:
        """
        Chuẩn hóa một chunk (in-place)

        Args:
            chunk: Dict chứa 'content' và 'context'

        Returns:
            Normalized chunk
        """
        if 'content' in chunk:
            chunk['content'] = TextNormalizer.normalize(chunk['content'])
        if 'context' in chunk:
            chunk['context'] = TextNormalizer.normalize(chunk['context'])

        return chunk

    @staticmethod
    def normalize_chunks(chunks: list) -> list:
        """
        Chuẩn hóa list of chunks

        Args:
            chunks: List of chunk dicts

        Returns:
            List of normalized chunks
        """
        return [TextNormalizer.normalize_chunk(chunk) for chunk in chunks]
