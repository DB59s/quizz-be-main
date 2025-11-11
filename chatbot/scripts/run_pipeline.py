"""
Script để chạy Data Pipeline
Xử lý file text và lưu vào vector database
"""

import sys
import argparse
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from data_pipeline import DataPipeline
from core.config import settings


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Data Pipeline - Xử lý file text và lưu vào vector database"
    )

    parser.add_argument(
        "--file",
        type=str,
        help="Đường dẫn file text cần xử lý"
    )

    parser.add_argument(
        "--directory",
        type=str,
        help="Đường dẫn thư mục chứa files cần xử lý (xử lý tất cả .txt files)"
    )

    parser.add_argument(
        "--pattern",
        type=str,
        default="*.txt",
        help="Pattern để filter files (default: *.txt)"
    )

    parser.add_argument(
        "--no-recreate",
        action="store_true",
        help="Không tạo lại collection (add vào collection hiện có)"
    )

    args = parser.parse_args()

    # Validate arguments
    if not args.file and not args.directory:
        print("Error: Phải chỉ định --file hoặc --directory")
        print("\nExamples:")
        print("  python run_pipeline.py --file data/input/text.txt")
        print("  python run_pipeline.py --directory data/input")
        sys.exit(1)

    # Initialize pipeline
    pipeline = DataPipeline()

    try:
        if args.file:
            # Xử lý một file
            pipeline.process_file(
                input_file=args.file,
                recreate_collection=not args.no_recreate
            )
        else:
            # Xử lý directory
            pipeline.process_directory(
                input_dir=args.directory,
                pattern=args.pattern
            )

        print("\n✓ Pipeline completed successfully!")

    except Exception as e:
        print(f"\n✗ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
