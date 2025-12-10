import os
import re
import json
import time
import urllib.parse
from pathlib import Path
from typing import List, Dict, Optional, Any, Union
from rich.console import Console
from rich.panel import Panel

console = Console()

class Validators:
    """Input validation utilities"""
    
    @staticmethod
    def validate_api_key(api_key: str) -> bool:
        """Validate Google Gemini API key format"""
        if not api_key:
            return False
        
        # Remove any whitespace
        api_key = api_key.strip()
        
        # Basic format check (should be a reasonable length and contain valid characters)
        if len(api_key) < 20 or len(api_key) > 200:
            return False
        
        # Check for valid characters (alphanumeric, hyphens, underscores)
        if not re.match(r'^[a-zA-Z0-9_-]+$', api_key):
            return False
        
        return True
    
    @staticmethod
    def validate_image_path(path: str) -> Dict[str, Any]:
        """Validate image file path and return detailed information"""
        result = {
            'valid': False,
            'path': path,
            'error': None,
            'file_info': None
        }
        
        try:
            # Check if path exists
            if not os.path.exists(path):
                result['error'] = 'File does not exist'
                return result
            
            # Check if it's a file
            if not os.path.isfile(path):
                result['error'] = 'Path is not a file'
                return result
            
            # Get file info
            file_stat = os.stat(path)
            file_size = file_stat.st_size
            
            # Check file extension
            valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp']
            file_ext = Path(path).suffix.lower()
            
            if file_ext not in valid_extensions:
                result['error'] = f'Invalid file extension: {file_ext}. Supported: {valid_extensions}'
                return result
            
            # Check file size (max 50MB)
            max_size = 50 * 1024 * 1024  # 50MB
            if file_size > max_size:
                result['error'] = f'File too large: {file_size / 1024 / 1024:.1f}MB (max 50MB)'
                return result
            
            # Try to validate image integrity
            try:
                from PIL import Image
                with Image.open(path) as img:
                    width, height = img.size
                    
                    # Basic sanity checks
                    if width <= 0 or height <= 0:
                        result['error'] = 'Invalid image dimensions'
                        return result
                    
                    if width > 8192 or height > 8192:
                        result['error'] = 'Image resolution too high (max 8192x8192)'
                        return result
                    
                    result['file_info'] = {
                        'width': width,
                        'height': height,
                        'format': img.format,
                        'mode': img.mode,
                        'size_bytes': file_size,
                        'size_mb': round(file_size / 1024 / 1024, 2)
                    }
                    
            except Exception as e:
                result['error'] = f'Invalid image file: {str(e)}'
                return result
            
            result['valid'] = True
            return result
            
        except Exception as e:
            result['error'] = f'Validation error: {str(e)}'
            return result
    
    @staticmethod
    def validate_folder_path(path: str) -> Dict[str, Any]:
        """Validate folder path and return detailed information"""
        result = {
            'valid': False,
            'path': path,
            'error': None,
            'folder_info': None
        }
        
        try:
            # Check if path exists
            if not os.path.exists(path):
                result['error'] = 'Folder does not exist'
                return result
            
            # Check if it's a directory
            if not os.path.isdir(path):
                result['error'] = 'Path is not a directory'
                return result
            
            # Check read permissions
            if not os.access(path, os.R_OK):
                result['error'] = 'No read permission for folder'
                return result
            
            # Get folder info
            path_obj = Path(path)
            file_count = 0
            folder_count = 0
            total_size = 0
            
            for item in path_obj.rglob('*'):
                if item.is_file():
                    file_count += 1
                    try:
                        total_size += item.stat().st_size
                    except:
                        pass  # Skip files we can't stat
                elif item.is_dir():
                    folder_count += 1
            
            result['folder_info'] = {
                'file_count': file_count,
                'folder_count': folder_count,
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / 1024 / 1024, 2),
                'readable': True,
                'writable': os.access(path, os.W_OK)
            }
            
            result['valid'] = True
            return result
            
        except Exception as e:
            result['error'] = f'Validation error: {str(e)}'
            return result
    
    @staticmethod
    def validate_resolution(width: int, height: int, model_id: str = None) -> Dict[str, Any]:
        """Validate image resolution"""
        result = {
            'valid': False,
            'width': width,
            'height': height,
            'error': None
        }
        
        # Basic validation
        if width <= 0 or height <= 0:
            result['error'] = 'Width and height must be positive'
            return result
        
        if width > 8192 or height > 8192:
            result['error'] = 'Resolution too high (max 8192x8192)'
            return result
        
        # Model-specific validation
        max_resolution_map = {
            'gemini_3_pro': (4096, 4096),
            'gemini_2_5_flash': (2048, 2048)
        }
        
        if model_id and model_id in max_resolution_map:
            max_width, max_height = max_resolution_map[model_id]
            if width > max_width or height > max_height:
                result['error'] = f'Resolution exceeds model limit ({max_width}x{max_height})'
                return result
        
        result['valid'] = True
        return result
    
    @staticmethod
    def validate_aspect_ratio(ratio: str) -> Dict[str, Any]:
        """Validate aspect ratio format"""
        result = {
            'valid': False,
            'ratio': ratio,
            'error': None
        }
        
        # Standard ratios
        standard_ratios = ['1:1', '9:16', '16:9', '4:3', '3:2', '21:9']
        
        if ratio in standard_ratios:
            result['valid'] = True
            return result
        
        # Custom ratio format
        try:
            if ':' in ratio:
                parts = ratio.split(':')
                if len(parts) == 2:
                    width_ratio = float(parts[0])
                    height_ratio = float(parts[1])
                    
                    if width_ratio > 0 and height_ratio > 0:
                        result['valid'] = True
                        return result
        except ValueError:
            pass
        
        result['error'] = f'Invalid aspect ratio format. Use standard ratios like 16:9 or custom like 16:10'
        return result
    
    @staticmethod
    def validate_prompt(prompt: str) -> Dict[str, Any]:
        """Validate text prompt"""
        result = {
            'valid': False,
            'prompt': prompt,
            'error': None,
            'suggestions': []
        }
        
        if not prompt or not prompt.strip():
            result['error'] = 'Prompt cannot be empty'
            return result
        
        prompt = prompt.strip()
        
        # Check length
        if len(prompt) < 3:
            result['error'] = 'Prompt too short (minimum 3 characters)'
            return result
        
        if len(prompt) > 2000:
            result['error'] = 'Prompt too long (maximum 2000 characters)'
            return result
        
        # Check for potentially problematic content
        problematic_patterns = [
            r'\b(hate|violence|illegal|harmful)\b',
            r'<script\b',
            r'javascript:',
            r'data:'
        ]
        
        import re
        for pattern in problematic_patterns:
            if re.search(pattern, prompt, re.IGNORECASE):
                result['error'] = 'Prompt contains potentially problematic content'
                return result
        
        result['valid'] = True
        
        # Provide suggestions for improvement
        if len(prompt) < 10:
            result['suggestions'].append('Consider adding more details for better results')
        
        if not any(word in prompt.lower() for word in ['style', 'color', 'light', 'composition']):
            result['suggestions'].append('Consider specifying style, colors, or lighting preferences')
        
        return result
    
    @staticmethod
    def validate_reference_images(reference_list: List[Dict[str, str]]) -> Dict[str, Any]:
        """Validate reference images configuration"""
        result = {
            'valid': False,
            'reference_count': 0,
            'errors': [],
            'warnings': []
        }
        
        if not reference_list:
            result['valid'] = True
            return result
        
        result['reference_count'] = len(reference_list)
        
        # Check count limits
        if len(reference_list) > 14:
            result['errors'].append('Too many reference images (max 14)')
            return result
        
        # Validate each reference
        for i, ref in enumerate(reference_list):
            if not isinstance(ref, dict):
                result['errors'].append(f'Reference {i}: Invalid format')
                continue
            
            # Check required fields
            if 'path' not in ref:
                result['errors'].append(f'Reference {i}: Missing path field')
                continue
            
            if 'name' not in ref:
                result['errors'].append(f'Reference {i}: Missing name field')
                continue
            
            # Validate image path
            image_validation = Validators.validate_image_path(ref['path'])
            if not image_validation['valid']:
                result['errors'].append(f'Reference {i}: {image_validation["error"]}')
                continue
            
            # Validate name format
            name = ref['name'].strip()
            if not name:
                result['errors'].append(f'Reference {i}: Empty name')
                continue
            
            if name.startswith('@'):
                result['warnings'].append(f'Reference {i}: Name starts with @, will be used as {name}')
            elif not re.match(r'^[a-zA-Z0-9_-]+$', name):
                result['warnings'].append(f'Reference {i}: Name contains special characters')
        
        result['valid'] = len(result['errors']) == 0
        return result
    
    @staticmethod
    def validate_config_file(config_path: str) -> Dict[str, Any]:
        """Validate configuration file"""
        result = {
            'valid': False,
            'config': None,
            'errors': [],
            'warnings': []
        }
        
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
        except json.JSONDecodeError as e:
            result['errors'].append(f'Invalid JSON: {str(e)}')
            return result
        except Exception as e:
            result['errors'].append(f'Error reading config file: {str(e)}')
            return result
        
        # Validate required fields
        required_fields = ['model']
        for field in required_fields:
            if field not in config:
                result['errors'].append(f'Missing required field: {field}')
        
        # Validate model
        if 'model' in config:
            valid_models = ['gemini_3_pro', 'gemini_2_5_flash']
            if config['model'] not in valid_models:
                result['errors'].append(f'Invalid model: {config["model"]}')
        
        # Validate resolution
        if 'resolution' in config:
            if isinstance(config['resolution'], (list, tuple)) and len(config['resolution']) == 2:
                width, height = config['resolution']
                res_validation = Validators.validate_resolution(width, height, config.get('model'))
                if not res_validation['valid']:
                    result['errors'].append(f'Invalid resolution: {res_validation["error"]}')
            else:
                result['errors'].append('Resolution must be a tuple/list of (width, height)')
        
        # Validate aspect ratio
        if 'aspect_ratio' in config:
            ratio_validation = Validators.validate_aspect_ratio(config['aspect_ratio'])
            if not ratio_validation['valid']:
                result['errors'].append(f'Invalid aspect ratio: {ratio_validation["error"]}')
        
        # Validate prompt
        if 'prompt' in config:
            prompt_validation = Validators.validate_prompt(config['prompt'])
            if not prompt_validation['valid']:
                result['errors'].append(f'Invalid prompt: {prompt_validation["error"]}')
        
        # Validate reference images
        if 'reference_images' in config:
            ref_validation = Validators.validate_reference_images(config['reference_images'])
            if not ref_validation['valid']:
                result['errors'].extend([f'Reference images: {err}' for err in ref_validation['errors']])
        
        result['config'] = config
        result['valid'] = len(result['errors']) == 0
        return result
    
    @staticmethod
    def validate_network_connectivity() -> Dict[str, Any]:
        """Validate network connectivity to Google services"""
        result = {
            'connected': False,
            'latency': None,
            'error': None
        }
        
        try:
            import requests
            
            # Test connection to Google's AI API endpoint
            start_time = time.time()
            response = requests.get('https://generativelanguage.googleapis.com/v1/models', 
                                  timeout=10)
            end_time = time.time()
            
            if response.status_code == 200:
                result['connected'] = True
                result['latency'] = round((end_time - start_time) * 1000, 2)  # ms
            else:
                result['error'] = f'HTTP {response.status_code}'
                
        except requests.exceptions.Timeout:
            result['error'] = 'Connection timeout'
        except requests.exceptions.ConnectionError:
            result['error'] = 'Connection error'
        except Exception as e:
            result['error'] = f'Network error: {str(e)}'
        
        return result
    
    @staticmethod
    def validate_system_resources() -> Dict[str, Any]:
        """Validate system resources"""
        result = {
            'sufficient': False,
            'disk_space_gb': 0,
            'memory_available_gb': 0,
            'warnings': []
        }
        
        try:
            # Check disk space
            import shutil
            disk_usage = shutil.disk_usage('.')
            disk_space_gb = disk_usage.free / (1024**3)
            result['disk_space_gb'] = round(disk_space_gb, 2)
            
            if disk_space_gb < 1:  # Less than 1GB
                result['warnings'].append('Low disk space (< 1GB)')
            
            # Check memory
            try:
                import psutil
                memory = psutil.virtual_memory()
                memory_gb = memory.available / (1024**3)
                result['memory_available_gb'] = round(memory_gb, 2)
                
                if memory_gb < 2:  # Less than 2GB
                    result['warnings'].append('Low available memory (< 2GB)')
                    
            except ImportError:
                result['warnings'].append('psutil not available - memory check skipped')
            
            # Overall assessment
            result['sufficient'] = disk_space_gb >= 0.5  # At least 500MB
            
        except Exception as e:
            result['warnings'].append(f'Error checking system resources: {str(e)}')
            result['sufficient'] = True  # Assume sufficient if check fails
        
        return result