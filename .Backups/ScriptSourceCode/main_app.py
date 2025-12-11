import sys
import subprocess
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json
import os
import random
from config.manager import AppConfigManager
from git.ui import GitPushUI
from nano_banana.ui import NanoBananaUI
from bg_remover.ui import BackgroundRemoverUI
from image_renamer.ui import ImageRenamerUI
from apk_updater.ui import APKUpdaterUI
from filebin.ui import FilebinUI

class ScriptLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Script Launcher")
        self.root.geometry("800x650")
        
        self.config_file = os.path.join(os.path.expanduser("~"), "launcher_config.json")
        self.scripts = self.load_scripts()
        self.app_config_manager = AppConfigManager()
        
        # List of emojis to randomly assign to scripts
        self.emoji_list = ["🚀", "⚡", "🔧", "📝", "🎯", "🔍", "💡", "🎨", "🔐", "📊"]
        
        # Ensure all scripts have emojis assigned
        self.ensure_script_emojis()
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.accent_color = "#4a90e2"
        self.root.configure(bg=self.bg_color)
        
        self.create_main_ui()
        
    def load_scripts(self):
        if os.path.exists(self.config_file):
            try: 
                return json.load(open(self.config_file, 'r'))
            except (json.JSONDecodeError, IOError): 
                return []
        return []
    
    def save_scripts(self): 
        json.dump(self.scripts, open(self.config_file, 'w'), indent=4)
    
    def ensure_script_emojis(self):
        """Assign random emojis to scripts that don't have one"""
        for script in self.scripts:
            if 'emoji' not in script:
                script['emoji'] = random.choice(self.emoji_list)
        self.save_scripts()
    
    def create_main_ui(self):
        for widget in self.root.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.root, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_label = ttk.Label(main_frame, text="Script Launcher", font=("Arial", 20, "bold"))
        title_label.pack(pady=(0, 20))
        
        # List of scripts
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        list_frame.configure(relief=tk.SUNKEN, borderwidth=1)
        
        scrollbar = ttk.Scrollbar(list_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Create a custom font that supports emojis
        self.list_font = ("Segoe UI Emoji", 11)
        
        self.script_listbox = tk.Listbox(
            list_frame, 
            yscrollcommand=scrollbar.set, 
            bg="#ffffff", 
            fg="#333333", 
            font=self.list_font, 
            selectbackground=self.accent_color, 
            selectforeground="#ffffff"
        )
        self.script_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.script_listbox.yview)
        
        self.refresh_script_list()
        
        # Bottom controls area
        controls_frame = ttk.Frame(main_frame)
        controls_frame.pack(fill=tk.X)
        self.style.configure("Accent.TButton", font=("Arial", 10, "bold"))
        self.style.configure("Regular.TButton", font=("Arial", 10))
        
        # Group 1: Script Management (Add, Remove, Run)
        mgmt_group = ttk.LabelFrame(controls_frame, text="Script Management", padding="10")
        mgmt_group.pack(fill=tk.X, pady=(0, 15))
        
        ttk.Button(mgmt_group, text="▶ Run Selected", command=self.run_script, style="Accent.TButton").pack(side=tk.LEFT, padx=(0, 10), fill=tk.X, expand=True)
        ttk.Button(mgmt_group, text="+ Add New", command=self.add_script, style="Regular.TButton").pack(side=tk.LEFT, padx=(0, 10), fill=tk.X, expand=True)
        ttk.Button(mgmt_group, text="- Remove", command=self.remove_script, style="Regular.TButton").pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        # Group 2: Built-in Tools
        tools_group = ttk.LabelFrame(controls_frame, text="Project Tools", padding="10")
        tools_group.pack(fill=tk.X)
        
        # Grid layout for tools
        tools_group.columnconfigure(0, weight=1)
        tools_group.columnconfigure(1, weight=1)
        tools_group.columnconfigure(2, weight=1)
        
        # Row 1
        ttk.Button(tools_group, text="Git Push Tool", command=self.launch_git_push_ui).grid(row=0, column=0, padx=5, pady=5, sticky="ew")
        ttk.Button(tools_group, text="APK Updater", command=self.launch_apk_updater_ui).grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        ttk.Button(tools_group, text="Nano Banana", command=self.launch_nano_banana_ui).grid(row=0, column=2, padx=5, pady=5, sticky="ew")
        
        # Row 2
        ttk.Button(tools_group, text="Background Remover", command=self.launch_bg_remover_ui).grid(row=1, column=0, padx=5, pady=5, sticky="ew")
        ttk.Button(tools_group, text="Image Renamer", command=self.launch_image_renamer_ui).grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        ttk.Button(tools_group, text="Temp Sharing Service", command=self.launch_filebin_ui, style="Accent.TButton").grid(row=1, column=2, padx=5, pady=5, sticky="ew")

    def refresh_script_list(self):
        self.script_listbox.delete(0, tk.END)
        for script in self.scripts:
            # Display emoji + script name
            display_text = f"{script.get('emoji', '')} {script['name']}"
            self.script_listbox.insert(tk.END, display_text)
    
    def add_script(self):
        file_path = filedialog.askopenfilename(title="Select Script", filetypes=[("Python Scripts", "*.py"), ("All Files", "*.*")])
        if file_path:
            absolute_path = os.path.abspath(file_path)
            script_name = os.path.basename(absolute_path)
            name_without_ext = os.path.splitext(script_name)[0]
            
            # Create new script entry with random emoji
            new_script = {
                'name': name_without_ext, 
                'path': absolute_path,
                'emoji': random.choice(self.emoji_list)
            }
            
            self.scripts.append(new_script)
            self.save_scripts()
            self.refresh_script_list()
    
    def remove_script(self):
        selection = self.script_listbox.curselection()
        if selection:
            index = selection[0]
            del self.scripts[index]
            self.save_scripts()
            self.refresh_script_list()
    
    def run_script(self):
        selection = self.script_listbox.curselection()
        if not selection: 
            messagebox.showwarning("No Selection", "Please select a script to run.")
            return
        
        index = selection[0]
        script_path = self.scripts[index]['path']
        
        try:
            if sys.platform == "win32": 
                subprocess.Popen(['cmd', '/k', 'python', script_path])
            elif sys.platform == "darwin": 
                subprocess.Popen(['osascript', '-e', f'tell application "Terminal" to do script "python {script_path}"'])
            else: 
                subprocess.Popen(['x-terminal-emulator', '-e', f'python {script_path}'])
        except Exception as e: 
            messagebox.showerror("Error", f"Failed to run script: {str(e)}")
    
    def launch_git_push_ui(self):
        self.git_push_ui = GitPushUI(self.root, self.create_main_ui, self.app_config_manager)
    
    def launch_nano_banana_ui(self):
        self.nano_banana_ui = NanoBananaUI(self.root, self.create_main_ui, self.app_config_manager)
    
    def launch_bg_remover_ui(self):
        self.bg_remover_ui = BackgroundRemoverUI(self.root, self.create_main_ui, self.app_config_manager)

    def launch_image_renamer_ui(self):
        self.image_renamer_ui = ImageRenamerUI(self.root, self.create_main_ui, self.app_config_manager)

    def launch_apk_updater_ui(self):
        self.apk_updater_ui = APKUpdaterUI(self.root, self.create_main_ui, self.app_config_manager)
        
    def launch_filebin_ui(self):
        self.filebin_ui = FilebinUI(self.root, self.create_main_ui, self.app_config_manager)

def main():
    root = tk.Tk()
    app = ScriptLauncher(root)
    root.mainloop()

if __name__ == "__main__":
    main()