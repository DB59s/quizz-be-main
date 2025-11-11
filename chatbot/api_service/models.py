"""
Pydantic Models cho API
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    """Request model cho query"""
    question: str = Field(..., description="Câu hỏi từ user", min_length=1)
    top_k: int = Field(10, description="Số lượng nguồn thông tin trả về", ge=1, le=50)
    filter_chapter: Optional[str] = Field(None, description="Lọc theo chương (optional)")
    filter_section: Optional[str] = Field(None, description="Lọc theo mục (optional)")


class SourceInfo(BaseModel):
    """Thông tin về một nguồn"""
    rank: int = Field(..., description="Thứ hạng (1 = liên quan nhất)")
    chunk_id: str = Field(..., description="ID của chunk")
    similarity_score: float = Field(..., description="Độ tương đồng (0-1)")
    chapter: str = Field(..., description="Tên chương")
    section: str = Field(..., description="Tên mục")
    content: str = Field(..., description="Nội dung chunk")
    estimated_tokens: int = Field(..., description="Số tokens ước lượng")
    type: str = Field(..., description="Loại chunk (introduction, section_content, etc.)")


class QueryResponse(BaseModel):
    """Response model cho query"""
    question: str = Field(..., description="Câu hỏi đã query")
    total_sources: int = Field(..., description="Tổng số nguồn tìm được")
    sources: List[SourceInfo] = Field(..., description="Danh sách nguồn thông tin")


class HealthResponse(BaseModel):
    """Response model cho health check"""
    status: str = Field(..., description="Trạng thái service")
    collection_name: str = Field(..., description="Tên collection")
    total_documents: int = Field(..., description="Tổng số documents")
    model: str = Field(..., description="Model embedding đang dùng")


class UploadRequest(BaseModel):
    """Request model cho upload"""
    filename: str = Field(..., description="Tên file", min_length=1)
    content: str = Field(..., description="Nội dung file text", min_length=1)
    recreate_collection: bool = Field(False, description="Có tạo lại collection không")


class UploadResponse(BaseModel):
    """Response model cho upload"""
    filename: str = Field(..., description="Tên file đã upload")
    chunks_processed: int = Field(..., description="Số chunks đã xử lý")
    collection_name: str = Field(..., description="Tên collection")
    total_documents: int = Field(..., description="Tổng số documents sau khi upload")


class DeleteCollectionResponse(BaseModel):
    """Response model cho delete collection"""
    message: str = Field(..., description="Thông báo")
    collection_name: str = Field(..., description="Tên collection đã xóa")
