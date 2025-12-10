import os
import time
import hashlib
import json
import datetime
from pathlib import Path
from typing import List, Dict, Optional, Any, Callable
from rich.console import Console
from rich.progress import Progress, BarColumn, TextColumn, TimeElapsedColumn
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

console = Console()

class Helpers:
    """Helper utilities and functions"""
    
    @staticmethod
    def generate_timestamp(format_str: str = "%Y%m%d_%H%M%S") -> str:
        """Generate timestamp string"""
        return datetime.datetime.now().strftime(format_str)
    
    @staticmethod
    def generate_unique_id(prefix: str = "") -> str:
        """Generate unique identifier"""
        timestamp = Helpers.generate_timestamp("%Y%m%d%H%M%S")
        random_part = hashlib.md5(str(time.time()).encode()).hexdigest()[:8]
        return f"{prefix}{timestamp}_{random_part}" if prefix else f"{timestamp}_{random_part}"
    
    @staticmethod
    def calculate_file_hash(file_path: str, algorithm: str = 'md5') -> Optional[str]:
        """Calculate file hash"""
        try:
            hash_func = hashlib.new(algorithm)
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_func.update(chunk)
            return hash_func.hexdigest()
        except Exception as e:
            console.print(f"[red]Error calculating hash for {file_path}: {e}[/red]")
            return None
    
    @staticmethod
    def format_duration(seconds: float) -> str:
        """Format duration in human readable format"""
        if seconds < 60:
            return f"{seconds:.1f}s"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            remaining_seconds = seconds % 60
            return f"{minutes}m {remaining_seconds:.1f}s"
        else:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            remaining_seconds = seconds % 60
            return f"{hours}h {minutes}m {remaining_seconds:.1f}s"
    
    @staticmethod
    def format_speed(bytes_per_second: float) -> str:
        """Format speed in human readable format"""
        if bytes_per_second < 1024:
            return f"{bytes_per_second:.1f} B/s"
        elif bytes_per_second < 1024**2:
            return f"{bytes_per_second/1024:.1f} KB/s"
        elif bytes_per_second < 1024**3:
            return f"{bytes_per_second/1024**2:.1f} MB/s"
        else:
            return f"{bytes_per_second/1024**3:.1f} GB/s"
    
    @staticmethod
    def sanitize_filename(filename: str, max_length: int = 255) -> str:
        """Sanitize filename for cross-platform compatibility"""
        # Remove or replace invalid characters
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            filename = filename.replace(char, '_')
        
        # Remove leading/trailing dots and spaces
        filename = filename.strip('. ')
        
        # Limit length
        if len(filename) > max_length:
            name, ext = os.path.splitext(filename)
            filename = name[:max_length-len(ext)] + ext
        
        # Ensure not empty
        if not filename:
            filename = "unnamed"
        
        return filename
    
    @staticmethod
    def safe_filename_from_path(file_path: str) -> str:
        """Create safe filename from file path"""
        path = Path(file_path)
        return Helpers.sanitize_filename(path.stem) + path.suffix
    
    @staticmethod
    def expand_path(path: str) -> str:
        """Expand user home directory and environment variables in path"""
        return os.path.expanduser(os.path.expandvars(path))
    
    @staticmethod
    def get_platform_info() -> Dict[str, Any]:
        """Get platform information"""
        import platform
        import sys
        
        info = {
            'system': platform.system(),
            'platform': platform.platform(),
            'architecture': platform.architecture(),
            'python_version': sys.version,
            'python_executable': sys.executable,
            'current_directory': os.getcwd(),
            'home_directory': os.path.expanduser('~'),
            'termux': os.environ.get('TERMUX_VERSION') is not None,
            'pws': os.environ.get('PWSH_VERSION') is not None
        }
        
        return info
    
    @staticmethod
    def check_dependencies() -> Dict[str, bool]:
        """Check if required dependencies are available"""
        dependencies = {
            'google.generativeai': False,
            'PIL': False,
            'rich': False,
            'requests': False
        }
        
        try:
            import google.generativeai
            dependencies['google.generativeai'] = True
        except ImportError:
            pass
        
        try:
            from PIL import Image
            dependencies['PIL'] = True
        except ImportError:
            pass
        
        try:
            import rich
            dependencies['rich'] = True
        except ImportError:
            pass
        
        try:
            import requests
            dependencies['requests'] = True
        except ImportError:
            pass
        
        return dependencies
    
    @staticmethod
    def retry_with_backoff(func: Callable, max_retries: int = 3, base_delay: float = 1.0) -> Any:
        """Execute function with exponential backoff retry"""
        for attempt in range(max_retries + 1):
            try:
                return func()
            except Exception as e:
                if attempt == max_retries:
                    raise e
                
                delay = base_delay * (2 ** attempt)
                console.print(f"[yellow]Attempt {attempt + 1} failed: {e}[/yellow]")
                console.print(f"[yellow]Retrying in {delay:.1f} seconds...[/yellow]")
                time.sleep(delay)
        
        return None  # Should not reach here
    
    @staticmethod
    def create_progress_tracker(total: int, description: str = "Processing"):
        """Create progress tracker"""
        return Progress(
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console
        )
    
    @staticmethod
    def safe_json_load(file_path: str, default: Any = None) -> Any:
        """Safely load JSON file with fallback"""
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            console.print(f"[yellow]Warning: Could not load {file_path}: {e}[/yellow]")
            return default if default is not None else {}
    
    @staticmethod
    def safe_json_save(data: Any, file_path: str, indent: int = 2) -> bool:
        """Safely save data to JSON file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=indent)
            return True
        except Exception as e:
            console.print(f"[red]Error saving {file_path}: {e}[/red]")
            return False
    
    @staticmethod
    def create_display_name(original_name: str, max_length: int = 20) -> str:
        """Create short display name from original name"""
        if len(original_name) <= max_length:
            return original_name
        
        # Truncate and add ellipsis
        return original_name[:max_length-3] + "..."
    
    @staticmethod
    def validate_color(color: str) -> bool:
        """Validate color format (hex, rgb, etc.)"""
        import re
    
        # Hex color
        if re.match(r'^#[0-9A-Fa-f]{6}$', color):
            return True
    
        # RGB format
        if re.match(r'^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$', color):
            return True
    
        # Named colors (basic set)
        named_colors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey']
        if color.lower() in named_colors:
            return True
    
        return False
    
    @staticmethod
    def parse_color(color: str) -> Optional[Dict[str, int]]:
        """Parse color string to RGB dictionary"""
        import re
    
        # Hex color
        if color.startswith('#'):
            hex_color = color[1:]
            if len(hex_color) == 6:
                return {
                    'r': int(hex_color[0:2], 16),
                    'g': int(hex_color[2:4], 16),
                    'b': int(hex_color[4:6], 16)
                }
    
        # RGB format
        rgb_match = re.match(r'^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$', color)
        if rgb_match:
            return {
                'r': int(rgb_match.group(1)),
                'g': int(rgb_match.group(2)),
                'b': int(rgb_match.group(3))
            }
    
        # Named colors
        color_map = {
            'red': {'r': 255, 'g': 0, 'b': 0},
            'green': {'r': 0, 'g': 255, 'b': 0},
            'blue': {'r': 0, 'g': 0, 'b': 255},
            'yellow': {'r': 255, 'g': 255, 'b': 0},
            'orange': {'r': 255, 'g': 165, 'b': 0},
            'purple': {'r': 128, 'g': 0, 'b': 128},
            'pink': {'r': 255, 'g': 192, 'b': 203},
            'brown': {'r': 165, 'g': 42, 'b': 42},
            'black': {'r': 0, 'g': 0, 'b': 0},
            'white': {'r': 255, 'g': 255, 'b': 255},
            'gray': {'r': 128, 'g': 128, 'b': 128},
            'grey': {'r': 128, 'g': 128, 'b': 128}
        }
    
        return color_map.get(color.lower())
    
    @staticmethod
    def create_summary_report(results: List[Dict[str, Any]]) -> str:
        """Create summary report from results"""
        if not results:
            return "No results to summarize"
    
        total = len(results)
        successful = sum(1 for r in results if r.get('success', False))
        failed = total - successful
    
        report = f"""
