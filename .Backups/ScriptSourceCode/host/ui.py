import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import random
from .manager import HostServerManager


class HostServerUI:
    """Simple UI for local HTTP server with no-cache headers."""
    
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.original_switch_callback = switch_to_main_callback
        self.parent.title("Local Host Server")
        self.parent.geometry("500x400")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.manager = HostServerManager()
        self.is_processing = False  # For compatibility with main app's busy check
        
        # Port variable
        self.port_var = tk.IntVar(value=7777)
        self.directory_var = tk.StringVar(value="")
        self.status_var = tk.StringVar(value="● Stopped")
        self.url_var = tk.StringVar(value="")
        
        self.create_widgets()
    
    def on_back(self):
        """Handle back button - kill server if running."""
        if self.manager.is_running:
            if not messagebox.askyesno("Server Running", 
                "The server is still running. Stop it and go back?"):
                return
            self.manager.kill_all_servers()
        self.original_switch_callback()
    
    def create_widgets(self):
        """Create all UI widgets."""
        for widget in self.parent.winfo_children():
            widget.destroy()
        
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header with back button
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.on_back)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Local Host Server", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        # Project Directory Section
        dir_frame = ttk.LabelFrame(main_frame, text="Project Directory", padding="10")
        dir_frame.pack(fill=tk.X, pady=(0, 10))
        
        dir_entry = ttk.Entry(dir_frame, textvariable=self.directory_var, width=45)
        dir_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))
        
        browse_btn = ttk.Button(dir_frame, text="Browse", command=self.browse_directory)
        browse_btn.pack(side=tk.RIGHT)
        
        # Port Section
        port_frame = ttk.LabelFrame(main_frame, text="Port", padding="10")
        port_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Center the port controls
        port_controls = ttk.Frame(port_frame)
        port_controls.pack(expand=True)
        
        minus_btn = ttk.Button(port_controls, text=" − ", width=4, command=self.decrease_port)
        minus_btn.pack(side=tk.LEFT, padx=5)
        
        port_entry = ttk.Entry(port_controls, textvariable=self.port_var, width=8, 
                               font=("Arial", 14, "bold"), justify="center")
        port_entry.pack(side=tk.LEFT, padx=5)
        
        plus_btn = ttk.Button(port_controls, text=" + ", width=4, command=self.increase_port)
        plus_btn.pack(side=tk.LEFT, padx=5)
        
        random_btn = ttk.Button(port_controls, text="🎲 Random", command=self.random_port)
        random_btn.pack(side=tk.LEFT, padx=(20, 5))
        
        # Controls Section
        controls_frame = ttk.LabelFrame(main_frame, text="Controls", padding="10")
        controls_frame.pack(fill=tk.X, pady=(0, 10))
        
        btn_container = ttk.Frame(controls_frame)
        btn_container.pack(expand=True)
        
        self.start_btn = ttk.Button(btn_container, text="▶ Start Server", 
                                    command=self.start_server, style="Accent.TButton")
        self.start_btn.pack(side=tk.LEFT, padx=10)
        
        self.stop_btn = ttk.Button(btn_container, text="■ Stop", 
                                   command=self.stop_server, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=10)
        
        self.restart_btn = ttk.Button(btn_container, text="↻ Restart", 
                                      command=self.restart_server, state=tk.DISABLED)
        self.restart_btn.pack(side=tk.LEFT, padx=10)
        
        # Server Status Section
        status_frame = ttk.LabelFrame(main_frame, text="Server Status", padding="10")
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Status row
        status_row = ttk.Frame(status_frame)
        status_row.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Label(status_row, text="Status:").pack(side=tk.LEFT)
        self.status_label = ttk.Label(status_row, textvariable=self.status_var, 
                                      font=("Arial", 10, "bold"))
        self.status_label.pack(side=tk.LEFT, padx=(5, 0))
        
        # URL row
        url_row = ttk.Frame(status_frame)
        url_row.pack(fill=tk.X)
        
        ttk.Label(url_row, text="URL:").pack(side=tk.LEFT)
        self.url_label = ttk.Label(url_row, textvariable=self.url_var, 
                                   font=("Consolas", 10), foreground="#0066cc")
        self.url_label.pack(side=tk.LEFT, padx=(5, 10))
        
        self.copy_btn = ttk.Button(url_row, text="📋 Copy", command=self.copy_url, 
                                   state=tk.DISABLED, width=8)
        self.copy_btn.pack(side=tk.LEFT)
        
        # Configure styles
        self.style.configure("Accent.TButton", font=("Arial", 10, "bold"))
    
    def browse_directory(self):
        """Open directory browser."""
        path = filedialog.askdirectory(title="Select Project Directory")
        if path:
            self.directory_var.set(path)
    
    def decrease_port(self):
        """Decrease port by 1 (min 1000)."""
        current = self.port_var.get()
        if current > 1000:
            self.port_var.set(current - 1)
    
    def increase_port(self):
        """Increase port by 1 (max 9999)."""
        current = self.port_var.get()
        if current < 9999:
            self.port_var.set(current + 1)
    
    def random_port(self):
        """Set a random port between 1000 and 9999."""
        self.port_var.set(random.randint(1000, 9999))
    
    def copy_url(self):
        """Copy URL to clipboard."""
        url = self.url_var.get()
        if url:
            self.parent.clipboard_clear()
            self.parent.clipboard_append(url)
            self.parent.update()
            # Brief visual feedback
            original_text = self.copy_btn.cget("text")
            self.copy_btn.config(text="✓ Copied")
            self.parent.after(1000, lambda: self.copy_btn.config(text=original_text))
    
    def update_ui_state(self, running: bool):
        """Update button states based on server status."""
        if running:
            self.start_btn.config(state=tk.DISABLED)
            self.stop_btn.config(state=tk.NORMAL)
            self.restart_btn.config(state=tk.NORMAL)
            self.copy_btn.config(state=tk.NORMAL)
            self.status_var.set("● Running")
            self.is_processing = True
        else:
            self.start_btn.config(state=tk.NORMAL)
            self.stop_btn.config(state=tk.DISABLED)
            self.restart_btn.config(state=tk.DISABLED)
            self.copy_btn.config(state=tk.DISABLED)
            self.status_var.set("● Stopped")
            self.url_var.set("")
            self.is_processing = False
    
    def start_server(self):
        """Start the HTTP server."""
        directory = self.directory_var.get()
        if not directory:
            messagebox.showwarning("Missing Directory", 
                "Please select a project directory first.")
            return
        
        port = self.port_var.get()
        
        # Validate port
        try:
            port = int(port)
            if not (1000 <= port <= 9999):
                raise ValueError()
        except (ValueError, TypeError):
            messagebox.showerror("Invalid Port", 
                "Port must be a number between 1000 and 9999.")
            return
        
        success, result = self.manager.start_server(directory, port)
        
        if success:
            self.url_var.set(result)
            self.update_ui_state(True)
            # Auto-copy URL to clipboard
            self.copy_url()
        else:
            messagebox.showerror("Server Error", result)
    
    def stop_server(self):
        """Stop the HTTP server."""
        self.manager.stop_server()
        self.update_ui_state(False)
    
    def restart_server(self):
        """Restart the server with current port."""
        port = self.port_var.get()
        
        # Validate port
        try:
            port = int(port)
            if not (1000 <= port <= 9999):
                raise ValueError()
        except (ValueError, TypeError):
            messagebox.showerror("Invalid Port", 
                "Port must be a number between 1000 and 9999.")
            return
        
        success, result = self.manager.restart_server(new_port=port)
        
        if success:
            self.url_var.set(result)
            self.update_ui_state(True)
            # Auto-copy URL to clipboard
            self.copy_url()
        else:
            messagebox.showerror("Server Error", result)
