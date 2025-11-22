import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
from .manager import APKUpdaterManager


class APKUpdaterUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("APK Updater")
        self.parent.geometry("800x600")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.apk_manager = APKUpdaterManager(self.parent, config_manager)
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
        
        title_label = ttk.Label(title_frame, text="APK Updater", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        config_tab = ttk.Frame(notebook); notebook.add(config_tab, text="Configuration"); self.create_config_tab(config_tab)
        log_tab = ttk.Frame(notebook); notebook.add(log_tab, text="Log"); self.create_log_tab(log_tab)
        self.notebook = notebook

    def create_config_tab(self, parent):
        config_frame = ttk.LabelFrame(parent, text="APK Updater Configuration", padding="15")
        config_frame.pack(fill=tk.X, padx=10, pady=10)
        self.style.configure("TLabelframe.Label", font=("Arial", 12, "bold"))
        
        ttk.Label(config_frame, text="Git Repo Directory:").grid(row=0, column=0, sticky=tk.W, pady=8)
        self.git_repo_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.git_repo_var, width=50).grid(row=0, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_git_repo).grid(row=0, column=2, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="APK Project Directory:").grid(row=1, column=0, sticky=tk.W, pady=8)
        self.apk_dir_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.apk_dir_var, width=50).grid(row=1, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_apk_dir).grid(row=1, column=2, pady=8, padx=(5, 0))
        
        # Run button
        button_frame = ttk.Frame(config_frame)
        button_frame.grid(row=2, column=0, columnspan=3, pady=15)
        
        self.run_button = ttk.Button(button_frame, text="Run", command=self.start_update_thread, style="Accent.TButton")
        self.run_button.pack(side=tk.LEFT, padx=(0, 10))
        self.style.configure("Accent.TButton", font=("Arial", 11, "bold"))
        
        self.stop_button = ttk.Button(button_frame, text="Stop", command=self.stop_process, state=tk.DISABLED)
        self.stop_button.pack(side=tk.LEFT)
        
        config_frame.columnconfigure(1, weight=1)

        # Info frame
        info_frame = ttk.LabelFrame(parent, text="Process Steps", padding="15")
        info_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        info_text = tk.Text(info_frame, height=12, wrap=tk.WORD, bg="#ffffff", fg="#333333", font=("Arial", 10))
        info_text.pack(fill=tk.BOTH, expand=True)
        
        steps_info = """When you click 'Run', the following steps will be performed:

1. Copy 'gallery' and 'Jularies' folders from Git repo to APK assets
   → Replaces existing folders in: APK_DIR/app/src/main/assets/

2. Build APK using Gradle
   → Runs: gradlew.bat assembleDebug with JAVA_HOME set

3. Version Management
   → Moves built APK to: GIT_REPO/apk/latest/Latest-version-X.apk
   → Previous version moved to: GIT_REPO/apk/old/Old-version-Y.apk
   → Version number automatically increments

All operations will be logged in the Log tab."""
        
        info_text.insert("1.0", steps_info)
        info_text.config(state=tk.DISABLED)

    def create_log_tab(self, parent):
        log_frame = ttk.Frame(parent)
        log_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.log_text = tk.Text(log_frame, state=tk.DISABLED, wrap=tk.WORD, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        log_scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scrollbar.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        ttk.Button(log_frame, text="Clear Log", command=self.clear_log).pack(pady=10)

    def browse_git_repo(self):
        path = filedialog.askdirectory(title="Select Git Repository Directory")
        if path:
            self.git_repo_var.set(path)

    def browse_apk_dir(self):
        path = filedialog.askdirectory(title="Select APK Project Directory")
        if path:
            self.apk_dir_var.set(path)

    def load_config_to_ui(self):
        config = self.apk_manager.config
        self.git_repo_var.set(config.get('git_repo_dir', ''))
        self.apk_dir_var.set(config.get('apk_dir', ''))
        self.log_message("Configuration loaded.")
    
    def start_update_thread(self):
        if self.is_processing:
            messagebox.showinfo("Busy", "Update is already in progress.")
            return
        
        if not all([self.git_repo_var.get(), self.apk_dir_var.get()]):
            messagebox.showwarning("Missing Information", "Please fill in both directory paths.")
            return
        
        self.is_processing = True
        self.run_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.clear_log()
        self.notebook.select(1)  # Switch to log tab
        
        thread = threading.Thread(
            target=self.apk_manager.update_apk,
            args=(
                self.git_repo_var.get(),
                self.apk_dir_var.get(),
                self.log_message
            ),
            daemon=True
        )
        thread.start()
        self.parent.after(100, self.check_thread, thread)
    
    def stop_process(self):
        self.apk_manager.stop_process()
        self.log_message("Stop request sent. Waiting for current operation to finish...")
        self.stop_button.config(state=tk.DISABLED)
    
    def check_thread(self, thread):
        if thread.is_alive():
            self.parent.after(100, self.check_thread, thread)
        else:
            self.is_processing = False
            self.run_button.config(state=tk.NORMAL)
            self.stop_button.config(state=tk.DISABLED)
            self.log_message("\nOperation finished.")
    
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
