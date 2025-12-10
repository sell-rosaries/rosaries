import os
import shutil
import json
from pathlib import Path
from typing import List, Dict, Optional, Any
import mimetypes
from rich.console import Console

console = Console()

class FileOperations:
    """File and directory operations utilities"""
    
    @staticmethod
    def ensure_directory(path: str) -> bool:
        """Ensure directory exists, create if necessary"""
        try:
            Path(path).mkdir(parents=True, exist_ok=True)
            return True
        except Exception as e:
            console.print(f"[red]Error creating directory {path}: {e}[/red]")
            return False
    
    @staticmethod
    def safe_copy(src: str, dst: str) -> bool:
        """Safely copy file with error handling"""
        try:
            if not os.path.exists(src):
                console.print(f"[red]Source file not found: {src}[/red]")
                return False
            
            # Ensure destination directory exists
            dst_dir = os.path.dirname(dst)
            if dst_dir and not FileOperations.ensure_directory(dst_dir):
                return False
            
            shutil.copy2(src, dst)
            return True
        except Exception as e:
            console.print(f"[red]Error copying {src} to {dst}: {e}[/red]")
            return False
    
    @staticmethod
    def safe_move(src: str, dst: str) -> bool:
        """Safely move file with error handling"""
        try:
            if not os.path.exists(src):
                console.print(f"[red]Source file not found: {src}[/red]")
                return False
            
            # Ensure destination directory exists
            dst_dir = os.path.dirname(dst)
            if dst_dir and not FileOperations.ensure_directory(dst_dir):
                return False
            
            shutil.move(src, dst)
            return True
        except Exception as e:
            console.print(f"[red]Error moving {src} to {dst}: {e}[/red]")
            return False
    
    @staticmethod
    def safe_delete(path: str) -> bool:
        """Safely delete file or directory"""
        try:
            if not os.path.exists(path):
                return True  # Already doesn't exist
            
            if os.path.isfile(path):
                os.remove(path)
            elif os.path.isdir(path):
                shutil.rmtree(path)
            
            return True
        except Exception as e:
            console.print(f"[red]Error deleting {path}: {e}[/red]")
            return False
    
    @staticmethod
    def get_file_size(path: str) -> Optional[int]:
        """Get file size in bytes"""
        try:
            return os.path.getsize(path)
        except Exception as e:
            console.print(f"[red]Error getting file size for {path}: {e}[/red]")
            return None
    
    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Format file size in human readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        import math
        i = int(math.floor(math.log(size_bytes, 1024)))
        p = math.pow(1024, i)
        s = round(size_bytes / p, 2)
        return f"{s} {size_names[i]}"
    
    @staticmethod
    def find_files(directory: str, extensions: List[str] = None, recursive: bool = False) -> List[str]:
        """Find files in directory with optional extension filtering"""
        try:
            path = Path(directory)
            if not path.exists():
                return []
            
            files = []
            pattern = "**/*" if recursive else "*"
            
            for file_path in path.glob(pattern):
                if file_path.is_file():
                    if extensions is None or file_path.suffix.lower() in [ext.lower() for ext in extensions]:
                        files.append(str(file_path))
            
            return files
        except Exception as e:
            console.print(f"[red]Error finding files in {directory}: {e}[/red]")
            return []
    
    @staticmethod
    def get_mime_type(file_path: str) -> Optional[str]:
        """Get MIME type for file"""
        try:
            mime_type, _ = mimetypes.guess_type(file_path)
            return mime_type
        except Exception:
            return None
    
    @staticmethod
    def is_image_file(file_path: str) -> bool:
        """Check if file is a valid image"""
        mime_type = FileOperations.get_mime_type(file_path)
        if not mime_type:
            return False
        
        return mime_type.startswith('image/')
    
    @staticmethod
    def backup_directory(source_dir: str, backup_dir: str) -> bool:
        """Create backup of entire directory"""
        try:
            if not os.path.exists(source_dir):
                console.print(f"[red]Source directory not found: {source_dir}[/red]")
                return False
            
            if not FileOperations.ensure_directory(backup_dir):
                return False
            
            # Use shutil.copytree for complete backup
            if os.path.exists(backup_dir):
                shutil.rmtree(backup_dir)
            
            shutil.copytree(source_dir, backup_dir)
            console.print(f"[green]✓[/green] Backup created: {backup_dir}")
            return True
            
        except Exception as e:
            console.print(f"[red]Error creating backup: {e}[/red]")
            return False
    
    @staticmethod
    def clean_directory(directory: str, pattern: str = "*", max_age_days: int = None) -> int:
        """Clean files in directory matching pattern and optionally age"""
        try:
            path = Path(directory)
            if not path.exists():
                return 0
            
            import time
            current_time = time.time()
            max_age_seconds = max_age_days * 24 * 60 * 60 if max_age_days else None
            
            deleted_count = 0
            for file_path in path.glob(pattern):
                if file_path.is_file():
                    if max_age_seconds:
                        file_age = current_time - file_path.stat().st_mtime
                        if file_age < max_age_seconds:
                            continue
                    
                    if file_path.unlink():
                        deleted_count += 1
            
            return deleted_count
            
        except Exception as e:
            console.print(f"[red]Error cleaning directory {directory}: {e}[/red]")
            return 0
    
    @staticmethod
    def create_archive(source_dir: str, archive_path: str, format: str = 'zip') -> bool:
        """Create archive of directory"""
        try:
            import zipfile
            import tarfile
            
            if format.lower() == 'zip':
                with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    for root, dirs, files in os.walk(source_dir):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, source_dir)
                            zipf.write(file_path, arcname)
            
            elif format.lower() == 'tar.gz':
                with tarfile.open(archive_path, 'w:gz') as tarf:
                    tarf.add(source_dir, arcname=os.path.basename(source_dir))
            
            else:
                console.print(f"[red]Unsupported archive format: {format}[/red]")
                return False
            
            console.print(f"[green]✓[/green] Archive created: {archive_path}")
            return True
            
        except Exception as e:
            console.print(f"[red]Error creating archive: {e}[/red]")
            return False
    
    @staticmethod
    def extract_archive(archive_path: str, extract_dir: str) -> bool:
        """Extract archive to directory"""
        try:
            if archive_path.endswith('.zip'):
                import zipfile
                with zipfile.ZipFile(archive_path, 'r') as zipf:
                    zipf.extractall(extract_dir)
            
            elif archive_path.endswith(('.tar.gz', '.tgz')):
                import tarfile
                with tarfile.open(archive_path, 'r:gz') as tarf:
                    tarf.extractall(extract_dir)
            
            else:
                console.print(f"[red]Unsupported archive format[/red]")
                return False
            
            console.print(f"[green]✓[/green] Archive extracted to: {extract_dir}")
            return True
            
        except Exception as e:
            console.print(f"[red]Error extracting archive: {e}[/red]")
            return False
    
    @staticmethod
    def validate_path_access(path: str, mode: str = 'r') -> bool:
        """Validate path access permissions"""
        try:
            if mode == 'r':
                return os.access(path, os.R_OK)
            elif mode == 'w':
                return os.access(path, os.W_OK)
            elif mode == 'rw':
                return os.access(path, os.R_OK | os.W_OK)
            else:
                return False
        except Exception:
            return False
    
    @staticmethod
    def get_directory_size(directory: str) -> int:
        """Get total size of directory in bytes"""
        try:
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(directory):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    if os.path.exists(filepath):
                        total_size += os.path.getsize(filepath)
            return total_size
        except Exception as e:
            console.print(f"[red]Error calculating directory size: {e}[/red]")
            return 0
    
    @staticmethod
    def list_directory_tree(directory: str, max_depth: int = 3) -> Dict[str, Any]:
        """Create tree structure of directory"""
        try:
            tree = {}
            path = Path(directory)
            
            def build_tree(current_path, current_depth, max_depth):
                if current_depth > max_depth:
                    return "..."
                
                if not current_path.exists():
                    return None
                
                if current_path.is_file():
                    return {
                        'type': 'file',
                        'size': FileOperations.get_file_size(str(current_path)),
                        'modified': current_path.stat().st_mtime
                    }
                
                if current_path.is_dir():
                    items = {}
                    try:
                        for item in current_path.iterdir():
                            items[item.name] = build_tree(item, current_depth + 1, max_depth)
                    except PermissionError:
                        items['error'] = 'Permission denied'
                    
                    return {
                        'type': 'directory',
                        'children': items
                    }
                
                return None
            
            return build_tree(path, 0, max_depth)
            
        except Exception as e:
            console.print(f"[red]Error building directory tree: {e}[/red]")
            return {}