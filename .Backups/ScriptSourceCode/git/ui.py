import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import threading
from .manager import GitPushManager, YesConfirmationDialog

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

    def on_back(self):
        if self.is_pushing:
            if not messagebox.askyesno("Task Running", "Git operation is running. Do you really want to go back and cancel/background it?"):
                return
        self.original_switch_callback()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        if self.switch_to_main_callback:
            self.original_switch_callback = self.switch_to_main_callback

        back_button = ttk.Button(title_frame, text="← Back", command=self.on_back)
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
        
        btn_frame = ttk.Frame(config_frame)
        btn_frame.grid(row=5, column=0, columnspan=3, pady=15)
        ttk.Button(btn_frame, text="Save Configuration", command=self.save_config).pack(side=tk.LEFT, padx=10)
        ttk.Button(btn_frame, text="Load Configuration", command=self.open_load_dialog).pack(side=tk.LEFT, padx=10)
        
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

    def browse_repo_path(self): 
        path = filedialog.askdirectory()
        if path:
            self.repo_path_var.set(path)

    def browse_clone_path(self):
        path = filedialog.askdirectory()
        if path:
            self.clone_path_var.set(path)

    def load_config_to_ui(self):
        config = self.git_manager.config
        self.repo_path_var.set(config.get('repo_path', ''))
        self.repo_url_var.set(config.get('repo_url', ''))
        self.pat_var.set(config.get('pat', ''))
        self.email_var.set(config.get('email', ''))
        self.username_var.set(config.get('username', ''))
        self.log_message("Configuration loaded.")
    
    def save_config(self):
        config_data = {
            'repo_path': self.repo_path_var.get(),
            'repo_url': self.repo_url_var.get(),
            'pat': self.pat_var.get(),
            'email': self.email_var.get(),
            'username': self.username_var.get()
        }
        
        current_name = self.git_manager.config.get('name', '')
        name = simpledialog.askstring("Save Configuration", "Enter a name for this configuration:", initialvalue=current_name, parent=self.parent)
        
        if not name:
            return
            
        if self.git_manager.save_profile(name, config_data):
            self.log_message(f"Configuration '{name}' saved.")
            messagebox.showinfo("Success", f"Configuration '{name}' saved successfully.")
        else:
            self.log_message("Error: Failed to save configuration.")
            messagebox.showerror("Error", "Failed to save configuration.")

    def open_load_dialog(self):
        profiles = self.git_manager.get_profile_names()
        if not profiles:
            messagebox.showinfo("Info", "No saved configurations found.")
            return

        dialog = tk.Toplevel(self.parent)
        dialog.title("Load Configuration")
        dialog.geometry("300x400")
        dialog.transient(self.parent)
        
        # Center
        dialog.update_idletasks()
        try:
            x = (self.parent.winfo_x() + (self.parent.winfo_width() // 2)) - 150
            y = (self.parent.winfo_y() + (self.parent.winfo_height() // 2)) - 200
            dialog.geometry(f"+{x}+{y}")
        except Exception:
            pass

        listbox = tk.Listbox(dialog, font=("Arial", 11))
        listbox.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        for p in profiles:
            listbox.insert(tk.END, p)
            
        def load(event=None):
            selection = listbox.curselection()
            if selection:
                name = listbox.get(selection[0])
                profile = self.git_manager.load_profile(name)
                if profile:
                    self.load_config_to_ui()
                    self.log_message(f"Configuration '{name}' loaded.")
                    dialog.destroy()
        
        listbox.bind('<Double-1>', load)
        ttk.Button(dialog, text="Load", command=load).pack(pady=10)
    
    def check_changes(self):
        repo_path = self.repo_path_var.get()
        if not repo_path or not os.path.exists(repo_path):
            messagebox.showerror("Error", "Repository path is invalid or does not exist.")
            return
        self.update_changes_display("Scanning for changes...")
        self.log_message("Checking for changes...")
        
        stdout, stderr, code = self.git_manager._run_git_command('status --porcelain --untracked-files=all', repo_path, self.log_message)
        
        if code != 0:
            self.update_changes_display(f"An error occurred.\nSee the Log tab for details.")
            return

        if not stdout or not stdout.strip():
            self.update_changes_display("No changes detected.")
            return

        added_files, modified_files, deleted_files = [], [], []
        
        for line in stdout.strip().split('\n'):
            if not line:
                continue
            
            status = line[:2]
            filename = line[3:]

            if status == '??' or status.startswith('A'):
                added_files.append(filename)
            elif status.startswith('D') or status.endswith('D'):
                deleted_files.append(filename)
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
        if self.is_pushing:
            messagebox.showinfo("Busy", "A push operation is already in progress.")
            return
        if not all([self.repo_path_var.get(), self.repo_url_var.get(), self.pat_var.get(), self.email_var.get(), self.username_var.get()]):
            messagebox.showwarning("Missing Information", "Please complete all configuration fields.")
            return
        dialog = YesConfirmationDialog(self.parent)
        if not dialog.show():
            return
        self.is_pushing = True
        self.push_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.clear_log()
        self.notebook.select(3)
        thread = threading.Thread(
            target=self.git_manager.push_to_github,
            args=(
                self.repo_path_var.get(),
                self.repo_url_var.get(),
                self.pat_var.get(),
                self.username_var.get(),
                self.email_var.get(),
                self.commit_msg_var.get(),
                self.log_message
            ),
            daemon=True
        )
        thread.start()
        self.parent.after(100, self.check_thread, thread)

    def start_clone_thread(self):
        repo_url = self.clone_url_var.get()
        save_path = self.clone_path_var.get()
        if not repo_url or not save_path:
            messagebox.showwarning("Missing Information", "Please provide both a repository URL and a save path.")
            return
        
        self.notebook.select(3)
        self.clear_log()
        
        thread = threading.Thread(
            target=self.git_manager.clone_repository,
            args=(repo_url, save_path, self.log_message),
            daemon=True
        )
        thread.start()
        self.parent.after(100, self.check_thread, thread)
    
    def stop_process(self):
        self.git_manager.stop_process()
        self.log_message("Stop request sent. Waiting for current operation to finish...")
        self.stop_button.config(state=tk.DISABLED)
    
    def check_thread(self, thread):
        if thread.is_alive():
            self.parent.after(100, self.check_thread, thread)
        else:
            self.is_pushing = False
            self.push_button.config(state=tk.NORMAL)
            self.stop_button.config(state=tk.DISABLED)
            self.log_message("\nOperation finished.")
    
    def update_changes_display(self, text):
        self.changes_text.config(state=tk.NORMAL)
        self.changes_text.delete(1.0, tk.END)
        self.changes_text.insert(tk.END, text)
        self.changes_text.config(state=tk.DISABLED)
    
    def log_message(self, message):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)
        self.parent.update_idletasks()
    
    def clear_log(self):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state=tk.DISABLED)