import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import threading
import os
import subprocess
from .manager import FilebinManager
import qrcode
from PIL import Image, ImageTk

class FilebinUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("Temp Sharing Service (Filebin)")
        self.parent.geometry("800x700")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.manager = FilebinManager(config_manager)
        self.is_processing = False
        
        self.create_widgets()
        self.load_config_to_ui()

    def on_back(self):
        if self.is_processing:
            if not messagebox.askyesno("Task Running", "A task is currently running. Do you really want to go back and cancel it?"):
                return
        self.original_switch_callback()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        if self.switch_to_main_callback:
             self.original_switch_callback = self.switch_to_main_callback
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.on_back)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="Temp Sharing Service", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        dashboard_tab = ttk.Frame(notebook)
        notebook.add(dashboard_tab, text="Dashboard")
        self.create_dashboard_tab(dashboard_tab)
        
        bins_tab = ttk.Frame(notebook)
        notebook.add(bins_tab, text="Saved Bins")
        self.create_bins_tab(bins_tab)
        
        self.notebook = notebook

    def create_dashboard_tab(self, parent):
        content_frame = ttk.Frame(parent, padding="10")
        content_frame.pack(fill=tk.BOTH, expand=True)

        # Paths Section
        paths_frame = ttk.LabelFrame(content_frame, text="Paths & Settings", padding="15")
        paths_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Upload Path
        ttk.Label(paths_frame, text="Upload Path:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.upload_path_var = tk.StringVar()
        ttk.Entry(paths_frame, textvariable=self.upload_path_var, width=50).grid(row=0, column=1, sticky=tk.EW, pady=5, padx=5)
        btn_frame_up = ttk.Frame(paths_frame)
        btn_frame_up.grid(row=0, column=2, pady=5, padx=5)
        ttk.Button(btn_frame_up, text="File", width=6, command=self.browse_upload_file).pack(side=tk.LEFT, padx=1)
        ttk.Button(btn_frame_up, text="Folder", width=6, command=self.browse_upload_folder).pack(side=tk.LEFT, padx=1)
        
        # Download Path
        ttk.Label(paths_frame, text="Download Path:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.download_path_var = tk.StringVar()
        ttk.Entry(paths_frame, textvariable=self.download_path_var, width=50).grid(row=1, column=1, sticky=tk.EW, pady=5, padx=5)
        ttk.Button(paths_frame, text="Browse", command=self.browse_download_folder).grid(row=1, column=2, pady=5, padx=5)
        
        paths_frame.columnconfigure(1, weight=1)
        
        # Preferences
        self.auto_copy_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(paths_frame, text="Auto Copy Links to Clipboard", variable=self.auto_copy_var).grid(row=2, column=0, columnspan=3, sticky=tk.W, pady=(10, 0))

        # Actions Section
        actions_frame = ttk.LabelFrame(content_frame, text="Actions", padding="15")
        actions_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(actions_frame, text="Upload to New Bin", command=self.upload_new, style="Accent.TButton").pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_frame, text="Upload to Saved Bin...", command=self.upload_to_saved).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_frame, text="Download Files...", command=self.download_files_ui).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_frame, text="Delete Files...", command=self.delete_files_ui).pack(side=tk.LEFT, padx=5)
        
        # Log Section
        log_frame = ttk.LabelFrame(content_frame, text="Log", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = tk.Text(log_frame, state=tk.DISABLED, wrap=tk.WORD, height=10, bg="#1e1e1e", fg="#f0f0f0", font=("Consolas", 9))
        scrollbar = ttk.Scrollbar(log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        ttk.Button(log_frame, text="Clear Log", command=self.clear_log).pack(pady=(5, 0))

    def create_bins_tab(self, parent):
        content_frame = ttk.Frame(parent, padding="10")
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        columns = ("name", "bin_id", "files_count", "type")
        self.bins_tree = ttk.Treeview(content_frame, columns=columns, show="headings")
        self.bins_tree.heading("name", text="Name")
        self.bins_tree.heading("bin_id", text="Bin ID")
        self.bins_tree.heading("files_count", text="Files")
        self.bins_tree.heading("type", text="Type")
        
        self.bins_tree.column("name", width=150)
        self.bins_tree.column("bin_id", width=150)
        self.bins_tree.column("files_count", width=50)
        self.bins_tree.column("type", width=80)
        
        self.bins_tree.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        self.bins_tree.bind("<Double-1>", self.on_bin_double_click)
        
        btn_frame = ttk.Frame(content_frame)
        btn_frame.pack(fill=tk.X)
        
        ttk.Button(btn_frame, text="Refresh List", command=self.refresh_bins_list).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Copy Link", command=self.copy_selected_bin_link).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Delete Bin", command=self.delete_selected_bin).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Download All Files", command=self.download_selected_bin).pack(side=tk.LEFT, padx=5)
        ttk.Button(btn_frame, text="Generate QR", command=self.generate_qr_code_ui).pack(side=tk.LEFT, padx=5)

    def browse_upload_file(self):
        path = filedialog.askopenfilename()
        if path: self.upload_path_var.set(path)

    def browse_upload_folder(self):
        path = filedialog.askdirectory()
        if path: self.upload_path_var.set(path)

    def browse_download_folder(self):
        path = filedialog.askdirectory()
        if path: self.download_path_var.set(path)
        
    def load_config_to_ui(self):
        config = self.manager.config
        prefs = config.get("preferences", {})
        self.download_path_var.set(prefs.get("default_download_path", ""))
        self.upload_path_var.set(prefs.get("upload_path", ""))
        self.auto_copy_var.set(prefs.get("auto_copy_links", True))
        self.refresh_bins_list()

    def save_current_config(self):
        self.manager.config["preferences"]["default_download_path"] = self.download_path_var.get()
        self.manager.config["preferences"]["upload_path"] = self.upload_path_var.get()
        self.manager.config["preferences"]["auto_copy_links"] = self.auto_copy_var.get()
        self.manager.save_config()

    def log(self, message):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.insert(tk.END, message + "\n")
        self.log_text.see(tk.END)
        self.log_text.config(state=tk.DISABLED)
        self.parent.update_idletasks()
        
    def clear_log(self):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state=tk.DISABLED)

    def copy_to_clipboard(self, text):
        self.parent.clipboard_clear()
        self.parent.clipboard_append(text)
        self.parent.update()
        
    def refresh_bins_list(self):
        for item in self.bins_tree.get_children():
            self.bins_tree.delete(item)
        
        saved_bins = self.manager.config.get("saved_bins", {})
        for name, info in saved_bins.items():
            files_count = len(info.get("files", []))
            self.bins_tree.insert("", tk.END, values=(name, info.get("actual_name"), files_count, info.get("type")))

    def upload_new(self):
        path = self.upload_path_var.get()
        if not path:
            messagebox.showwarning("Missing Path", "Please select a file or folder to upload.")
            return
        
        self.save_current_config()
        
        # Ask for a name if user wants to save it
        save_it = messagebox.askyesno("Save Bin", "Do you want to save this bin for later use?")
        friendly_name = None
        if save_it:
            friendly_name = simpledialog.askstring("Bin Name", "Enter a friendly name for this bin:")
            if not friendly_name:
                return # Cancelled
            if friendly_name in self.manager.config.get("saved_bins", {}):
                if not messagebox.askyesno("Overwrite", "Bin name already exists. Overwrite?"):
                    return
        
        bin_name = self.manager.generate_random_bin_name()
        self.start_upload_thread(path, bin_name, friendly_name)

    def upload_to_saved(self):
        path = self.upload_path_var.get()
        if not path:
            messagebox.showwarning("Missing Path", "Please select a file or folder to upload.")
            return
            
        saved_bins = self.manager.config.get("saved_bins", {})
        if not saved_bins:
            messagebox.showinfo("No Saved Bins", "No saved bins found.")
            return
            
        # Simple selection dialog could be better, but we'll use a list here or just ask for name
        names = list(saved_bins.keys())
        # Ideally we'd show a selection window, but for simplicity let's use the Treeview if something is selected there?
        # Or just ask user to select from tab
        
        selected_item = self.bins_tree.selection()
        if not selected_item:
            messagebox.showinfo("Select Bin", "Please switch to 'Saved Bins' tab and select a bin, then click 'Upload to Saved Bin' again, or just select it now if visible.")
            self.notebook.select(1)
            return
            
        item = self.bins_tree.item(selected_item[0])
        friendly_name = item['values'][0]
        actual_name = saved_bins[friendly_name]["actual_name"]
        
        self.save_current_config()
        self.start_upload_thread(path, actual_name, friendly_name, is_new=False)

    def start_upload_thread(self, path, bin_name, friendly_name, is_new=True):
        self.is_processing = True
        threading.Thread(target=self._upload_process, args=(path, bin_name, friendly_name, is_new), daemon=True).start()

    def _upload_process(self, path, bin_name, friendly_name, is_new):
        self.log(f"Starting upload to bin: {bin_name}")
        
        success = False
        uploaded_files = []
        
        if os.path.isdir(path):
            self.log("Uploading directory...")
            # We'll just upload individual files for now as per logic, or zip?
            # Let's ask user? No, UI should probably default or have a setting.
            # The CLI had a prompt. Let's defaults to individual files for now to be safe, or just zip.
            # Let's default to individual files to match 'upload_files_to_bin' usage in CLI logic mostly
            
            # Check file count
            files = self.manager.get_all_files_in_directory(path)
            if len(files) > 10:
                self.log(f"Directory contains {len(files)} files. Zipping might be better but uploading individually for now.")
            
            count, uploaded = self.manager.upload_files_to_bin(files, bin_name)
            success = count > 0
            uploaded_files = uploaded
        else:
            self.log(f"Uploading file: {os.path.basename(path)}")
            s, res = self.manager.upload_file(path, bin_name)
            if s:
                success = True
                uploaded_files = [os.path.basename(path)]
            else:
                self.log(f"Error: {res}")
        
        if success:
            link = self.manager.get_direct_link(bin_name)
            self.log(f"Upload successful! Link: {link}")
            
            if self.auto_copy_var.get():
                self.parent.after(0, lambda: self.copy_to_clipboard(link))
                self.log("Link copied to clipboard.")
            
            if friendly_name:
                if is_new:
                    self.manager.config.setdefault("saved_bins", {})
                    self.manager.config["saved_bins"][friendly_name] = {
                        "actual_name": bin_name,
                        "link": link,
                        "type": "important",
                        "files": uploaded_files
                    }
                    self.manager.config.setdefault("bin_mapping", {})
                    self.manager.config["bin_mapping"][friendly_name] = bin_name
                else:
                    # Update existing
                    current_files = set(self.manager.config["saved_bins"][friendly_name]["files"])
                    current_files.update(uploaded_files)
                    self.manager.config["saved_bins"][friendly_name]["files"] = list(current_files)
                
                self.manager.save_config()
                self.parent.after(0, self.refresh_bins_list)
        else:
            self.log("Upload failed.")
        self.is_processing = False

    def copy_selected_bin_link(self):
        selected_item = self.bins_tree.selection()
        if not selected_item: return
        friendly_name = self.bins_tree.item(selected_item[0])['values'][0]
        saved_bins = self.manager.config.get("saved_bins", {})
        link = saved_bins[friendly_name]["link"]
        self.copy_to_clipboard(link)
        self.log(f"Copied link for {friendly_name}")

    def delete_selected_bin(self):
        selected_item = self.bins_tree.selection()
        if not selected_item: return
        friendly_name = self.bins_tree.item(selected_item[0])['values'][0]
        
        if messagebox.askyesno("Delete", f"Are you sure you want to delete bin '{friendly_name}'? (Both Local and Online)"):
            actual_name = self.manager.config["saved_bins"][friendly_name]["actual_name"]
            
            # Delete online
            if self.manager.delete_bin(actual_name):
                self.log(f"Deleted online bin: {friendly_name}")
            else:
                self.log(f"Failed to delete online bin or already deleted: {friendly_name}")
                if not messagebox.askyesno("Error", "Failed to delete online bin (or connection error). Delete from local list anyway?"):
                    return

            del self.manager.config["saved_bins"][friendly_name]
            # Clean mapping if exists
            if friendly_name in self.manager.config.get("bin_mapping", {}):
                del self.manager.config["bin_mapping"][friendly_name]
            self.manager.save_config()
            self.refresh_bins_list()
            self.log(f"Deleted local record of {friendly_name}")

    def download_selected_bin(self):
        selected_item = self.bins_tree.selection()
        if not selected_item: return
        friendly_name = self.bins_tree.item(selected_item[0])['values'][0]
        actual_name = self.manager.config["saved_bins"][friendly_name]["actual_name"]
        
        save_path = self.download_path_var.get()
        if not save_path:
             messagebox.showwarning("Missing Path", "Please set a Download Path first.")
             return

        self.is_processing = True
        threading.Thread(target=self._download_archive_process, args=(actual_name, save_path, friendly_name), daemon=True).start()

    def _download_archive_process(self, bin_id, save_dir, friendly_name=None):
        self.log(f"Downloading archive for bin: {bin_id}...")
        
        # We download as zip
        response = self.manager.get_bin_archive(bin_id, 'zip')
        
        if response:
            filename = f"{friendly_name or bin_id}_archive.zip"
            full_path = os.path.join(save_dir, filename)
            
            try:
                with open(full_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                self.log(f"Download complete: {full_path}")
            except Exception as e:
                self.log(f"Error writing file: {e}")
        else:
            self.log("Failed to download archive. Bin might be expired or empty.")
        self.is_processing = False

    def download_files_ui(self):
        """Open UI to download files from saved bins"""
        self.open_bin_selector_window("download")

    def delete_files_ui(self):
        """Open UI to delete files from saved bins"""
        self.open_bin_selector_window("delete")

    def open_bin_selector_window(self, action_type):
        """
        Generic window for selecting a bin -> selecting files -> performing action
        action_type: 'download' or 'delete'
        """
        saved_bins = self.manager.config.get("saved_bins", {})
        if not saved_bins:
            messagebox.showinfo("No Saved Bins", "No saved bins found.")
            return

        window = tk.Toplevel(self.parent)
        title = "Download Files" if action_type == "download" else "Delete Files"
        window.title(title)
        window.geometry("750x550")
        window.configure(bg=self.bg_color)
        
        # Use a Grid layout instead of PanedWindow for better stability
        window.columnconfigure(0, weight=1) # Left panel (Bins) - 1/3
        window.columnconfigure(1, weight=2) # Right panel (Files) - 2/3
        window.rowconfigure(0, weight=1)    # Main content
        
        # -- Left Panel: Bins --
        left_frame = ttk.Frame(window, padding=10)
        left_frame.grid(row=0, column=0, sticky="nsew")
        
        ttk.Label(left_frame, text=f"1. Select Bin ({len(saved_bins)} found):", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(0,5))
        
        # Explicit colors for visibility
        bins_listbox = tk.Listbox(left_frame, exportselection=False, bg="white", fg="black", selectbackground="#4a90e2", selectforeground="white")
        bins_listbox.pack(fill=tk.BOTH, expand=True)
        
        bin_names = list(saved_bins.keys())
        for name in bin_names:
            bins_listbox.insert(tk.END, str(name))
            
        # -- Right Panel: Files --
        right_frame = ttk.Frame(window, padding=10)
        right_frame.grid(row=0, column=1, sticky="nsew")
        
        ttk.Label(right_frame, text="2. Select Files:", font=("Arial", 10, "bold")).pack(anchor=tk.W, pady=(0,5))
        
        # Scrollable frame for checkboxes
        files_canvas = tk.Canvas(right_frame, bg="white")
        scrollbar = ttk.Scrollbar(right_frame, orient="vertical", command=files_canvas.yview)
        files_scroll_frame = ttk.Frame(files_canvas)
        
        files_scroll_frame.bind(
            "<Configure>",
            lambda e: files_canvas.configure(scrollregion=files_canvas.bbox("all"))
        )
        
        canvas_window = files_canvas.create_window((0, 0), window=files_scroll_frame, anchor="nw")
        
        # Ensure scroll frame expands to canvas width
        def configure_scroll_frame(event):
            files_canvas.itemconfig(canvas_window, width=event.width)
        files_canvas.bind('<Configure>', configure_scroll_frame)
        
        files_canvas.configure(yscrollcommand=scrollbar.set)
        
        files_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # State
        current_bin_var = tk.StringVar()
        file_vars = {} # map filename -> BooleanVar
        
        def on_bin_select(event):
            selection = bins_listbox.curselection()
            if not selection: return
            
            friendly_name = bins_listbox.get(selection[0])
            current_bin_var.set(friendly_name)
            
            # Clear old checkboxes
            for widget in files_scroll_frame.winfo_children():
                widget.destroy()
            file_vars.clear()
            
            # Load files
            files = saved_bins[friendly_name].get("files", [])
            if not files:
                ttk.Label(files_scroll_frame, text="No files recorded in this bin.").pack(anchor=tk.W, padx=5, pady=2)
                return
                
            for f in files:
                var = tk.BooleanVar()
                chk = ttk.Checkbutton(files_scroll_frame, text=f, variable=var)
                chk.pack(anchor=tk.W, padx=5, pady=2)
                file_vars[f] = var

        bins_listbox.bind("<<ListboxSelect>>", on_bin_select)
        
        # -- Bottom: Action --
        bottom_frame = ttk.Frame(window, padding=10)
        bottom_frame.grid(row=1, column=0, columnspan=2, sticky="ew")
        
        # Select All / None helpers
        def select_all(state):
            for v in file_vars.values():
                v.set(state)
        
        link_frame = ttk.Frame(bottom_frame)
        link_frame.pack(side=tk.LEFT)
        ttk.Button(link_frame, text="Select All", command=lambda: select_all(True), width=10).pack(side=tk.LEFT, padx=(0,5))
        ttk.Button(link_frame, text="Select None", command=lambda: select_all(False), width=10).pack(side=tk.LEFT)
        
        def execute_action():
            friendly_name = current_bin_var.get()
            if not friendly_name:
                messagebox.showwarning("Warning", "Please select a bin first.")
                return
                
            selected_files = [f for f, v in file_vars.items() if v.get()]
            if not selected_files:
                messagebox.showwarning("Warning", "No files selected.")
                return
            
            actual_name = saved_bins[friendly_name]["actual_name"]
            
            if action_type == "download":
                save_path = self.download_path_var.get()
                if not save_path:
                    messagebox.showwarning("Warning", "Please ensure Download Path is set in Dashboard.")
                    return
                
                window.destroy()
                self.start_bulk_download(actual_name, selected_files, save_path)
                
            elif action_type == "delete":
                if messagebox.askyesno("Confirm Delete", f"Delete {len(selected_files)} files from '{friendly_name}'?"):
                    window.destroy()
                    self.start_bulk_delete(friendly_name, actual_name, selected_files)

        btn_text = "Download Selected" if action_type == "download" else "Delete Selected"
        btn_style = "Accent.TButton" if action_type == "download" else "Regular.TButton" 
        
        ttk.Button(bottom_frame, text=btn_text, style=btn_style, command=execute_action).pack(side=tk.RIGHT)

    def on_bin_double_click(self, event):
        item_id = self.bins_tree.identify_row(event.y)
        if not item_id: return
        
        friendly_name = self.bins_tree.item(item_id)['values'][0]
        self.open_bin_details_window(friendly_name)

    def open_bin_details_window(self, friendly_name):
        saved_bins = self.manager.config.get("saved_bins", {})
        if friendly_name not in saved_bins: return
        
        bin_info = saved_bins[friendly_name]
        actual_name = bin_info["actual_name"]
        files = bin_info.get("files", [])
        
        window = tk.Toplevel(self.parent)
        window.title(f"Bin Content: {friendly_name}")
        window.geometry("600x400")
        window.configure(bg=self.bg_color)
        
        header_frame = ttk.Frame(window, padding=10)
        header_frame.pack(fill=tk.X)
        ttk.Label(header_frame, text=f"Bin: {friendly_name}", font=("Arial", 12, "bold")).pack(side=tk.LEFT)
        ttk.Label(header_frame, text=f"({actual_name})").pack(side=tk.LEFT, padx=10)
        
        content_frame = ttk.Frame(window, padding=10)
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        # Scrollable list
        canvas = tk.Canvas(content_frame, bg="white")
        scrollbar = ttk.Scrollbar(content_frame, orient="vertical", command=canvas.yview)
        scroll_frame = ttk.Frame(canvas)
        
        scroll_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scroll_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        if not files:
            ttk.Label(scroll_frame, text="No files in this bin.").pack(padding=10)
            return
            
        for f in files:
            row_frame = ttk.Frame(scroll_frame)
            row_frame.pack(fill=tk.X, pady=2, padx=5)
            
            ttk.Label(row_frame, text=f, width=40).pack(side=tk.LEFT)
            
            # Action Buttons
            
            # Download
            # Need to capture 'f' in lambda default arg
            dl_cmd = lambda f=f: self.start_single_download(actual_name, f)
            ttk.Button(row_frame, text="Download", command=dl_cmd, width=10).pack(side=tk.LEFT, padx=5)
            
            # Copy Link
            copy_cmd = lambda f=f: self.copy_file_link(actual_name, f)
            ttk.Button(row_frame, text="Copy Link", command=copy_cmd, width=10).pack(side=tk.LEFT, padx=5)

    def start_bulk_download(self, bin_name, filenames, save_path):
        self.is_processing = True
        threading.Thread(target=self._bulk_download_process, args=(bin_name, filenames, save_path), daemon=True).start()

    def _bulk_download_process(self, bin_name, filenames, save_path):
        self.log(f"Starting bulk download of {len(filenames)} files...")
        success_count = 0
        for fname in filenames:
            full_save_path = os.path.join(save_path, fname)
            self.log(f"Downloading {fname}...")
            if self.manager.download_file(bin_name, fname, full_save_path):
                success_count += 1
            else:
                self.log(f"Failed to download {fname}")
        
        self.log(f"Bulk download finished. {success_count}/{len(filenames)} successful.")
        self.is_processing = False

    def start_single_download(self, bin_name, filename):
        save_path_root = self.download_path_var.get()
        if not save_path_root:
            messagebox.showwarning("Warning", "Download path not set in Dashboard.")
            return
        
        full_path = os.path.join(save_path_root, filename)
        self.is_processing = True
        threading.Thread(target=self._single_download_process, args=(bin_name, filename, full_path), daemon=True).start()
        
    def _single_download_process(self, bin_name, filename, full_path):
        self.log(f"Downloading {filename}...")
        if self.manager.download_file(bin_name, filename, full_path):
            self.log(f"Successfully downloaded {filename}")
        else:
            self.log(f"Failed to download {filename}")
        self.is_processing = False

    def copy_file_link(self, bin_name, filename):
        link = self.manager.get_direct_link(bin_name, filename)
        self.copy_to_clipboard(link)
        self.log(f"Copied link for {filename}")

    def start_bulk_delete(self, friendly_name, bin_name, filenames):
        self.is_processing = True
        threading.Thread(target=self._bulk_delete_process, args=(friendly_name, bin_name, filenames), daemon=True).start()

    def _bulk_delete_process(self, friendly_name, bin_name, filenames):
        self.log(f"Deleting {len(filenames)} files from {friendly_name}...")
        deleted_count = 0
        
        for fname in filenames:
            if self.manager.delete_file(bin_name, fname):
                deleted_count += 1
                # Update local config
                if friendly_name in self.manager.config["saved_bins"]:
                    if fname in self.manager.config["saved_bins"][friendly_name]["files"]:
                        self.manager.config["saved_bins"][friendly_name]["files"].remove(fname)
            else:
                self.log(f"Failed to delete {fname}")
        
        self.manager.save_config()
        
        
        # Scheduled UI update
        self.parent.after(0, self.refresh_bins_list)
        self.log(f"Deleted {deleted_count} files.")
        self.is_processing = False

    def generate_qr_code_ui(self):
        selected_item = self.bins_tree.selection()
        if not selected_item: return
        friendly_name = self.bins_tree.item(selected_item[0])['values'][0]
        saved_bins = self.manager.config.get("saved_bins", {})
        link = saved_bins[friendly_name]["link"]

        # Generate QR
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(link)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        # UI
        window = tk.Toplevel(self.parent)
        window.title(f"QR Code: {friendly_name}")
        window.geometry("400x500")
        window.configure(bg=self.bg_color)
        
        # Convert to PhotoImage
        self.qr_photo = ImageTk.PhotoImage(img) # Keep reference
        
        lbl = ttk.Label(window, image=self.qr_photo)
        lbl.pack(pady=20)
        
        btn_frame = ttk.Frame(window)
        btn_frame.pack(fill=tk.X, pady=10)
        
        def save_qr():
            save_path = filedialog.asksaveasfilename(defaultextension=".png", filetypes=[("PNG", "*.png")])
            if save_path:
                img.save(save_path)
                messagebox.showinfo("Saved", f"QR Code saved to {save_path}")
                
        ttk.Button(btn_frame, text="Download / Save Image", command=save_qr).pack()
