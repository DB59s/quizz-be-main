"""
FastAPI Application - REST API cho Chatbot RAG System
"""

from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional

from .models import (
    QueryRequest, QueryResponse, SourceInfo, HealthResponse,
    UploadRequest, UploadResponse, DeleteCollectionResponse,
    InternalSearchRequest, InternalSearchResponse, BatchUploadRequest, BatchUploadResponse
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

            # Refresh query engine if collection was recreated
            if request.recreate_collection:
                global query_engine
                query_engine = QueryEngine()
                print("[Upload] ✓ Query engine refreshed after collection recreation")

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


# ============================================================================
# INTERNAL API ENDPOINTS (for chatbot-service-api)
# ============================================================================

@app.post("/api/v1/internal/knowledge/search", response_model=InternalSearchResponse)
async def internal_search(request: InternalSearchRequest):
    """
    Internal Search endpoint - Used by chatbot-service-api for RAG

    This endpoint is specifically designed to match the format expected by
    chatbot-service-api's rag.service.js

    Args:
        request: InternalSearchRequest with query and optional parameters

    Returns:
        InternalSearchResponse matching chatbot-service expectations
    """
    try:
        print(f"\n[Internal API] Search request received")
        print(f"[Internal API] - Query: {request.query}")
        print(f"[Internal API] - Top K: {request.top_k}")

        # Search using query engine
        sources = query_engine.search(
            question=request.query,
            top_k=request.top_k,
            filter_chapter=request.filter_chapter,
            filter_section=request.filter_section
        )

        # Transform to format expected by chatbot-service
        # chatbot-service expects: { data: [{ text/content: "...", ... }] }
        data = []
        for source in sources:
            data.append({
                "text": source["content"],  # Primary field for rag.service.js
                "content": source["content"],  # Backup field
                "chunk_id": source["chunk_id"],
                "similarity_score": source["similarity_score"],
                "chapter": source["chapter"],
                "section": source["section"],
                "type": source["type"],
                "estimated_tokens": source["estimated_tokens"],
                "rank": source["rank"]
            })

        print(f"[Internal API] ✓ Found {len(data)} sources")

        return InternalSearchResponse(
            success=True,
            data=data,
            total=len(data),
            query=request.query
        )

    except Exception as e:
        print(f"[Internal API] ❌ Search error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal search failed: {str(e)}")


@app.post("/api/v1/internal/knowledge/batch-upload", response_model=BatchUploadResponse)
async def batch_upload(request: BatchUploadRequest):
    """
    Batch Upload endpoint - Upload multiple documents at once

    Args:
        request: BatchUploadRequest with list of documents

    Returns:
        BatchUploadResponse with processing results
    """
    try:
        print(f"\n[Batch Upload] Processing {len(request.documents)} documents")
        print(f"[Batch Upload] Recreate collection: {request.recreate_collection}")

        results = []
        total_chunks = 0

        # Initialize pipeline
        pipeline = DataPipeline()

        # Process first document with recreate_collection flag
        for idx, doc in enumerate(request.documents):
            print(f"\n[Batch Upload] Document {idx + 1}/{len(request.documents)}: {doc.filename}")

            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tmp_file:
                tmp_file.write(doc.content)
                tmp_file_path = tmp_file.name

            try:
                # Only recreate on first document if requested
                recreate = request.recreate_collection and idx == 0

                result = pipeline.process_file(
                    input_file=tmp_file_path,
                    recreate_collection=recreate
                )

                chunks = result.get('chunks_processed', 0)
                total_chunks += chunks

                results.append({
                    "filename": doc.filename,
                    "success": True,
                    "chunks_processed": chunks
                })

                print(f"[Batch Upload] ✓ {doc.filename}: {chunks} chunks")

            except Exception as doc_error:
                print(f"[Batch Upload] ✗ {doc.filename}: {str(doc_error)}")
                results.append({
                    "filename": doc.filename,
                    "success": False,
                    "error": str(doc_error)
                })

            finally:
                # Clean up temporary file
                if os.path.exists(tmp_file_path):
                    os.unlink(tmp_file_path)

        # Refresh query engine if collection was recreated
        if request.recreate_collection:
            global query_engine
            query_engine = QueryEngine()
            print("[Batch Upload] ✓ Query engine refreshed after collection recreation")

        # Get updated stats
        stats = query_engine.get_stats()

        success_count = sum(1 for r in results if r.get("success", False))

        print(f"\n[Batch Upload] ✓ Completed: {success_count}/{len(request.documents)} successful")

        return BatchUploadResponse(
            success=True,
            message=f"Processed {len(request.documents)} documents",
            total_documents=len(request.documents),
            successful_uploads=success_count,
            total_chunks_processed=total_chunks,
            collection_name=stats['collection_name'],
            total_documents_in_db=stats['total_documents'],
            results=results
        )

    except Exception as e:
        print(f"[Batch Upload] ❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")


@app.get("/api/v1/internal/knowledge/stats")
async def internal_stats():
    """
    Internal Stats endpoint - Get ChromaDB statistics

    Returns:
        Collection statistics for monitoring
    """
    try:
        stats = query_engine.get_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


# ============================================================================
# PUBLIC API ENDPOINTS (for direct access)
# ============================================================================

@app.post("/api/v1/knowledge/search", response_model=QueryResponse)
async def public_search(request: QueryRequest):
    """
    Public Search endpoint - Vector search with detailed response

    This is the public version with more detailed information
    """
    try:
        sources = query_engine.search(
            question=request.question,
            top_k=request.top_k,
            filter_chapter=request.filter_chapter,
            filter_section=request.filter_section
        )

        source_infos = [SourceInfo(**source) for source in sources]

        return QueryResponse(
            question=request.question,
            total_sources=len(source_infos),
            sources=source_infos
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@app.post("/api/v1/knowledge/upload", response_model=UploadResponse)
async def public_upload(request: UploadRequest):
    """
    Public Upload endpoint - Upload single document
    """
    try:
        print(f"\n[Public API] Upload: {request.filename}")

        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as tmp_file:
            tmp_file.write(request.content)
            tmp_file_path = tmp_file.name

        try:
            pipeline = DataPipeline()
            result = pipeline.process_file(
                input_file=tmp_file_path,
                recreate_collection=request.recreate_collection
            )

            # Refresh query engine if collection was recreated
            if request.recreate_collection:
                global query_engine
                query_engine = QueryEngine()
                print("[Public API] ✓ Query engine refreshed after collection recreation")

            stats = query_engine.get_stats()

            return UploadResponse(
                filename=request.filename,
                chunks_processed=result.get('chunks_processed', 0),
                collection_name=stats['collection_name'],
                total_documents=stats['total_documents']
            )

        finally:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except Exception as e:
        print(f"[Public API] Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.delete("/api/v1/knowledge/collection", response_model=DeleteCollectionResponse)
async def public_delete_collection():
    """
    Public Delete endpoint - Clear all data
    """
    try:
        collection_name = settings.COLLECTION_NAME
        query_engine.vector_store.create_collection(delete_if_exists=True)

        return DeleteCollectionResponse(
            message=f"Collection '{collection_name}' deleted successfully",
            collection_name=collection_name
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@app.get("/api/v1/knowledge/stats")
async def public_stats():
    """
    Public Stats endpoint - Get collection information
    """
    try:
        stats = query_engine.get_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_service.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )
