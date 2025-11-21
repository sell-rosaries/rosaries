import os
import subprocess
import sys
import threading
import shutil
import shlex
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox

class GitPushManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        
        # Load list of profiles. Default to empty list if not found.
        self.profiles = self.config_manager.get_tool_config('git_configs')
        if not isinstance(self.profiles, list):
            self.profiles = []
            # Migration check: if old config exists, make it a default profile
            old_config = self.config_manager.get_tool_config('git_push')
            if old_config and isinstance(old_config, dict) and 'repo_path' in old_config:
                 old_config['name'] = 'Default'
                 self.profiles.append(old_config)
                 self.config_manager.set_tool_config('git_configs', self.profiles)

        # Current active config (default to first one or empty)
        self.config = self.profiles[0] if self.profiles else {}
        
        self.process = None
        self.stop_push_flag = threading.Event()

    def save_profile(self, name, config_data):
        config_data['name'] = name
        
        # Update existing or append new
        updated = False
        for i, profile in enumerate(self.profiles):
            if profile.get('name') == name:
                self.profiles[i] = config_data
                updated = True
                break
        
        if not updated:
            self.profiles.append(config_data)
            
        if self.config_manager.set_tool_config('git_configs', self.profiles):
            self.config = config_data
            return True
        return False

    def get_profile_names(self):
        return [p.get('name', 'Unnamed') for p in self.profiles]

    def load_profile(self, name):
        for profile in self.profiles:
            if profile.get('name') == name:
                self.config = profile
                return profile
        return None

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