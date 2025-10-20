#!/usr/bin/env python3
#python -m PyInstaller --onefile --windowed --name="ScriptLauncher" launcher.py
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import json
import os
import subprocess
import sys
import threading
import shutil
import shlex
from PIL import Image
from io import BytesIO
import google.generativeai as genai
import rembg
import io # FIX: Added the missing import
import google.generativeai.types as types

# --- Centralized Configuration Manager ---

class AppConfigManager:
    """Manages configuration for all tools in a single JSON file."""
    def __init__(self):
        self.config_dir = os.path.expanduser("~")
        self.config_file = os.path.join(self.config_dir, "script_launcher_config.json")
        self.config = self.load_all()

    def load_all(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}

    def save_all(self):
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=4)
            return True
        except IOError:
            return False

    def get_tool_config(self, tool_name):
        return self.config.get(tool_name, {})

    def set_tool_config(self, tool_name, config_data):
        self.config[tool_name] = config_data
        return self.save_all()

# --- Git Push Logic ---

class GitPushManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        self.config = self.config_manager.get_tool_config('git_push')
        self.process = None
        self.stop_push_flag = threading.Event()

    def save_config(self, config_data):
        if self.config_manager.set_tool_config('git_push', config_data):
            self.config = config_data
            return True
        return False

    def stop_process(self):
        self.stop_push_flag.set()

    def _run_git_command(self, cmd, repo_path, log_callback):
        if self.stop_push_flag.is_set():
            log_callback("!!! STOP REQUESTED: Aborting further Git operations. !!!")
            return None, "Process stopped by user.", 1

        try:
            git_executable = shutil.which('git')
            if not git_executable:
                common_paths = [r"C:\Program Files\Git\bin\git.exe", r"C:\Program Files (x86)\Git\bin\git.exe"]
                for path in common_paths:
                    if os.path.exists(path):
                        git_executable = path
                        break
            
            if not git_executable:
                log_callback("CRITICAL ERROR: Git is not installed or not found.")
                return None, "Git not found.", 1

            full_cmd = [git_executable] + shlex.split(cmd)
            log_callback(f"-> Running: {' '.join(full_cmd)}")

            startupinfo = None
            if sys.platform == "win32":
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                startupinfo.wShowWindow = subprocess.SW_HIDE
            
            process = subprocess.run(
                full_cmd, cwd=repo_path, capture_output=True, text=True, check=False,
                encoding='utf-8', errors='replace', startupinfo=startupinfo
            )
            
            if process.stdout: log_callback(f"   Output: {process.stdout.strip()}")
            if process.stderr: log_callback(f"   Error: {process.stderr.strip()}")
                
            return process.stdout, process.stderr, process.returncode
        except FileNotFoundError:
            log_callback(f"CRITICAL ERROR: Command not found: '{git_executable}'.")
            return None, "Command not found.", 1
        except Exception as e:
            log_callback(f"An unexpected error occurred: {str(e)}")
            return None, str(e), 1

    def push_to_github(self, repo_path, repo_url, pat, username, email, commit_msg, log_callback):
        log_callback("=== Starting Git Push Process ===")
        self.stop_push_flag.clear() # Clear flag at the start
        
        if not os.path.exists(repo_path) or not os.path.isdir(os.path.join(repo_path, '.git')):
            log_callback("ERROR: The specified path is not a valid Git repository.")
            return

        stdout, stderr, code = self._run_git_command(f'config user.email "{email}"', repo_path, log_callback)
        if code != 0: return
        stdout, stderr, code = self._run_git_command(f'config user.name "{username}"', repo_path, log_callback)
        if code != 0: return
        log_callback("   Git user configured.")

        push_url = repo_url.replace("https://", f"https://{username}:{pat}@")
        stdout, stderr, code = self._run_git_command(f'remote set-url origin {push_url}', repo_path, log_callback)
        if code != 0: return
        log_callback("   Remote URL updated for this session.")

        stdout, stderr, code = self._run_git_command('add --all', repo_path, log_callback)
        if code != 0: return
        log_callback("   Changes staged.")

        stdout, stderr, code = self._run_git_command(f'commit -m "{commit_msg}"', repo_path, log_callback)
        if code != 0:
            if "nothing to commit" in stderr:
                log_callback("   Nothing new to commit. Repository is up to date.")
            else:
                log_callback("   Commit failed. Check log for errors.")
                return
        else:
            log_callback("   Changes committed.")

        stdout, stderr, code = self._run_git_command('branch --show-current', repo_path, log_callback)
        if code != 0 or not stdout:
            log_callback("   Could not determine current branch. Defaulting to 'main'.")
            branch = 'main'
        else:
            branch = stdout.strip()

        stdout, stderr, code = self._run_git_command(f'pull origin {branch} --rebase', repo_path, log_callback)
        if code != 0:
            log_callback("   WARNING: Pull failed or had conflicts. Check log.")
        else:
            log_callback("   Pull successful.")

        stdout, stderr, code = self._run_git_command(f'push -u origin {branch} --force', repo_path, log_callback)
        
        if self.stop_push_flag.is_set():
            log_callback("\n" + "!" * 60)
            log_callback("✗ PROCESS STOPPED BY USER.")
            log_callback("!" * 60)
            self.parent.after(0, lambda: messagebox.showwarning("Stopped", "The Git push process was stopped."))
        elif code == 0:
            log_callback("\n" + "=" * 60)
            log_callback("✓ SUCCESS! GitHub now matches your local folder.")
            log_callback("=" * 60)
            self.parent.after(0, lambda: messagebox.showinfo("Success", "Push completed successfully!"))
        else:
            log_callback("\n" + "!" * 60)
            log_callback("✗ PUSH FAILED. Check the error message above.")
            log_callback("!" * 60)
            self.parent.after(0, lambda: messagebox.showerror("Failed", "Push failed. Check the log for details."))
        
        self._run_git_command(f'remote set-url origin {repo_url}', repo_path, log_callback)
        log_callback("=== Process Finished ===")

    def clone_repository(self, repo_url, save_path, log_callback):
        log_callback("=== Starting Git Clone Process ===")
        
        if not repo_url or not save_path:
            log_callback("ERROR: Repository URL and save path are required.")
            self.parent.after(0, lambda: messagebox.showerror("Error", "Repository URL and save path are required."))
            return

        try:
            repo_name = repo_url.split('/')[-1]
            if repo_name.endswith('.git'):
                repo_name = repo_name[:-4]
            
            clone_dir = os.path.join(save_path, repo_name)
            
            if os.path.exists(clone_dir):
                log_callback(f"ERROR: Directory already exists: {clone_dir}")
                self.parent.after(0, lambda: messagebox.showerror("Error", f"The destination directory '{repo_name}' already exists in the selected path."))
                return

            log_callback(f"Cloning '{repo_url}' into '{clone_dir}'...")
            
            # Use save_path as the working directory for the clone command.
            # git clone will create the repo_name directory inside save_path.
            stdout, stderr, code = self._run_git_command(f'clone "{repo_url}" "{repo_name}"', save_path, log_callback)
            
            if code == 0:
                log_callback("\n" + "=" * 60)
                log_callback("✓ SUCCESS! Repository cloned successfully.")
                log_callback("=" * 60)
                self.parent.after(0, lambda: messagebox.showinfo("Success", "Repository cloned successfully!"))
            else:
                log_callback("\n" + "!" * 60)
                log_callback("✗ CLONE FAILED. Check the error message above.")
                log_callback("!" * 60)
                self.parent.after(0, lambda: messagebox.showerror("Failed", "Clone failed. Check the log for details."))
        
        except Exception as e:
            log_callback(f"An unexpected error occurred during cloning: {str(e)}")
            self.parent.after(0, lambda: messagebox.showerror("Error", f"An unexpected error occurred: {str(e)}"))
        
        log_callback("=== Clone Process Finished ===")

