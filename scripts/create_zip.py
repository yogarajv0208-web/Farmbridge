"""
Creates a fresh, clean FarmBridge_Final.zip containing all source files,
standalone bundles, documentation, and tests.
"""

import os
import zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.path.join(ROOT_DIR, "FarmBridge_Final.zip")

EXCLUDE_DIRS = {".git", "__pycache__", ".vscode", ".idea"}
EXCLUDE_EXTS = {".pyc", ".lock"}
EXCLUDE_FILES = {"FarmBridge_Final.zip"}

def make_zip():
    print(f"Creating {ZIP_PATH}...")
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(ROOT_DIR):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            for file in files:
                if file in EXCLUDE_FILES:
                    continue
                _, ext = os.path.splitext(file)
                if ext in EXCLUDE_EXTS:
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ROOT_DIR)
                zf.write(full_path, rel_path)
                
    zip_size = os.path.getsize(ZIP_PATH)
    print(f"Zip created successfully! Size: {zip_size:,} bytes")

if __name__ == "__main__":
    make_zip()
