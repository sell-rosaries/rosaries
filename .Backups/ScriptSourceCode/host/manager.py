import os
import socket
import threading
import http.server
import socketserver
from typing import Optional, Callable

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with no-cache headers and silent logging."""
    
    def __init__(self, *args, directory=None, **kwargs):
        self.serve_directory = directory
        super().__init__(*args, directory=directory, **kwargs)
    
    def log_message(self, format, *args):
        """Suppress all log messages."""
        pass
    
    def end_headers(self):
        """Add no-cache headers to prevent browser caching."""
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


class HostServerManager:
    """Manages a local HTTP server for serving web content."""
    
    def __init__(self):
        self.server: Optional[socketserver.TCPServer] = None
        self.server_thread: Optional[threading.Thread] = None
        self.current_port: int = 7777
        self.current_directory: str = ""
        self.is_running: bool = False
        self._lock = threading.Lock()
    
    def get_local_ip(self) -> str:
        """Get the local IP address for LAN access."""
        try:
            # Create a socket to determine the local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"
    
    def get_url(self) -> str:
        """Get the server URL."""
        ip = self.get_local_ip()
        return f"http://{ip}:{self.current_port}"
    
    def start_server(self, directory: str, port: int, log_callback: Optional[Callable] = None) -> tuple[bool, str]:
        """
        Start the HTTP server.
        
        Returns:
            (success: bool, message: str)
        """
        with self._lock:
            if self.is_running:
                return False, "Server is already running. Stop it first."
            
            if not os.path.isdir(directory):
                return False, f"Directory does not exist: {directory}"
            
            try:
                # Create handler class with the directory
                handler = lambda *args, **kwargs: NoCacheHandler(*args, directory=directory, **kwargs)
                
                # Enable address reuse to avoid TIME_WAIT issues
                socketserver.TCPServer.allow_reuse_address = True
                
                self.server = socketserver.TCPServer(("", port), handler)
                self.current_port = port
                self.current_directory = directory
                
                # Run server in a background thread
                self.server_thread = threading.Thread(target=self._serve_forever, daemon=True)
                self.server_thread.start()
                
                self.is_running = True
                url = self.get_url()
                
                if log_callback:
                    log_callback(f"Server started on {url}")
                
                return True, url
                
            except OSError as e:
                if "Address already in use" in str(e) or "10048" in str(e):
                    return False, f"Port {port} is already in use. Try a different port."
                return False, f"Failed to start server: {e}"
            except Exception as e:
                return False, f"Failed to start server: {e}"
    
    def _serve_forever(self):
        """Run the server (called in background thread)."""
        try:
            self.server.serve_forever()
        except Exception:
            pass
    
    def stop_server(self, log_callback: Optional[Callable] = None) -> tuple[bool, str]:
        """
        Stop the running server.
        
        Returns:
            (success: bool, message: str)
        """
        with self._lock:
            if not self.is_running or self.server is None:
                self.is_running = False
                return True, "Server was not running."
            
            try:
                # Shutdown the server
                self.server.shutdown()
                self.server.server_close()
                
                # Wait for the thread to finish
                if self.server_thread and self.server_thread.is_alive():
                    self.server_thread.join(timeout=2.0)
                
                self.server = None
                self.server_thread = None
                self.is_running = False
                
                if log_callback:
                    log_callback("Server stopped.")
                
                return True, "Server stopped successfully."
                
            except Exception as e:
                self.is_running = False
                return False, f"Error stopping server: {e}"
    
    def restart_server(self, new_port: Optional[int] = None, log_callback: Optional[Callable] = None) -> tuple[bool, str]:
        """
        Restart the server, optionally with a new port.
        
        Returns:
            (success: bool, message: str)
        """
        directory = self.current_directory
        port = new_port if new_port is not None else self.current_port
        
        if not directory:
            return False, "No directory set. Please select a project directory first."
        
        # Stop any running server
        self.stop_server(log_callback)
        
        # Start with (possibly new) port
        return self.start_server(directory, port, log_callback)
    
    def kill_all_servers(self, log_callback: Optional[Callable] = None):
        """
        Ensure all server resources are cleaned up.
        Called on application exit or when navigating away.
        """
        self.stop_server(log_callback)