# --- Nano Banana Logic ---

class NanoBananaManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        self.config = self.config_manager.get_tool_config('nano_banana')
        self.process = None
        self.stop_processing_flag = threading.Event()

    def save_config(self, config_data):
        if self.config_manager.set_tool_config('nano_banana', config_data):
            self.config = config_data
            return True
        return False

    def stop_process(self):
        self.stop_processing_flag.set()

    def process_images(self, api_key, prompt, folder_path, log_callback):
        log_callback("=== Starting Nano Banana Process ===")
        self.stop_processing_flag.clear() # Clear flag at the start
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash-image')
            log_callback("   AI Model configured successfully.")
        except Exception as e:
            log_callback(f"   CRITICAL ERROR: Failed to configure AI model: {str(e)}")
            self.parent.after(0, lambda: messagebox.showerror("AI Error", f"Failed to configure AI model. Check API key.\n{str(e)}"))
            return

        if not os.path.isdir(folder_path):
            log_callback(f"   ERROR: Folder not found at '{folder_path}'")
            self.parent.after(0, lambda: messagebox.showerror("Error", f"The specified folder does not exist:\n{folder_path}"))
            return

        image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')
        files_to_process = [f for f in os.listdir(folder_path) if f.lower().endswith(image_extensions) and "_semiprocessed" not in f.lower()]
        
        if not files_to_process:
            log_callback("   No supported image files found in the folder.")
            self.parent.after(0, lambda: messagebox.showinfo("Info", "No supported image files found in the selected folder."))
            return

        log_callback(f"   Found {len(files_to_process)} images to process.")

        for i, filename in enumerate(files_to_process):
            if self.stop_processing_flag.is_set():
                log_callback("\n!!! STOP REQUESTED: Halting image processing. !!!")
                break
            
            try:
                log_callback(f"\n-> Processing {filename} ({i+1}/{len(files_to_process)})...")
                image_path = os.path.join(folder_path, filename)
                image = Image.open(image_path)

                response = model.generate_content([prompt, image])
                
                processed_image = None
                for part in response.parts:
                    if part.inline_data:
                        processed_image = Image.open(BytesIO(part.inline_data.data))
                        break
                
                if processed_image:
                    base_name, ext = os.path.splitext(filename)
                    new_filename = f"{base_name}_semiprocessed{ext}"
                    new_path = os.path.join(folder_path, new_filename)
                    processed_image.save(new_path)
                    log_callback(f"   ✓ Saved: {new_filename}")
                else:
                    log_callback(f"   ✗ Failed: No image generated for {filename}")

            except Exception as e:
                log_callback(f"   ✗ Error processing {filename}: {str(e)}")
        
        if self.stop_processing_flag.is_set():
            log_callback("\n" + "!" * 60)
            log_callback("✗ PROCESS STOPPED BY USER.")
            log_callback("!" * 60)
            self.parent.after(0, lambda: messagebox.showwarning("Stopped", "The Nano Banana process was stopped."))
        else:
            log_callback("\n" + "=" * 60)
            log_callback("✓ Processing complete!")
            log_callback("=" * 60)
            self.parent.after(0, lambda: messagebox.showinfo("Success", "Image processing complete!"))

# --- Background Remover Logic ---

class BackgroundRemoverManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        self.config = self.config_manager.get_tool_config('bg_remover')
        self.process = None
        self.stop_processing_flag = threading.Event()

    def save_config(self, config_data):
        if self.config_manager.set_tool_config('bg_remover', config_data):
            self.config = config_data
            return True
        return False

    def stop_process(self):
        self.stop_processing_flag.set()

    def process_images(self, folder_path, log_callback):
        log_callback("=== Starting Background Remover Process ===")
        self.stop_processing_flag.clear() # Clear flag at the start
        if not os.path.isdir(folder_path):
            log_callback(f"   ERROR: Folder not found at '{folder_path}'")
            self.parent.after(0, lambda: messagebox.showerror("Error", f"The specified folder does not exist:\n{folder_path}"))
            return

        output_folder = os.path.join(folder_path, "processed")
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            log_callback(f"   Created output folder: {output_folder}")

        files_to_process = [
            f for f in os.listdir(folder_path) 
            if "_semiprocessed" in f and os.path.isfile(os.path.join(folder_path, f))
        ]

        if not files_to_process:
            log_callback("   No files with '_semiprocessed' in the name found.")
            self.parent.after(0, lambda: messagebox.showinfo("Info", "No files with '_semiprocessed' in the name found."))
            return

        log_callback(f"   Found {len(files_to_process)} files to process.")

        for i, filename in enumerate(files_to_process):
            if self.stop_processing_flag.is_set():
                log_callback("\n!!! STOP REQUESTED: Halting background removal. !!!")
                break

            try:
                log_callback(f"\n-> Processing {filename} ({i+1}/{len(files_to_process)})...")
                input_path = os.path.join(folder_path, filename)
                
                with open(input_path, "rb") as i:
                    input_data = i.read()
                output_data = rembg.remove(input_data)
                
                image = Image.open(io.BytesIO(output_data))
                
                bbox = image.getbbox()
                if bbox:
                    trimmed_image = image.crop(bbox)
                else:
                    trimmed_image = image

                base_name, _ = os.path.splitext(filename)
                original_name_base = base_name.replace("_semiprocessed", "")
                final_filename = f"{original_name_base}.png"
                output_path = os.path.join(output_folder, final_filename)
                
                trimmed_image.save(output_path, "PNG")
                log_callback(f"   ✓ Saved: {final_filename} to 'processed' folder.")

            except Exception as e:
                log_callback(f"   ✗ Error processing {filename}: {str(e)}")
        
        if self.stop_processing_flag.is_set():
            log_callback("\n" + "!" * 60)
            log_callback("✗ PROCESS STOPPED BY USER.")
            log_callback("!" * 60)
            self.parent.after(0, lambda: messagebox.showwarning("Stopped", "The Background Remover process was stopped."))
        else:
            log_callback("\n" + "=" * 60)
            log_callback("✓ Processing complete!")
            log_callback("=" * 60)
            self.parent.after(0, lambda: messagebox.showinfo("Success", "Background removal complete!"))