[bold]Processing Summary[/bold]
{'='*30}
Total Images: {total}
Successful: {successful}
Failed: {failed}
Success Rate: {(successful/total*100):.1f}%
        """
    
        if failed > 0:
            report += "\n[red]Failed Images:[/red]"
            for result in results:
                if not result.get('success', False):
                    error = result.get('error_message', 'Unknown error')
                    report += f"\n• {result.get('image_name', 'Unknown')}: {error}"
    
        return report
    
    @staticmethod
    def get_estimated_time_remaining(completed: int, total: int, start_time: float) -> str:
        """Calculate estimated time remaining"""
        if completed == 0:
            return "Unknown"
    
        elapsed = time.time() - start_time
        avg_time_per_item = elapsed / completed
        remaining_items = total - completed
        estimated_remaining = avg_time_per_item * remaining_items
    
        return Helpers.format_duration(estimated_remaining)
    
    @staticmethod
    def normalize_path(path: str) -> str:
        """Normalize path for cross-platform compatibility"""
        # Expand user home directory
        expanded = os.path.expanduser(path)
        
        # Convert to absolute path
        absolute = os.path.abspath(expanded)
        
        # Normalize separators
        normalized = os.path.normpath(absolute)
        
        return normalized
    
    @staticmethod
    def check_file_exists_and_readable(file_path: str) -> bool:
        """Check if file exists and is readable"""
        try:
            return os.path.exists(file_path) and os.access(file_path, os.R_OK)
        except Exception:
            return False
    
    @staticmethod
    def get_file_extension(file_path: str) -> str:
        """Get file extension in lowercase"""
        return Path(file_path).suffix.lower()
    
    @staticmethod
    def is_image_file(file_path: str) -> bool:
        """Check if file is an image based on extension"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.gif'}
        return Helpers.get_file_extension(file_path) in image_extensions
    
    @staticmethod
    def create_temp_directory(prefix: str = "gemini_temp_") -> Optional[str]:
        """Create temporary directory"""
        try:
            import tempfile
            temp_dir = tempfile.mkdtemp(prefix=prefix)
            return temp_dir
        except Exception as e:
            console.print(f"[red]Error creating temp directory: {e}[/red]")
            return None
    
    @staticmethod
    def cleanup_temp_directory(temp_dir: str):
        """Clean up temporary directory"""
        try:
            import shutil
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        except Exception as e:
            console.print(f"[yellow]Warning: Could not cleanup temp directory {temp_dir}: {e}[/yellow]")