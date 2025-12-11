import requests
import os
import json
import io
import zipfile
import secrets
import string
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote

# Filebin API endpoints
BASE_URL = "https://filebin.net"
API_BASE = BASE_URL

class FilebinManager:
    """Manager for interacting with filebin.net API, adapted for ScriptLauncher"""
    
    def __init__(self, config_manager):
        self.config_manager = config_manager
        self.config = self.load_config()
    
    def load_config(self) -> Dict:
        """Load configuration using AppConfigManager"""
        config = self.get_default_config()
        saved_config = self.config_manager.get_tool_config("filebin")
        
        # Merge saved config into default config
        if saved_config:
            for key, value in saved_config.items():
                if key == 'preferences' and isinstance(value, dict):
                    config['preferences'].update(value)
                else:
                    config[key] = value
        return config
    
    def save_config(self):
        """Save configuration using AppConfigManager"""
        return self.config_manager.set_tool_config("filebin", self.config)
    
    def get_default_config(self) -> Dict:
        """Get default configuration"""
        return {
            "saved_bins": {},
            "bin_mapping": {},  # Maps friendly names to actual bin names
            "preferences": {
                "auto_copy_links": True,
                "show_progress": True,
                "default_download_path": os.path.join(os.path.expanduser("~"), "Downloads"),
                "upload_path": "" # Added for the UI requirement
            }
        }
    
    def get_verified_cookie_value(self) -> str:
        """
        Fetch the current 'verified' cookie value required by the server.
        """
        default_value = "2024-05-24" 
        try:
            test_bin = "test" 
            response = requests.get(f"{API_BASE}/{test_bin}")
            
            import re
            match = re.search(r'verified=([0-9]{4}-[0-9]{2}-[0-9]{2})', response.text)
            if match:
                return match.group(1)
            
            return default_value
        except Exception:
            return default_value

    def generate_random_bin_name(self, length: int = 16) -> str:
        """Generate a random bin name"""
        characters = string.ascii_lowercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(length))
    
    def upload_file(self, file_path: str, bin_name: str) -> Tuple[bool, str]:
        """Upload a file to a specific bin"""
        try:
            file_path = os.path.expanduser(file_path)
            if not os.path.exists(file_path):
                return False, "File not found"
            
            filename = os.path.basename(file_path)
            url = f"{BASE_URL}/{bin_name}/{quote(filename)}"
            
            with open(file_path, 'rb') as f:
                response = requests.post(url, data=f)
                
                if response.status_code in [200, 201]:
                    return True, f"{BASE_URL}/{bin_name}"
                else:
                    return False, f"Upload failed: {response.status_code} - {response.text}"
        
        except Exception as e:
            return False, f"Upload failed: {str(e)}"
    
    def upload_files_to_bin(self, file_paths: List[str], bin_name: str) -> Tuple[bool, List[str]]:
        """Upload multiple files to a specific bin"""
        uploaded_files = []
        success_count = 0
        
        for file_path in file_paths:
            success, result = self.upload_file(file_path, bin_name)
            if success:
                uploaded_files.append(os.path.basename(file_path))
                success_count += 1
        
        return success_count > 0, uploaded_files
    
    def upload_zip_to_bin(self, zip_data: bytes, bin_name: str, filename: str) -> Tuple[bool, str]:
        """Upload a ZIP file to a specific bin"""
        try:
            url = f"{BASE_URL}/{bin_name}/{quote(filename)}"
            response = requests.post(url, data=zip_data)
            
            if response.status_code in [200, 201]:
                return True, f"{BASE_URL}/{bin_name}"
            else:
                return False, f"Upload failed: {response.status_code} - {response.text}"
        
        except Exception as e:
            return False, f"Upload failed: {str(e)}"
    
    def create_zip_archive(self, directory_path: str) -> Optional[bytes]:
        """Create a ZIP archive from a directory"""
        try:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(directory_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, directory_path)
                        zipf.write(file_path, arcname)
            return zip_buffer.getvalue()
        except Exception as e:
            return None
    
    def download_file(self, bin_name: str, filename: str, save_path: str) -> bool:
        """Download a file from a bin"""
        try:
            cookie_value = self.get_verified_cookie_value()
            cookies = {'verified': cookie_value}
            response = requests.get(f"{API_BASE}/{bin_name}/{quote(filename)}", cookies=cookies)
            
            if response.status_code == 200:
                with open(save_path, 'wb') as f:
                    f.write(response.content)
                return True
            return False
        except Exception:
            return False
    
    def get_bin_info(self, bin_name: str) -> Tuple[bool, Dict]:
        """Get information about a bin"""
        try:
            response = requests.get(f"{API_BASE}/{bin_name}")
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'application/json' in content_type:
                    return True, response.json()
                else:
                    return True, {"status": "accessible", "html_content": response.text[:200]}
            else:
                return False, {"error": f"Failed to get bin info: {response.status_code}"}
        except Exception as e:
            return False, {"error": f"Error getting bin info: {str(e)}"}
    
    def delete_file(self, bin_name: str, filename: str) -> bool:
        """Delete a file from a bin"""
        try:
            response = requests.delete(f"{API_BASE}/{bin_name}/{quote(filename)}")
            return response.status_code == 200
        except:
            return False
    
    def delete_bin(self, bin_name: str) -> bool:
        """Delete an entire bin"""
        try:
            response = requests.delete(f"{API_BASE}/{bin_name}")
            return response.status_code == 200
        except:
            return False
    
    def lock_bin(self, bin_name: str) -> bool:
        """Lock a bin (make it read-only)"""
        try:
            response = requests.put(f"{API_BASE}/{bin_name}")
            return response.status_code == 200
        except:
            return False
            
    def get_bin_archive(self, bin_name: str, archive_type: str = 'zip') -> Optional[requests.Response]:
        """Download bin as archive (returns streamable response)"""
        try:
            cookie_value = self.get_verified_cookie_value()
            params = {'verified': cookie_value}
            cookies = {'verified': cookie_value}
            
            response = requests.get(
                f"{API_BASE}/archive/{bin_name}/{archive_type}", 
                cookies=cookies,
                params=params,
                stream=True
            )
            
            if response.status_code == 200:
                return response
            return None
        except Exception:
            return None

    def get_direct_link(self, bin_name: str, filename: str = "") -> str:
        """Generate a direct link compatible with external download managers"""
        cookie_value = self.get_verified_cookie_value()
        base = f"{BASE_URL}/{bin_name}"
        if filename:
            base = f"{base}/{quote(filename)}"
        return f"{base}?verified={cookie_value}"
    
    def get_all_files_in_directory(self, directory: str) -> List[str]:
        """Recursively get all files in a directory"""
        file_paths = []
        for root, _, files in os.walk(directory):
            for file in files:
                file_paths.append(os.path.join(root, file))
        return file_paths