# --- Image Renamer Logic ---

class ImageRenamerManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        self.config = self.config_manager.get_tool_config('image_renamer')
        self.stop_processing_flag = threading.Event()

    def save_config(self, config_data):
        if self.config_manager.set_tool_config('image_renamer', config_data):
            self.config = config_data
            return True
        return False

    def stop_process(self):
        self.stop_processing_flag.set()

    def sanitize_filename(self, text):
        # Remove invalid characters for filenames
        sanitized = "".join(c for c in text if c.isalnum() or c in (' ', '_')).rstrip()
        # Replace spaces with underscores
        return sanitized.replace(' ', '_')

    def process_and_rename_images(self, api_key, folder_path, prompt, excluded_words, log_callback):
        log_callback("=== Starting Image Renamer Process ===")
        self.stop_processing_flag.clear()

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            log_callback("   AI Model configured successfully.")
        except Exception as e:
            log_callback(f"   CRITICAL ERROR: Failed to configure AI model: {str(e)}")
            self.parent.after(0, lambda: messagebox.showerror("AI Error", f"Failed to configure AI model. Check API key.\n{str(e)}"))
            return

        if not os.path.isdir(folder_path):
            log_callback(f"   ERROR: Folder not found at '{folder_path}'")
            self.parent.after(0, lambda: messagebox.showerror("Error", f"The specified folder does not exist:\n{folder_path}"))
            return

        image_extensions = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')
        files_to_process = [f for f in os.listdir(folder_path) if f.lower().endswith(image_extensions)]

        if not files_to_process:
            log_callback("   No supported image files found in the folder.")
            self.parent.after(0, lambda: messagebox.showinfo("Info", "No supported image files found in the selected folder."))
            return

        log_callback(f"   Found {len(files_to_process)} images to process.")

        for i, filename in enumerate(files_to_process):
            if self.stop_processing_flag.is_set():
                log_callback("\n!!! STOP REQUESTED: Halting image processing. !!!")
                break

            try:
                log_callback(f"\n-> Processing {filename} ({i+1}/{len(files_to_process)})...")
                image_path = os.path.join(folder_path, filename)
                image = Image.open(image_path)

                full_prompt = prompt
                if excluded_words:
                    full_prompt += "\nDo not use these words: " + ", ".join(excluded_words)

                response = model.generate_content([full_prompt, image])

                if response.text:
                    sanitized_caption = self.sanitize_filename(response.text)
                    base_name, ext = os.path.splitext(filename)
                    new_filename = f"{sanitized_caption}_4,6,8{ext}"
                    old_path = os.path.join(folder_path, filename)
                    new_path = os.path.join(folder_path, new_filename)

                    counter = 1
                    while os.path.exists(new_path):
                        new_filename = f"{sanitized_caption}_4,6,8_{counter}{ext}"
                        new_path = os.path.join(folder_path, new_filename)
                        counter += 1
                    
                    os.rename(old_path, new_path)
                    log_callback(f"   ✓ Renamed '{filename}' to '{new_filename}'")
                else:
                    log_callback(f"   ✗ Failed: No caption generated for {filename}")

            except Exception as e:
                log_callback(f"   ✗ Error processing {filename}: {str(e)}")

        if self.stop_processing_flag.is_set():
            log_callback("\n" + "!" * 60)
            log_callback("✗ PROCESS STOPPED BY USER.")
            log_callback("!" * 60)
            self.parent.after(0, lambda: messagebox.showwarning("Stopped", "The Image Renamer process was stopped."))
        else:
            log_callback("\n" + "=" * 60)
            log_callback("✓ Processing complete!")
            log_callback("=" * 60)
            self.parent.after(0, lambda: messagebox.showinfo("Success", "Image renaming complete!"))



# --- Custom Dialogs ---

class YesConfirmationDialog:
    def __init__(self, parent):
        self.result = False
        self.dialog = tk.Toplevel(parent)
        self.dialog.title("Confirm Force Push")
        self.dialog.geometry("500x200")
        self.dialog.resizable(False, False)
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        self.dialog.update_idletasks()
        x = (self.dialog.winfo_screenwidth() // 2) - (self.dialog.winfo_width() // 2)
        y = (self.dialog.winfo_screenheight() // 2) - (self.dialog.winfo_height() // 2)
        self.dialog.geometry(f"+{x}+{y}")
        
        style = ttk.Style()
        style.configure("Warning.TLabel", font=("Arial", 12), foreground="red")
        
        warning_frame = ttk.Frame(self.dialog, padding="20")
        warning_frame.pack(fill=tk.BOTH, expand=True)
        
        ttk.Label(warning_frame, text="!!! WARNING !!!", style="Warning.TLabel").pack(pady=(0, 10))
        ttk.Label(warning_frame, text="This will FORCE PUSH to GitHub!").pack()
        ttk.Label(warning_frame, text="GitHub will be overwritten to match your local folder exactly.").pack()
        ttk.Label(warning_frame, text="Type 'YES' below to confirm:").pack(pady=(20, 5))
        
        self.entry_var = tk.StringVar()
        entry = ttk.Entry(warning_frame, textvariable=self.entry_var, width=20, font=("Arial", 12))
        entry.pack(pady=5)
        entry.focus_set()
        
        button_frame = ttk.Frame(warning_frame)
        button_frame.pack(pady=(10, 0))
        
        ttk.Button(button_frame, text="Confirm", command=self.confirm).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Cancel", command=self.cancel).pack(side=tk.LEFT, padx=5)
        
        self.dialog.bind('<Return>', lambda event: self.confirm())
        self.dialog.protocol("WM_DELETE_WINDOW", self.cancel)
    
    def confirm(self):
        if self.entry_var.get() == "YES":
            self.result = True
        self.dialog.destroy()
    
    def cancel(self):
        self.result = False
        self.dialog.destroy()
    
    def show(self):
        self.dialog.wait_window()
        return self.result

# --- UI Classes ---

class GitPushUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("Git Push Tool")
        self.parent.geometry("800x600")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.git_manager = GitPushManager(self.parent, config_manager)
        self.is_pushing = False
        
        self.create_widgets()
        self.load_config_to_ui()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.switch_to_main_callback)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Git Push Tool", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        config_tab = ttk.Frame(notebook); notebook.add(config_tab, text="Configuration"); self.create_config_tab(config_tab)
        sync_tab = ttk.Frame(notebook); notebook.add(sync_tab, text="Sync"); self.create_sync_tab(sync_tab)
        clone_tab = ttk.Frame(notebook); notebook.add(clone_tab, text="Clone Repo"); self.create_clone_tab(clone_tab)
        log_tab = ttk.Frame(notebook); notebook.add(log_tab, text="Log"); self.create_log_tab(log_tab)
        
        self.notebook = notebook

    def create_config_tab(self, parent):
        config_frame = ttk.LabelFrame(parent, text="Git Configuration", padding="15")
        config_frame.pack(fill=tk.X, padx=10, pady=10)
        self.style.configure("TLabelframe.Label", font=("Arial", 12, "bold"))
        
        ttk.Label(config_frame, text="Repository Path:").grid(row=0, column=0, sticky=tk.W, pady=8)
        self.repo_path_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.repo_path_var, width=50).grid(row=0, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_repo_path).grid(row=0, column=2, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Repository URL:").grid(row=1, column=0, sticky=tk.W, pady=8)
        self.repo_url_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.repo_url_var, width=50).grid(row=1, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Personal Access Token:").grid(row=2, column=0, sticky=tk.W, pady=8)
        self.pat_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.pat_var, show="*", width=50).grid(row=2, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Email:").grid(row=3, column=0, sticky=tk.W, pady=8)
        self.email_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.email_var, width=50).grid(row=3, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Username:").grid(row=4, column=0, sticky=tk.W, pady=8)
        self.username_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.username_var, width=50).grid(row=4, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Button(config_frame, text="Save Configuration", command=self.save_config).grid(row=5, column=0, columnspan=3, pady=15)
        config_frame.columnconfigure(1, weight=1)

    def create_sync_tab(self, parent):
        sync_frame = ttk.Frame(parent); sync_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        changes_frame = ttk.LabelFrame(sync_frame, text="Changes Summary", padding="15"); changes_frame.pack(fill=tk.BOTH, expand=True)
        self.changes_text = tk.Text(changes_frame, height=15, state=tk.DISABLED, wrap=tk.WORD, bg="#ffffff", fg="#333333", font=("Consolas", 10))
        changes_scrollbar = ttk.Scrollbar(changes_frame, orient=tk.VERTICAL, command=self.changes_text.yview)
        self.changes_text.configure(yscrollcommand=changes_scrollbar.set)
        self.changes_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True); changes_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        commit_frame = ttk.Frame(sync_frame); commit_frame.pack(fill=tk.X, pady=10)
        ttk.Label(commit_frame, text="Commit Message:").pack(side=tk.LEFT, padx=(0, 10))
        self.commit_msg_var = tk.StringVar(value="Sync local to remote")
        ttk.Entry(commit_frame, textvariable=self.commit_msg_var, width=50, font=("Arial", 10)).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
        buttons_frame = ttk.Frame(sync_frame); buttons_frame.pack(fill=tk.X, pady=10)
        ttk.Button(buttons_frame, text="Check for Changes", command=self.check_changes).pack(side=tk.LEFT, padx=(0, 10))
        self.push_button = ttk.Button(buttons_frame, text="Push to GitHub", command=self.start_push_thread)
        self.push_button.pack(side=tk.RIGHT)
        self.stop_button = ttk.Button(buttons_frame, text="Stop", command=self.stop_process, state=tk.DISABLED)
        self.stop_button.pack(side=tk.RIGHT, padx=(0, 10))

    def create_clone_tab(self, parent):
        clone_frame = ttk.LabelFrame(parent, text="Clone a Repository", padding="15")
        clone_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(clone_frame, text="Repository URL:").grid(row=0, column=0, sticky=tk.W, pady=8)
        self.clone_url_var = tk.StringVar()
        ttk.Entry(clone_frame, textvariable=self.clone_url_var, width=50).grid(row=0, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(clone_frame, text="Save Path:").grid(row=1, column=0, sticky=tk.W, pady=8)
        self.clone_path_var = tk.StringVar()
        ttk.Entry(clone_frame, textvariable=self.clone_path_var, width=50).grid(row=1, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(clone_frame, text="Browse", command=self.browse_clone_path).grid(row=1, column=2, pady=8, padx=(5, 0))
        
        ttk.Button(clone_frame, text="Clone Repository", command=self.start_clone_thread).grid(row=2, column=0, columnspan=3, pady=15)
        clone_frame.columnconfigure(1, weight=1)

    def create_log_tab(self, parent):
        log_frame = ttk.Frame(parent); log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.log_text = tk.Text(log_frame, state=tk.DISABLED, wrap=tk.WORD, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        log_scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True); log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        ttk.Button(log_frame, text="Clear Log", command=self.clear_log).pack(pady=10)

    def browse_repo_path(self): path = filedialog.askdirectory(); self.repo_path_var.set(path) if path else None

    def browse_clone_path(self):
        path = filedialog.askdirectory()
        if path:
            self.clone_path_var.set(path)

    def load_config_to_ui(self):
        config = self.git_manager.config
        self.repo_path_var.set(config.get('repo_path', '')); self.repo_url_var.set(config.get('repo_url', ''))
        self.pat_var.set(config.get('pat', '')); self.email_var.set(config.get('email', ''))
        self.username_var.set(config.get('username', '')); self.log_message("Configuration loaded.")
    def save_config(self):
        config_data = {'repo_path': self.repo_path_var.get(), 'repo_url': self.repo_url_var.get(), 'pat': self.pat_var.get(), 'email': self.email_var.get(), 'username': self.username_var.get()}
        if self.git_manager.save_config(config_data): self.log_message("Configuration saved."); messagebox.showinfo("Success", "Configuration saved successfully.")
        else: self.log_message("Error: Failed to save configuration."); messagebox.showerror("Error", "Failed to save configuration.")
    def check_changes(self):
        repo_path = self.repo_path_var.get()
        if not repo_path or not os.path.exists(repo_path):
            messagebox.showerror("Error", "Repository path is invalid or does not exist.")
            return
        self.update_changes_display("Scanning for changes...")
        self.log_message("Checking for changes...")
        
        # Using '--untracked-files=all' ensures that all files within new directories are listed individually,
        # fixing the issue where only the directory was shown.
        stdout, stderr, code = self.git_manager._run_git_command('status --porcelain --untracked-files=all', repo_path, self.log_message)
        
        if code != 0:
            self.update_changes_display(f"An error occurred.\nSee the Log tab for details.")
            return

        if not stdout or not stdout.strip():
            self.update_changes_display("No changes detected.")
            return

        added_files, modified_files, deleted_files = [], [], []
        
        # The parsing logic is updated to be more robust and correctly categorize file statuses
        # from 'git status --porcelain', ensuring all changes are accurately reflected.
        for line in stdout.strip().split('\n'):
            if not line:
                continue
            
            status = line[:2]
            filename = line[3:]

            # Group untracked ('??') and newly added ('A') files together.
            if status == '??' or status.startswith('A'):
                added_files.append(filename)
            # Catch files deleted from the index ('D') or the working tree (' D').
            elif status.startswith('D') or status.endswith('D'):
                deleted_files.append(filename)
            # All other changes (Modified, Renamed, Copied) are grouped as modified.
            else:
                modified_files.append(filename)

        changes_text = "=" * 60 + "\nCHANGES SUMMARY\n" + "=" * 60 + "\n\n"
        
        if added_files:
            changes_text += f"[+] New or Added ({len(added_files)}):\n"
            changes_text += "\n".join([f"    + {f}" for f in added_files]) + "\n\n"
            
        if modified_files:
            changes_text += f"[~] Modified or Renamed ({len(modified_files)}):\n"
            changes_text += "\n".join([f"    ~ {f}" for f in modified_files]) + "\n\n"
            
        if deleted_files:
            changes_text += f"[-] Deleted ({len(deleted_files)}):\n"
            changes_text += "\n".join([f"    - {f}" for f in deleted_files]) + "\n\n"
            
        total_changes = len(added_files) + len(modified_files) + len(deleted_files)
        changes_text += "=" * 60 + f"\nTOTAL: {total_changes} changes\n" + "=" * 60
        
        self.update_changes_display(changes_text)
    def start_push_thread(self):
        if self.is_pushing: messagebox.showinfo("Busy", "A push operation is already in progress."); return
        if not all([self.repo_path_var.get(), self.repo_url_var.get(), self.pat_var.get(), self.email_var.get(), self.username_var.get()]):
            messagebox.showwarning("Missing Information", "Please complete all configuration fields."); return
        dialog = YesConfirmationDialog(self.parent)
        if not dialog.show(): return
        self.is_pushing = True; self.push_button.config(state=tk.DISABLED); self.stop_button.config(state=tk.NORMAL); self.clear_log()
        self.notebook.select(3)
        thread = threading.Thread(target=self.git_manager.push_to_github, args=(self.repo_path_var.get(), self.repo_url_var.get(), self.pat_var.get(), self.username_var.get(), self.email_var.get(), self.commit_msg_var.get(), self.log_message), daemon=True)
        thread.start(); self.parent.after(100, self.check_thread, thread)

    def start_clone_thread(self):
        repo_url = self.clone_url_var.get()
        save_path = self.clone_path_var.get()
        if not repo_url or not save_path:
            messagebox.showwarning("Missing Information", "Please provide both a repository URL and a save path.")
            return
        
        self.notebook.select(3) 
        self.clear_log()
        
        thread = threading.Thread(target=self.git_manager.clone_repository, args=(repo_url, save_path, self.log_message), daemon=True)
        thread.start()
        self.parent.after(100, self.check_thread, thread)
    def stop_process(self):
        self.git_manager.stop_process()
        self.log_message("Stop request sent. Waiting for current operation to finish...")
        self.stop_button.config(state=tk.DISABLED)
    def check_thread(self, thread):
        if thread.is_alive(): self.parent.after(100, self.check_thread, thread)
        else: self.is_pushing = False; self.push_button.config(state=tk.NORMAL); self.stop_button.config(state=tk.DISABLED); self.log_message("\nOperation finished.")
    def update_changes_display(self, text):
        self.changes_text.config(state=tk.NORMAL); self.changes_text.delete(1.0, tk.END); self.changes_text.insert(tk.END, text); self.changes_text.config(state=tk.DISABLED)
    def log_message(self, message):
        self.log_text.config(state=tk.NORMAL); self.log_text.insert(tk.END, message + "\n"); self.log_text.see(tk.END); self.log_text.config(state=tk.DISABLED); self.parent.update_idletasks()
    def clear_log(self):
        self.log_text.config(state=tk.NORMAL); self.log_text.delete(1.0, tk.END); self.log_text.config(state=tk.DISABLED)


class NanoBananaUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("Nano Banana")
        self.parent.geometry("800x600")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.nano_manager = NanoBananaManager(self.parent, config_manager)
        self.is_processing = False
        
        self.create_widgets()
        self.load_config_to_ui()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.switch_to_main_callback)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Nano Banana", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        config_tab = ttk.Frame(notebook); notebook.add(config_tab, text="Configuration"); self.create_config_tab(config_tab)
        log_tab = ttk.Frame(notebook); notebook.add(log_tab, text="Log"); self.create_log_tab(log_tab)
        self.notebook = notebook

    def create_config_tab(self, parent):
        config_frame = ttk.LabelFrame(parent, text="Nano Banana Configuration", padding="15")
        config_frame.pack(fill=tk.X, padx=10, pady=10)
        self.style.configure("TLabelframe.Label", font=("Arial", 12, "bold"))
        
        ttk.Label(config_frame, text="API Key:").grid(row=0, column=0, sticky=tk.W, pady=8)
        self.api_key_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.api_key_var, show="*", width=60).grid(row=0, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Image Folder:").grid(row=1, column=0, sticky=tk.W, pady=8)
        self.folder_path_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.folder_path_var, width=60).grid(row=1, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_folder).grid(row=1, column=2, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Prompt:").grid(row=2, column=0, sticky=tk.NW, pady=8)
        self.prompt_text = tk.Text(config_frame, height=5, width=60, font=("Arial", 10), wrap=tk.WORD)
        self.prompt_text.grid(row=2, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Button(config_frame, text="Save Configuration", command=self.save_config).grid(row=3, column=0, columnspan=3, pady=15)
        config_frame.columnconfigure(1, weight=1)

        action_frame = ttk.Frame(parent); action_frame.pack(fill=tk.X, padx=10, pady=10)
        self.process_button = ttk.Button(action_frame, text="Process Images", command=self.start_processing_thread)
        self.process_button.pack(side=tk.LEFT, padx=(0, 10))
        self.stop_button = ttk.Button(action_frame, text="Stop", command=self.stop_process, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT)

    def create_log_tab(self, parent):
        log_frame = ttk.Frame(parent); log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.log_text = tk.Text(log_frame, state=tk.DISABLED, wrap=tk.WORD, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        log_scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True); log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        ttk.Button(log_frame, text="Clear Log", command=self.clear_log).pack(pady=10)

    def browse_folder(self): path = filedialog.askdirectory(); self.folder_path_var.set(path) if path else None
    def load_config_to_ui(self):
        config = self.nano_manager.config
        self.api_key_var.set(config.get('api_key', ''))
        self.folder_path_var.set(config.get('folder_path', ''))
        self.prompt_text.delete("1.0", tk.END)
        self.prompt_text.insert("1.0", config.get('default_prompt', 'make the background pure red'))
        self.log_message("Configuration loaded.")
    def save_config(self):
        config_data = {'api_key': self.api_key_var.get(), 'folder_path': self.folder_path_var.get(), 'default_prompt': self.prompt_text.get("1.0", "end-1c")}
        if self.nano_manager.save_config(config_data): self.log_message("Configuration saved."); messagebox.showinfo("Success", "Configuration saved successfully.")
        else: self.log_message("Error: Failed to save configuration."); messagebox.showerror("Error", "Failed to save configuration.")
    def start_processing_thread(self):
        if self.is_processing: messagebox.showinfo("Busy", "Processing is already in progress."); return
        prompt_text = self.prompt_text.get("1.0", "end-1c")
        if not all([self.api_key_var.get(), self.folder_path_var.get(), prompt_text]):
            messagebox.showwarning("Missing Information", "Please complete all configuration fields."); return
        self.is_processing = True; self.process_button.config(state=tk.DISABLED); self.stop_button.config(state=tk.NORMAL); self.clear_log()
        self.notebook.select(1)
        thread = threading.Thread(target=self.nano_manager.process_images, args=(self.api_key_var.get(), prompt_text, self.folder_path_var.get(), self.log_message), daemon=True)
        thread.start(); self.parent.after(100, self.check_thread, thread)
    def stop_process(self):
        self.nano_manager.stop_process()
        self.log_message("Stop request sent. Waiting for current image to finish...")
        self.stop_button.config(state=tk.DISABLED)
    def check_thread(self, thread):
        if thread.is_alive(): self.parent.after(100, self.check_thread, thread)
        else: self.is_processing = False; self.process_button.config(state=tk.NORMAL); self.stop_button.config(state=tk.DISABLED); self.log_message("\nOperation finished.")
    def log_message(self, message):
        self.log_text.config(state=tk.NORMAL); self.log_text.insert(tk.END, message + "\n"); self.log_text.see(tk.END); self.log_text.config(state=tk.DISABLED); self.parent.update_idletasks()
    def clear_log(self):
        self.log_text.config(state=tk.NORMAL); self.log_text.delete(1.0, tk.END); self.log_text.config(state=tk.DISABLED)


class BackgroundRemoverUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("Background Remover")
        self.parent.geometry("800x600")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.bg_manager = BackgroundRemoverManager(self.parent, config_manager)
        self.is_processing = False
        
        self.create_widgets()
        self.load_config_to_ui()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.switch_to_main_callback)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Background Remover", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        config_tab = ttk.Frame(notebook); notebook.add(config_tab, text="Configuration"); self.create_config_tab(config_tab)
        log_tab = ttk.Frame(notebook); notebook.add(log_tab, text="Log"); self.create_log_tab(log_tab)
        self.notebook = notebook

    def create_config_tab(self, parent):
        config_frame = ttk.LabelFrame(parent, text="Background Remover Configuration", padding="15")
        config_frame.pack(fill=tk.X, padx=10, pady=10)
        self.style.configure("TLabelframe.Label", font=("Arial", 12, "bold"))
        
        ttk.Label(config_frame, text="Image Folder:").grid(row=0, column=0, sticky=tk.W, pady=8)
        self.folder_path_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.folder_path_var, width=60).grid(row=0, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_folder).grid(row=0, column=2, pady=8, padx=(5, 0))
        
        ttk.Button(config_frame, text="Save Configuration", command=self.save_config).grid(row=1, column=0, columnspan=3, pady=15)
        config_frame.columnconfigure(1, weight=1)

        action_frame = ttk.Frame(parent); action_frame.pack(fill=tk.X, padx=10, pady=10)
        self.process_button = ttk.Button(action_frame, text="Process Images", command=self.start_processing_thread)
        self.process_button.pack(side=tk.LEFT, padx=(0, 10))
        self.stop_button = ttk.Button(action_frame, text="Stop", command=self.stop_process, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT)

    def create_log_tab(self, parent):
        log_frame = ttk.Frame(parent); log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.log_text = tk.Text(log_frame, state=tk.DISABLED, wrap=tk.WORD, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        log_scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True); log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        ttk.Button(log_frame, text="Clear Log", command=self.clear_log).pack(pady=10)

    def browse_folder(self): path = filedialog.askdirectory(); self.folder_path_var.set(path) if path else None
    def load_config_to_ui(self):
        config = self.bg_manager.config
        self.folder_path_var.set(config.get('folder_path', ''))
        self.log_message("Configuration loaded.")
    def save_config(self):
        config_data = {'folder_path': self.folder_path_var.get()}
        if self.bg_manager.save_config(config_data): self.log_message("Configuration saved."); messagebox.showinfo("Success", "Configuration saved successfully.")
        else: self.log_message("Error: Failed to save configuration."); messagebox.showerror("Error", "Failed to save configuration.")
    def start_processing_thread(self):
        if self.is_processing: messagebox.showinfo("Busy", "Processing is already in progress."); return
        if not self.folder_path_var.get():
            messagebox.showwarning("Missing Information", "Please select a folder."); return
        self.is_processing = True; self.process_button.config(state=tk.DISABLED); self.stop_button.config(state=tk.NORMAL); self.clear_log()
        self.notebook.select(1)
        thread = threading.Thread(target=self.bg_manager.process_images, args=(self.folder_path_var.get(), self.log_message), daemon=True)
        thread.start(); self.parent.after(100, self.check_thread, thread)
    def stop_process(self):
        self.bg_manager.stop_process()
        self.log_message("Stop request sent. Waiting for current image to finish...")
        self.stop_button.config(state=tk.DISABLED)
    def check_thread(self, thread):
        if thread.is_alive(): self.parent.after(100, self.check_thread, thread)
        else: self.is_processing = False; self.process_button.config(state=tk.NORMAL); self.stop_button.config(state=tk.DISABLED); self.log_message("\nOperation finished.")
    def log_message(self, message):
        self.log_text.config(state=tk.NORMAL); self.log_text.insert(tk.END, message + "\n"); self.log_text.see(tk.END); self.log_text.config(state=tk.DISABLED); self.parent.update_idletasks()
    def clear_log(self):
        self.log_text.config(state=tk.NORMAL); self.log_text.delete(1.0, tk.END); self.log_text.config(state=tk.DISABLED)

class ImageRenamerUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("Image Renamer")
        self.parent.geometry("800x600")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.renamer_manager = ImageRenamerManager(self.parent, config_manager)
        self.is_processing = False
        self.excluded_words = []
        
        self.create_widgets()
        self.load_config_to_ui()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.switch_to_main_callback)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Image Renamer", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        config_tab = ttk.Frame(notebook); notebook.add(config_tab, text="Configuration"); self.create_config_tab(config_tab)
        log_tab = ttk.Frame(notebook); notebook.add(log_tab, text="Log"); self.create_log_tab(log_tab)
        self.notebook = notebook

    def create_config_tab(self, parent):
        config_frame = ttk.LabelFrame(parent, text="Image Renamer Configuration", padding="15")
        config_frame.pack(fill=tk.X, padx=10, pady=10)
        self.style.configure("TLabelframe.Label", font=("Arial", 12, "bold"))
        
        ttk.Label(config_frame, text="API Key:").grid(row=0, column=0, sticky=tk.W, pady=8)
        self.api_key_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.api_key_var, show="*", width=60).grid(row=0, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Image Folder:").grid(row=1, column=0, sticky=tk.W, pady=8)
        self.folder_path_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.folder_path_var, width=60).grid(row=1, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_folder).grid(row=1, column=2, pady=8, padx=(5, 0))

        ttk.Label(config_frame, text="Prompt:").grid(row=2, column=0, sticky=tk.NW, pady=8)
        self.prompt_text = tk.Text(config_frame, height=5, width=60, font=("Arial", 10), wrap=tk.WORD)
        self.prompt_text.grid(row=2, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))

        exclude_frame = ttk.Frame(config_frame)
        exclude_frame.grid(row=3, column=0, columnspan=3, sticky=tk.W, pady=10)
        ttk.Label(exclude_frame, text="Exclude Words:").pack(side=tk.LEFT)
        self.exclude_word_var = tk.StringVar()
        ttk.Entry(exclude_frame, textvariable=self.exclude_word_var, width=20).pack(side=tk.LEFT, padx=5)
        ttk.Button(exclude_frame, text="+", command=self.add_excluded_word, width=2).pack(side=tk.LEFT)

        self.excluded_words_frame = ttk.Frame(config_frame)
        self.excluded_words_frame.grid(row=4, column=1, columnspan=2, sticky=tk.W, pady=5)

        ttk.Button(config_frame, text="Save Configuration", command=self.save_config).grid(row=5, column=0, columnspan=3, pady=15)
        config_frame.columnconfigure(1, weight=1)

        action_frame = ttk.Frame(parent); action_frame.pack(fill=tk.X, padx=10, pady=10)
        self.process_button = ttk.Button(action_frame, text="Process & Rename Images", command=self.start_processing_thread)
        self.process_button.pack(side=tk.LEFT, padx=(0, 10))
        self.stop_button = ttk.Button(action_frame, text="Stop", command=self.stop_process, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT)

    def add_excluded_word(self):
        word = self.exclude_word_var.get().strip()
        if not word:
            return
        if len(word) > 10:
            messagebox.showwarning("Invalid Word", "Excluded word cannot be more than 10 characters.")
            return
        if len(self.excluded_words) >= 10:
            messagebox.showwarning("Limit Reached", "You can only add up to 10 excluded words.")
            return
        if word in self.excluded_words:
            messagebox.showwarning("Duplicate Word", "This word is already in the excluded list.")
            return
        
        self.excluded_words.append(word)
        self.exclude_word_var.set("")
        self.update_excluded_words_display()

    def remove_excluded_word(self, word):
        self.excluded_words.remove(word)
        self.update_excluded_words_display()

    def update_excluded_words_display(self):
        for widget in self.excluded_words_frame.winfo_children():
            widget.destroy()

        for word in self.excluded_words:
            word_frame = ttk.Frame(self.excluded_words_frame)
            word_frame.pack(side=tk.LEFT, padx=2, pady=2)
            ttk.Label(word_frame, text=word, background="#e0e0e0", padding=5).pack(side=tk.LEFT)
            remove_button = ttk.Button(word_frame, text="x", width=2, command=lambda w=word: self.remove_excluded_word(w))
            remove_button.pack(side=tk.LEFT)

    def create_log_tab(self, parent):
        log_frame = ttk.Frame(parent); log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self.log_text = tk.Text(log_frame, state=tk.DISABLED, wrap=tk.WORD, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        log_scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True); log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        ttk.Button(log_frame, text="Clear Log", command=self.clear_log).pack(pady=10)

    def browse_folder(self): path = filedialog.askdirectory(); self.folder_path_var.set(path) if path else None
    def load_config_to_ui(self):
        config = self.renamer_manager.config
        self.api_key_var.set(config.get('api_key', ''))
        self.folder_path_var.set(config.get('folder_path', ''))
        self.prompt_text.delete("1.0", tk.END)
        self.prompt_text.insert("1.0", config.get('prompt', 'Give me a name that you think it suits the object in the image. your respond (name given) must be 1 to 3 words long. Your text output (object name) must be  attached and each word starts with a capital letter like "GemIronRuby".'))
        self.log_message("Configuration loaded.")

    def save_config(self):
        config_data = {
            'api_key': self.api_key_var.get(), 
            'folder_path': self.folder_path_var.get(),
            'prompt': self.prompt_text.get("1.0", "end-1c")
        }
        if self.renamer_manager.save_config(config_data): self.log_message("Configuration saved."); messagebox.showinfo("Success", "Configuration saved successfully.")
        else: self.log_message("Error: Failed to save configuration."); messagebox.showerror("Error", "Failed to save configuration.")

    def start_processing_thread(self):
        if self.is_processing: messagebox.showinfo("Busy", "Processing is already in progress."); return
        prompt = self.prompt_text.get("1.0", "end-1c")
        if not all([self.api_key_var.get(), self.folder_path_var.get(), prompt]):
            messagebox.showwarning("Missing Information", "Please complete all configuration fields."); return
        self.is_processing = True; self.process_button.config(state=tk.DISABLED); self.stop_button.config(state=tk.NORMAL); self.clear_log()
        self.notebook.select(1)
        thread = threading.Thread(target=self.renamer_manager.process_and_rename_images, args=(self.api_key_var.get(), self.folder_path_var.get(), prompt, self.excluded_words, self.log_message), daemon=True)
        thread.start(); self.parent.after(100, self.check_thread, thread)

    def stop_process(self):
        self.renamer_manager.stop_process()
        self.log_message("Stop request sent. Waiting for current image to finish...")
        self.stop_button.config(state=tk.DISABLED)

    def check_thread(self, thread):
        if thread.is_alive(): self.parent.after(100, self.check_thread, thread)
        else: self.is_processing = False; self.process_button.config(state=tk.NORMAL); self.stop_button.config(state=tk.DISABLED); self.log_message("\nOperation finished.")

    def log_message(self, message):
        self.log_text.config(state=tk.NORMAL); self.log_text.insert(tk.END, message + "\n"); self.log_text.see(tk.END); self.log_text.config(state=tk.DISABLED); self.parent.update_idletasks()

    def clear_log(self):
        self.log_text.config(state=tk.NORMAL); self.log_text.delete(1.0, tk.END); self.log_text.config(state=tk.DISABLED)


class ScriptLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("Script Launcher")
        self.root.geometry("800x600")
        
        self.config_file = "launcher_config.json"
        self.scripts = self.load_scripts()
        self.app_config_manager = AppConfigManager()
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.accent_color = "#4a90e2"
        self.root.configure(bg=self.bg_color)
        
        self.create_main_ui()
        
    def load_scripts(self):
        if os.path.exists(self.config_file):
            try: return json.load(open(self.config_file, 'r'))
            except (json.JSONDecodeError, IOError): return []
        return []
    
    def save_scripts(self): json.dump(self.scripts, open(self.config_file, 'w'), indent=4)
    
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
        
        scrollbar = ttk.Scrollbar(list_frame); scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.script_listbox = tk.Listbox(list_frame, yscrollcommand=scrollbar.set, bg="#ffffff", fg="#333333", font=("Arial", 11), selectbackground=self.accent_color, selectforeground="#ffffff")
        self.script_listbox.pack(fill=tk.BOTH, expand=True); scrollbar.config(command=self.script_listbox.yview)
        
        self.refresh_script_list()
        
        buttons_frame = ttk.Frame(main_frame); buttons_frame.pack(fill=tk.X, pady=(20, 0))
        self.style.configure("Accent.TButton", font=("Arial", 10))
        
        ttk.Button(buttons_frame, text="Add New Script", command=self.add_script).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(buttons_frame, text="Remove Selected", command=self.remove_script).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(buttons_frame, text="Run Selected", command=self.run_script).pack(side=tk.RIGHT, padx=(10, 0))
        ttk.Button(buttons_frame, text="Image Renamer", command=self.launch_image_renamer_ui, style="Accent.TButton").pack(side=tk.RIGHT, padx=(0, 10))
        ttk.Button(buttons_frame, text="Background Remover", command=self.launch_bg_remover_ui, style="Accent.TButton").pack(side=tk.RIGHT, padx=(0, 10))
        ttk.Button(buttons_frame, text="Nano Banana", command=self.launch_nano_banana_ui, style="Accent.TButton").pack(side=tk.RIGHT, padx=(0, 10))
        ttk.Button(buttons_frame, text="Git Push Tool", command=self.launch_git_push_ui, style="Accent.TButton").pack(side=tk.RIGHT, padx=(0, 10))

    def refresh_script_list(self):
        self.script_listbox.delete(0, tk.END)
        for script in self.scripts:
            self.script_listbox.insert(tk.END, script['name'])
    
    def add_script(self):
        file_path = filedialog.askopenfilename(title="Select Script", filetypes=[("Python Scripts", "*.py"), ("All Files", "*.*")])
        if file_path:
            absolute_path = os.path.abspath(file_path)
            script_name = os.path.basename(absolute_path)
            name_without_ext = os.path.splitext(script_name)[0]
            self.scripts.append({'name': name_without_ext, 'path': absolute_path})
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
        if not selection: messagebox.showwarning("No Selection", "Please select a script to run."); return
        
        index = selection[0]
        script_path = self.scripts[index]['path']
        
        try:
            if sys.platform == "win32": subprocess.Popen(['cmd', '/k', 'python', script_path])
            elif sys.platform == "darwin": subprocess.Popen(['osascript', '-e', f'tell application "Terminal" to do script "python {script_path}"'])
            else: subprocess.Popen(['x-terminal-emulator', '-e', f'python {script_path}'])
        except Exception as e: messagebox.showerror("Error", f"Failed to run script: {str(e)}")
    
    def launch_git_push_ui(self):
        self.git_push_ui = GitPushUI(self.root, self.create_main_ui, self.app_config_manager)
    
    def launch_nano_banana_ui(self):
        self.nano_banana_ui = NanoBananaUI(self.root, self.create_main_ui, self.app_config_manager)
    
    def launch_bg_remover_ui(self):
        self.bg_remover_ui = BackgroundRemoverUI(self.root, self.create_main_ui, self.app_config_manager)

    def launch_image_renamer_ui(self):
        self.image_renamer_ui = ImageRenamerUI(self.root, self.create_main_ui, self.app_config_manager)


def main():
    root = tk.Tk()
    app = ScriptLauncher(root)
    root.mainloop()

if __name__ == "__main__":
    main()
