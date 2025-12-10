import os
import json
from pathlib import Path
from PIL import Image
from typing import List, Dict, Optional, Any
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich import print as rprint

console = Console()

class ImageProcessor:
    """Handles image validation, preprocessing, and file operations"""
    
    SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
    
    def __init__(self):
        self.input_images = []
        self.reference_images = []
    
    def validate_image_file(self, file_path: str) -> Dict[str, Any]:
        """Validate an image file and return its properties"""
        try:
            path = Path(file_path)
            
            if not path.exists():
                return {'valid': False, 'error': 'File does not exist'}
            
            if not path.is_file():
                return {'valid': False, 'error': 'Path is not a file'}
            
            if path.suffix.lower() not in self.SUPPORTED_FORMATS:
                return {'valid': False, 'error': f'Unsupported format: {path.suffix}'}
            
            file_size = path.stat().st_size
            if file_size > self.MAX_FILE_SIZE:
                return {'valid': False, 'error': f'File too large: {file_size / 1024 / 1024:.1f}MB'}
            
            # Try to open and validate the image
            try:
                with Image.open(file_path) as img:
                    width, height = img.size
                    format_name = img.format
                    
                    return {
                        'valid': True,
                        'path': str(path.absolute()),
                        'name': path.stem,
                        'extension': path.suffix.lower(),
                        'width': width,
                        'height': height,
                        'size_mb': file_size / 1024 / 1024,
                        'format': format_name,
                        'mode': img.mode
                    }
            except Exception as e:
                return {'valid': False, 'error': f'Invalid image file: {str(e)}'}
                
        except Exception as e:
            return {'valid': False, 'error': f'Validation error: {str(e)}'}
    
    def scan_input_folder(self, folder_path: str) -> List[Dict[str, Any]]:
        """Scan folder for valid image files"""
        try:
            path = Path(folder_path)
            
            if not path.exists():
                console.print(f"[red]Folder not found: {folder_path}[/red]")
                return []
            
            if not path.is_dir():
                console.print(f"[red]Path is not a directory: {folder_path}[/red]")
                return []
            
            valid_images = []
            
            for file_path in path.iterdir():
                if file_path.is_file() and file_path.suffix.lower() in self.SUPPORTED_FORMATS:
                    validation = self.validate_image_file(str(file_path))
                    if validation['valid']:
                        valid_images.append(validation)
            
            self.input_images = valid_images
            return valid_images
            
        except Exception as e:
            console.print(f"[red]Error scanning folder: {e}[/red]")
            return []
    
    def display_images_summary(self, images: List[Dict[str, Any]], title: str = "Images"):
        """Display a summary table of images"""
        if not images:
            console.print(f"[yellow]No images found[/yellow]")
            return
        
        table = Table(title=title)
        table.add_column("Filename", style="cyan")
        table.add_column("Format", style="green")
        table.add_column("Dimensions", style="blue")
        table.add_column("Size", style="yellow")
        table.add_column("Status", style="magenta")
        
        for img in images:
            status = "✓ Valid" if img.get('valid', True) else "✗ Invalid"
            status_style = "green" if img.get('valid', True) else "red"
            
            table.add_row(
                img['name'] + img['extension'],
                img['format'],
                f"{img['width']}x{img['height']}",
                f"{img['size_mb']:.1f}MB",
                status,
                style=status_style
            )
        
        console.print(table)
        console.print(f"\n[bold]Total: {len(images)} images[/bold]")
    
    def create_reference_image_entry(self, image_path: str, display_name: str = None) -> Optional[Dict[str, str]]:
        """Create a reference image entry with validation"""
        validation = self.validate_image_file(image_path)
        
        if not validation['valid']:
            console.print(f"[red]Invalid reference image: {validation['error']}[/red]")
            return None
        
        return {
            'path': validation['path'],
            'name': display_name or validation['name'],
            'original_name': validation['name']
        }
    
    def setup_output_folder(self, input_folder: str) -> str:
        """Create and return path to output folder"""
        input_path = Path(input_folder)
        output_path = input_path / "processed"
        
        try:
            output_path.mkdir(exist_ok=True)
            console.print(f"[green]✓[/green] Output folder created: {output_path}")
            return str(output_path)
        except Exception as e:
            console.print(f"[red]Error creating output folder: {e}[/red]")
            return str(input_path)
    
    def generate_output_filename(self, 
                               original_name: str, 
                               extension: str, 
                               output_folder: str,
                               index: int = 0,
                               timestamp: bool = True,
                               custom_pattern: str = None) -> str:
        """Generate output filename with customizable patterns"""
        import datetime
        
        if custom_pattern:
            # Use custom pattern (implement pattern parsing)
            filename = custom_pattern.format(
                name=original_name,
                index=index,
                timestamp=datetime.datetime.now().strftime("%Y%m%d_%H%M%S"),
                date=datetime.datetime.now().strftime("%Y-%m-%d")
            )
        else:
            # Default pattern
            if timestamp:
                timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{original_name}_{timestamp_str}_{index}"
            else:
                filename = f"{original_name}_{index}"
        
        # Ensure proper extension
        if not filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):
            filename += extension
        
        return str(Path(output_folder) / filename)
    
    def backup_original_images(self, images: List[Dict[str, Any]], input_folder: str) -> bool:
        """Create backup of original images"""
        try:
            backup_folder = Path(input_folder) / "backup_originals"
            backup_folder.mkdir(exist_ok=True)
            
            import shutil
            for img in images:
                if img['valid']:
                    source = Path(img['path'])
                    dest = backup_folder / source.name
                    shutil.copy2(source, dest)
            
            console.print(f"[green]✓[/green] Original images backed up to: {backup_folder}")
            return True
            
        except Exception as e:
            console.print(f"[red]Error backing up images: {e}[/red]")
            return False
    
    def check_storage_space(self, output_folder: str, required_space_mb: float) -> bool:
        """Check if sufficient storage space is available"""
        try:
            import shutil
            free_space = shutil.disk_usage(output_folder).free
            free_space_mb = free_space / 1024 / 1024
            
            if free_space_mb < required_space_mb:
                console.print(f"[red]Insufficient storage space: {free_space_mb:.1f}MB available, {required_space_mb:.1f}MB required[/red]")
                return False
            
            console.print(f"[green]✓[/green] Sufficient storage space: {free_space_mb:.1f}MB available")
            return True
            
        except Exception as e:
            console.print(f"[red]Error checking storage space: {e}[/red]")
            return False
    
    def detect_duplicates(self, images: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect duplicate images based on content hash"""
        try:
            from PIL import Image
            import hashlib
            
            duplicates = []
            seen_hashes = {}
            
            for img in images:
                if not img['valid']:
                    continue
                
                # Calculate image hash
                with Image.open(img['path']) as pil_img:
                    img_hash = hashlib.md5(pil_img.tobytes()).hexdigest()
                
                if img_hash in seen_hashes:
                    duplicates.append({
                        'original': seen_hashes[img_hash],
                        'duplicate': img,
                        'hash': img_hash
                    })
                else:
                    seen_hashes[img_hash] = img
            
            if duplicates:
                console.print(f"[yellow]Found {len(duplicates)} duplicate images[/yellow]")
            
            return duplicates
            
        except Exception as e:
            console.print(f"[red]Error detecting duplicates: {e}[/red]")
            return []
    
    def cleanup_temp_files(self, temp_files: List[str]):
        """Clean up temporary files"""
        try:
            for temp_file in temp_files:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            console.print("[green]✓[/green] Temporary files cleaned up")
        except Exception as e:
            console.print(f"[red]Error cleaning up temp files: {e}[/red]")