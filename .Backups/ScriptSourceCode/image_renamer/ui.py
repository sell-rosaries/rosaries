import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
from .manager import ImageRenamerManager

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
        ttk.Entry(config_frame, textvariable=self.api_key_var, show="*", width=60).grid(row=0, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Image Folder:").grid(row=1, column=0, sticky=tk.W, pady=8)
        self.folder_path_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.folder_path_var, width=60).grid(row=1, column=1, sticky=tk.EW, pady=8, padx=(5, 0))
        ttk.Button(config_frame, text="Browse", command=self.browse_folder).grid(row=1, column=2, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Prompt:").grid(row=2, column=0, sticky=tk.NW, pady=8)
        self.prompt_text = tk.Text(config_frame, height=5, width=60, font=("Arial", 10), wrap=tk.WORD)
        self.prompt_text.grid(row=2, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))
        
        ttk.Label(config_frame, text="Excluded Words (comma-separated):").grid(row=3, column=0, sticky=tk.W, pady=8)
        self.excluded_words_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.excluded_words_var, width=60).grid(row=3, column=1, columnspan=2, sticky=tk.EW, pady=8, padx=(5, 0))

        ttk.Label(config_frame, text="Batch Size (1-5):").grid(row=4, column=0, sticky=tk.W, pady=8)
        self.batch_size_var = tk.IntVar(value=1)
        spin = ttk.Spinbox(config_frame, from_=1, to=5, textvariable=self.batch_size_var, width=5)
        spin.grid(row=4, column=1, sticky=tk.W, pady=8, padx=(5,0))
        
        ttk.Label(config_frame, text="Batch Size (1-5):").grid(row=4, column=0, sticky=tk.W, pady=8)
        self.batch_size_var = tk.IntVar(value=1)
        spin = ttk.Spinbox(config_frame, from_=1, to=5, textvariable=self.batch_size_var, width=5)
        spin.grid(row=4, column=1, sticky=tk.W, pady=8, padx=(5,0))

        # Model Selection
        ttk.Label(config_frame, text="Model:").grid(row=5, column=0, sticky=tk.W, pady=8)
        self.model_name_var = tk.StringVar(value="gemini-2.5-flash")
        
        self.model_map = {
            "Gemini 2.5 Flash (Current)": "gemini-2.5-flash",
            "Gemini 2.5 Pro": "gemini-2.5-pro", 
            "Gemini 3 Pro Preview": "gemini-3-pro-preview"
        }
        self.rev_model_map = {v: k for k, v in self.model_map.items()}
        
        self.model_display_var = tk.StringVar(value="Gemini 2.5 Flash (Current)")
        model_dropdown = ttk.Combobox(config_frame, textvariable=self.model_display_var, values=list(self.model_map.keys()), state="readonly", width=30)
        model_dropdown.grid(row=5, column=1, columnspan=2, sticky=tk.W, pady=8, padx=(5,0))
        
        ttk.Button(config_frame, text="Save Configuration", command=self.save_config).grid(row=6, column=0, columnspan=3, pady=15)
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

    def browse_folder(self): 
        path = filedialog.askdirectory()
        self.folder_path_var.set(path) if path else None
    
    def load_config_to_ui(self):
        config = self.renamer_manager.config
        self.api_key_var.set(config.get('api_key', ''))
        self.folder_path_var.set(config.get('folder_path', ''))
        self.batch_size_var.set(config.get('batch_size', 1)) 
        
        saved_model_id = config.get('model_id', 'gemini-2.5-flash')
        # Default to flash if unknown
        self.model_display_var.set(self.rev_model_map.get(saved_model_id, "Gemini 2.5 Flash (Current)"))
        
        self.prompt_text.delete("1.0", tk.END)
        self.prompt_text.insert("1.0", config.get('default_prompt', 'Describe this image in a short filename-friendly phrase.'))
        self.excluded_words_var.set(config.get('excluded_words', ''))
        self.log_message("Configuration loaded.")
    
    def save_config(self):
        selected_display = self.model_display_var.get()
        model_id = self.model_map.get(selected_display, "gemini-2.5-flash")
        
        config_data = {
            'api_key': self.api_key_var.get(),
            'folder_path': self.folder_path_var.get(),
            'batch_size': self.batch_size_var.get(),
            'model_id': model_id,
            'default_prompt': self.prompt_text.get("1.0", "end-1c"),
            'excluded_words': self.excluded_words_var.get()
        }
        if self.renamer_manager.save_config(config_data):
            self.log_message("Configuration saved.")
            messagebox.showinfo("Success", "Configuration saved successfully.")
        else:
            self.log_message("Error: Failed to save configuration.")
            messagebox.showerror("Error", "Failed to save configuration.")
    
    def start_processing_thread(self):
        if self.is_processing:
            messagebox.showinfo("Busy", "Processing is already in progress.")
            return
        prompt_text = self.prompt_text.get("1.0", "end-1c")
        excluded_words = [w.strip() for w in self.excluded_words_var.get().split(',') if w.strip()]
        
        selected_display = self.model_display_var.get()
        model_id = self.model_map.get(selected_display, "gemini-2.5-flash")
        
        if not all([self.api_key_var.get(), self.folder_path_var.get(), prompt_text]):
            messagebox.showwarning("Missing Information", "Please complete all configuration fields.")
            return
        self.is_processing = True
        self.process_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.clear_log()
        self.notebook.select(1)
        thread = threading.Thread(
            target=self.renamer_manager.process_and_rename_images,
            args=(
                self.api_key_var.get(),
                self.folder_path_var.get(),
                prompt_text,
                excluded_words,
                self.log_message,
                self.batch_size_var.get(),
                model_id
            ),
            daemon=True
        )
        thread.start()
        self.parent.after(100, self.check_thread, thread)
    
    def stop_process(self):
        self.renamer_manager.stop_process()
        self.log_message("Stop request sent. Waiting for active threads to finish...")
        self.stop_button.config(state=tk.DISABLED)
    
    def check_thread(self, thread):
        if thread.is_alive():
            self.parent.after(100, self.check_thread, thread)
        else:
            self.is_processing = False
            self.process_button.config(state=tk.NORMAL)
            self.stop_button.config(state=tk.DISABLED)
            self.log_message("\nOperation finished.")
    
    def log_message(self, message):
        def _log():
            self.log_text.config(state=tk.NORMAL)
            self.log_text.insert(tk.END, message + "\n")
            self.log_text.see(tk.END)
            self.log_text.config(state=tk.DISABLED)
        self.parent.after(0, _log)
    
    def clear_log(self):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state=tk.DISABLED)