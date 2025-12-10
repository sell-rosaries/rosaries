import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import threading
import os
import json
from .manager import NanoBananaManager
from .config.models import MODELS, ASPECT_RATIOS

class NanoBananaUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("Nano Banana Pro")
        self.parent.geometry("900x750")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.manager = NanoBananaManager(self.parent, config_manager)
        self.is_processing = False
        
        # Data vars
        self.reference_images = [] # List of dicts {path, name}
        
        self.create_widgets()
        self.load_current_profile_to_ui()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.switch_to_main_callback)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Nano Banana Pro", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        # Tabs
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        
        tab_main = ttk.Frame(notebook, padding=15); notebook.add(tab_main, text="Main")
        tab_refs = ttk.Frame(notebook, padding=15); notebook.add(tab_refs, text="References")
        tab_adv = ttk.Frame(notebook, padding=15); notebook.add(tab_adv, text="Advanced")
        tab_log = ttk.Frame(notebook, padding=15); notebook.add(tab_log, text="Log")
        self.notebook = notebook
        
        self.setup_main_tab(tab_main)
        self.setup_refs_tab(tab_refs)
        self.setup_adv_tab(tab_adv)
        self.setup_log_tab(tab_log)
        
        # Footer Actions
        action_frame = ttk.Frame(main_frame, padding=(0, 10, 0, 0))
        action_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        self.btn_run = ttk.Button(action_frame, text="Start Processing", command=self.start_processing)
        self.btn_run.pack(side=tk.RIGHT, padx=5)
        
        self.btn_stop = ttk.Button(action_frame, text="Stop", command=self.stop_processing, state=tk.DISABLED)
        self.btn_stop.pack(side=tk.RIGHT, padx=5)

    def setup_main_tab(self, parent):
        # API Key
        ttk.Label(parent, text="API Key:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.var_api_key = tk.StringVar()
        ttk.Entry(parent, textvariable=self.var_api_key, show="*", width=50).grid(row=0, column=1, columnspan=2, sticky=tk.EW, pady=5)
        
        # Model
        ttk.Label(parent, text="Model:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.var_model = tk.StringVar()
        model_names = list(MODELS.keys())
        self.cb_model = ttk.Combobox(parent, textvariable=self.var_model, values=model_names, state="readonly")
        self.cb_model.grid(row=1, column=1, columnspan=2, sticky=tk.EW, pady=5)
        self.cb_model.bind("<<ComboboxSelected>>", self.on_model_change)
        
        # Input Path (Folder or File)
        ttk.Label(parent, text="Input Path:").grid(row=2, column=0, sticky=tk.W, pady=5)
        self.var_input_path = tk.StringVar()
        ttk.Entry(parent, textvariable=self.var_input_path, width=50).grid(row=2, column=1, sticky=tk.EW, pady=5)
        
        btn_box = ttk.Frame(parent)
        btn_box.grid(row=2, column=2, padx=5, pady=5)
        ttk.Button(btn_box, text="File", command=self.browse_file).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_box, text="Folder", command=self.browse_folder).pack(side=tk.LEFT, padx=2)
        
        # Prompt
        ttk.Label(parent, text="Prompt:").grid(row=3, column=0, sticky=tk.NW, pady=5)
        self.txt_prompt = tk.Text(parent, height=5, width=50, font=("Arial", 10))
        self.txt_prompt.grid(row=3, column=1, columnspan=2, sticky=tk.EW, pady=5)
        
        # Resolution
        ttk.Label(parent, text="Resolution:").grid(row=4, column=0, sticky=tk.W, pady=5)
        self.var_res = tk.StringVar()
        self.cb_res = ttk.Combobox(parent, textvariable=self.var_res, state="readonly")
        self.cb_res.grid(row=4, column=1, sticky=tk.W, pady=5)
        
        # Aspect Ratio
        ttk.Label(parent, text="Aspect Ratio:").grid(row=5, column=0, sticky=tk.W, pady=5)
        self.var_ratio = tk.StringVar()
        self.cb_ratio = ttk.Combobox(parent, textvariable=self.var_ratio, state="readonly")
        self.cb_ratio.grid(row=5, column=1, sticky=tk.W, pady=5)
        
        # Populate initial values
        self.update_resolution_options()
        self.update_ratio_options()
        
        parent.columnconfigure(1, weight=1)

    def setup_refs_tab(self, parent):
        self.lst_refs = tk.Listbox(parent, height=10)
        self.lst_refs.pack(fill=tk.BOTH, expand=True, pady=5)
        
        btn_frame = ttk.Frame(parent)
        btn_frame.pack(fill=tk.X, pady=5)
        ttk.Button(btn_frame, text="Add Image", command=self.add_ref).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Remove Selected", command=self.remove_ref).pack(side=tk.LEFT, padx=5)
        ttk.Label(parent, text="Note: Reference images are used for style/content context.").pack(pady=5)

    def setup_adv_tab(self, parent):
        # Grounding
        self.var_grounding = tk.BooleanVar(value=False)
        self.chk_grounding = ttk.Checkbutton(parent, text="Enable Google Search Grounding", variable=self.var_grounding)
        self.chk_grounding.pack(anchor=tk.W, pady=5)
        
        # Output Format
        ttk.Label(parent, text="Output Format:").pack(anchor=tk.W, pady=(10,0))
        self.var_format = tk.StringVar(value="png")
        ttk.Combobox(parent, textvariable=self.var_format, values=["png", "jpg", "webp"], state="readonly", width=10).pack(anchor=tk.W, pady=5)
        
        # Parallel Processing
        ttk.Label(parent, text="Parallel Processing (Images at once):").pack(anchor=tk.W, pady=(10,0))
        self.var_workers = tk.StringVar(value="1")
        workers_cb = ttk.Combobox(parent, textvariable=self.var_workers, values=["1", "2", "3", "4", "5"], state="readonly", width=5)
        workers_cb.pack(anchor=tk.W, pady=5)
        ttk.Label(parent, text="(Note: Higher values are faster but may hit API rate limits)", font=("Arial", 8)).pack(anchor=tk.W)

        # Configuration Management
        ttk.Label(parent, text="Configuration Profiles:").pack(anchor=tk.W, pady=(20,5))
        cfg_frame = ttk.Frame(parent)
        cfg_frame.pack(fill=tk.X)
        
        ttk.Button(cfg_frame, text="Save As...", command=self.save_config_as).pack(side=tk.LEFT, padx=5)
        ttk.Button(cfg_frame, text="Load Profile", command=self.open_load_dialog).pack(side=tk.LEFT, padx=5)
        ttk.Button(cfg_frame, text="Delete Profile", command=self.open_delete_dialog).pack(side=tk.LEFT, padx=5)
        
        self.lbl_current_profile = ttk.Label(parent, text="Current: Default", font=("Arial", 9, "italic"))
        self.lbl_current_profile.pack(anchor=tk.W, padx=5, pady=5)

    def setup_log_tab(self, parent):
        self.txt_log = tk.Text(parent, state=tk.DISABLED, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        self.txt_log.pack(fill=tk.BOTH, expand=True)

    # --- Logic ---

    def update_resolution_options(self):
        model = self.var_model.get()
        if "flash" in model:
            values = ["1024x1024 (1K)", "Custom"]
            if self.var_res.get() and "4096" in self.var_res.get():
                self.var_res.set("1024x1024 (1K)")
        else:
            values = ["1024x1024 (1K)", "2048x2048 (2K)", "4096x4096 (4K)", "Custom"]
        self.cb_res.config(values=values)
        if not self.var_res.get(): self.cb_res.current(0)

    def update_ratio_options(self):
        # Descriptive options
        options = [
            "1:1 (Square)", "16:9 (Widescreen)", "9:16 (Vertical)", 
            "4:3 (Standard)", "3:2 (Photo)", "21:9 (Ultra-wide)"
        ]
        self.cb_ratio.config(values=options)
        if not self.var_ratio.get(): self.cb_ratio.current(0)

    def on_model_change(self, event=None):
        model = self.var_model.get()
        
        # Grounding check
        if "gemini_3_pro" in model:
            self.chk_grounding.config(state=tk.NORMAL)
        else:
            self.var_grounding.set(False)
            self.chk_grounding.config(state=tk.DISABLED)
                
        self.update_resolution_options()

    def browse_folder(self):
        path = filedialog.askdirectory()
        if path: self.var_input_path.set(path)

    def browse_file(self):
        path = filedialog.askopenfilename(filetypes=[("Images", "*.png *.jpg *.jpeg *.webp *.bmp")])
        if path: self.var_input_path.set(path)

    def add_ref(self):
        paths = filedialog.askopenfilenames(filetypes=[("Images", "*.png *.jpg *.jpeg *.webp")])
        if paths:
            for p in paths:
                self.reference_images.append({'path': p, 'name': os.path.basename(p)})
                self.lst_refs.insert(tk.END, os.path.basename(p))

    def remove_ref(self):
        sel = self.lst_refs.curselection()
        if sel:
            idx = sel[0]
            self.lst_refs.delete(idx)
            del self.reference_images[idx]

    def log(self, msg):
        self.txt_log.config(state=tk.NORMAL)
        self.txt_log.insert(tk.END, msg + "\n")
        self.txt_log.see(tk.END)
        self.txt_log.config(state=tk.DISABLED)

    # --- Configuration ---
    def get_ui_config(self):
        return {
            'api_key': self.var_api_key.get(),
            'model': self.var_model.get(),
            'input_path': self.var_input_path.get(),
            'prompt': self.txt_prompt.get("1.0", tk.END).strip(),
            'resolution': self.var_res.get(),
            'aspect_ratio': self.var_ratio.get(),
            'grounding': self.var_grounding.get(),
            'format': self.var_format.get(),
            'max_workers': self.var_workers.get()
        }

    def set_ui_config(self, cfg):
        self.var_api_key.set(cfg.get('api_key', ''))
        self.var_model.set(cfg.get('model', 'gemini_3_pro'))
        self.var_input_path.set(cfg.get('input_path', ''))
        self.txt_prompt.delete("1.0", tk.END)
        self.txt_prompt.insert("1.0", cfg.get('prompt', ''))
        self.var_res.set(cfg.get('resolution', '1024x1024 (1K)'))
        self.var_ratio.set(cfg.get('aspect_ratio', '1:1 (Square)'))
        self.var_grounding.set(cfg.get('grounding', False))
        self.var_format.set(cfg.get('format', 'png'))
        self.var_workers.set(cfg.get('max_workers', '1'))
        self.on_model_change() # Update UI states

    def save_config_as(self):
        name = simpledialog.askstring("Save Profile", "Enter profile name:")
        if name:
            cfg = self.get_ui_config()
            if self.manager.save_profile(name, cfg):
                self.lbl_current_profile.config(text=f"Current: {name}")
                messagebox.showinfo("Success", f"Profile '{name}' saved.")

    def open_load_dialog(self):
        names = self.manager.get_profile_names()
        if not names:
            messagebox.showinfo("Info", "No saved profiles found.")
            return
            
        win = tk.Toplevel(self.parent)
        win.title("Load Profile")
        lb = tk.Listbox(win); lb.pack(fill=tk.BOTH, expand=True)
        for n in names: lb.insert(tk.END, n)
        
        def load():
            sel = lb.curselection()
            if sel:
                name = lb.get(sel[0])
                cfg = self.manager.load_profile(name)
                if cfg:
                    self.set_ui_config(cfg)
                    self.lbl_current_profile.config(text=f"Current: {name}")
                    win.destroy()
        ttk.Button(win, text="Load", command=load).pack()

    def open_delete_dialog(self):
        names = self.manager.get_profile_names()
        if not names: return
        
        win = tk.Toplevel(self.parent)
        win.title("Delete Profile")
        lb = tk.Listbox(win); lb.pack(fill=tk.BOTH, expand=True)
        for n in names: lb.insert(tk.END, n)
        
        def delete():
            sel = lb.curselection()
            if sel:
                name = lb.get(sel[0])
                if messagebox.askyesno("Confirm", f"Delete '{name}'?"):
                    self.manager.delete_profile(name)
                    self.lbl_current_profile.config(text=f"Current: {self.manager.current_profile_name}")
                    win.destroy()
        ttk.Button(win, text="Delete", command=delete).pack()

    def load_current_profile_to_ui(self):
        self.set_ui_config(self.manager.config)
        self.lbl_current_profile.config(text=f"Current: {self.manager.current_profile_name}")

    # --- Processing ---
    def start_processing(self):
        if self.is_processing: return
        cfg = self.get_ui_config()
        
        if not all([cfg['api_key'], cfg['input_path'], cfg['prompt']]):
            messagebox.showwarning("Missing Info", "Please provide API Key, Input Path, and Prompt.")
            return

        self.is_processing = True
        self.btn_run.config(state=tk.DISABLED)
        self.btn_stop.config(state=tk.NORMAL)
        self.notebook.select(3)
        self.txt_log.config(state=tk.NORMAL); self.txt_log.delete("1.0", tk.END); self.txt_log.config(state=tk.DISABLED)
        
        thread = threading.Thread(target=self.run_thread, args=(cfg,))
        thread.daemon = True
        thread.start()
        self.parent.after(100, lambda: self.check_thread(thread))

    def run_thread(self, cfg):
        self.manager.process_images(
            api_key=cfg['api_key'],
            prompt=cfg['prompt'],
            input_path=cfg['input_path'],
            model_id=cfg['model'],
            resolution=cfg['resolution'],
            aspect_ratio=cfg['aspect_ratio'],
            reference_images=self.reference_images,
            use_grounding=cfg['grounding'],
            output_format=cfg['format'],
            max_workers=int(cfg['max_workers']),
            log_callback=self.log
        )

    def stop_processing(self):
        self.manager.stop_process()
        self.log("Stopping...")

    def check_thread(self, thread):
        if thread.is_alive():
            self.parent.after(100, lambda: self.check_thread(thread))
        else:
            self.is_processing = False
            self.btn_run.config(state=tk.NORMAL)
            self.btn_stop.config(state=tk.DISABLED)
            self.log("Done.")
