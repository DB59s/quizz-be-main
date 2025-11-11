"""
FastAPI Application - REST API cho Chatbot RAG System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional

from .models import (
    QueryRequest, QueryResponse, SourceInfo, HealthResponse,
    UploadRequest, UploadResponse, DeleteCollectionResponse
)
from .query_engine import QueryEngine
from core.config import settings
from data_pipeline import DataPipeline
import tempfile
import os


# Global query engine
query_engine = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager cho FastAPI app"""
    # Startup
    global query_engine
    print("Starting up API service...")
    try:
        query_engine = QueryEngine()
        print("✓ API service ready")
    except Exception as e:
        print(f"✗ Failed to start API service: {e}")
        raise

    yield

    # Shutdown
    print("Shutting down API service...")


# FastAPI app
app = FastAPI(
    title="Chatbot RAG API",
    description="REST API cho hệ thống chatbot với Retrieval-Augmented Generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong production nên giới hạn origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Chatbot RAG API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint - Kiểm tra trạng thái service
    """
    try:
        stats = query_engine.get_stats()
        return HealthResponse(
            status="healthy",
            collection_name=stats["collection_name"],
            total_documents=stats["total_documents"],
            model=query_engine.vector_store.model_name
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Query endpoint - Nhận câu hỏi và trả về 10 nguồn thông tin

    Args:
        request: QueryRequest chứa question và các tham số

    Returns:
        QueryResponse chứa danh sách nguồn thông tin
    """
    try:
        # Search
        sources = query_engine.search(
            question=request.question,
            top_k=request.top_k,
            filter_chapter=request.filter_chapter,
            filter_section=request.filter_section
        )

        # Convert to response model
        source_infos = [SourceInfo(**source) for source in sources]

        return QueryResponse(
            question=request.question,
            total_sources=len(source_infos),
            sources=source_infos
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/stats")
async def get_stats():
    """
    Stats endpoint - Lấy thống kê về vector database
    """
    try:
        stats = query_engine.get_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@app.post("/upload", response_model=UploadResponse)
async def upload_file(request: UploadRequest):
    """
    Upload endpoint - Upload text file và xử lý vào vector database

    Args:
        request: UploadRequest chứa filename, content, và recreate_collection flag

    Returns:
        UploadResponse với thông tin về file đã xử lý
    """
    try:
        print(f"\n[Upload] Processing file: {request.filename}")
        print(f"[Upload] Content length: {len(request.content)} characters")
        print(f"[Upload] Recreate collection: {request.recreate_collection}")

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tmp_file:
            tmp_file.write(request.content)
            tmp_file_path = tmp_file.name

        try:
            # Initialize pipeline
            pipeline = DataPipeline()

            # Process file
            result = pipeline.process_file(
                input_file=tmp_file_path,
                recreate_collection=request.recreate_collection
            )

            # Get updated stats
            stats = query_engine.get_stats()

            return UploadResponse(
                filename=request.filename,
                chunks_processed=result.get('chunks_processed', 0),
                collection_name=stats['collection_name'],
                total_documents=stats['total_documents']
            )

        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except Exception as e:
        print(f"[Upload] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.delete("/collection", response_model=DeleteCollectionResponse)
async def delete_collection():
    """
    Delete collection endpoint - Xóa toàn bộ collection

    Returns:
        DeleteCollectionResponse với thông báo
    """
    try:
        collection_name = settings.COLLECTION_NAME

        # Delete and recreate collection
        query_engine.vector_store.create_collection(delete_if_exists=True)

        print(f"[Delete] Collection '{collection_name}' deleted and recreated")

        return DeleteCollectionResponse(
            message=f"Collection '{collection_name}' deleted successfully",
            collection_name=collection_name
        )

    except Exception as e:
        print(f"[Delete] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_service.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )
