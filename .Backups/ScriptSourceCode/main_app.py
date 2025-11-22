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

class ScriptLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Script Launcher")
        self.root.geometry("800x600")
        
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
        
        list_frame = ttk.Frame(main_frame)
        list_frame.pack(fill=tk.BOTH, expand=True)
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
        
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, pady=(20, 0))
        self.style.configure("Accent.TButton", font=("Arial", 10))
        
        # First row: Script management buttons
        row1_frame = ttk.Frame(buttons_frame)
        row1_frame.pack(fill=tk.X, pady=(0, 5))
        
        ttk.Button(row1_frame, text="Add New Script", command=self.add_script).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(row1_frame, text="Remove Selected", command=self.remove_script).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(row1_frame, text="Run Selected", command=self.run_script).pack(side=tk.LEFT)
        
        # Second row: Tool buttons
        row2_frame = ttk.Frame(buttons_frame)
        row2_frame.pack(fill=tk.X)
        
        ttk.Button(row2_frame, text="Git Push Tool", command=self.launch_git_push_ui, style="Accent.TButton").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(row2_frame, text="APK Updater", command=self.launch_apk_updater_ui, style="Accent.TButton").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(row2_frame, text="Nano Banana", command=self.launch_nano_banana_ui, style="Accent.TButton").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(row2_frame, text="Background Remover", command=self.launch_bg_remover_ui, style="Accent.TButton").pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(row2_frame, text="Image Renamer", command=self.launch_image_renamer_ui, style="Accent.TButton").pack(side=tk.LEFT)

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

def main():
    root = tk.Tk()
    app = ScriptLauncher(root)
    root.mainloop()

if __name__ == "__main__":
    main()