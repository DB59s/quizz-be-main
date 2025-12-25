"""
Script để chạy API Server
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import uvicorn
from core.config import settings


def main():
    """Main function"""
    print(f"\n{'='*80}")
    print("CHATBOT RAG API SERVER")
    print(f"{'='*80}")
    print(f"Host: {settings.API_HOST}")
    print(f"Port: {settings.API_PORT}")
    print(f"Docs: http://{settings.API_HOST}:{settings.API_PORT}/docs")
    print(f"{'='*80}\n")

    uvicorn.run(
        "api_service.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.API_RELOAD
    )


if __name__ == "__main__":
    main()
