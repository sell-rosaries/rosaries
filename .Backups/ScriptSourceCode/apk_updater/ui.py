import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import threading
import os
from .manager import APKUpdaterManager
import hashlib
from .syncer import SmartSyncer, SyncPoint, ChangeReport

class APKUpdaterUI:
    def __init__(self, parent, switch_to_main_callback, config_manager):
        self.parent = parent
        self.switch_to_main_callback = switch_to_main_callback
        self.parent.title("APK Updater")
        self.parent.geometry("900x700")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.bg_color = "#f0f0f0"
        self.parent.configure(bg=self.bg_color)
        
        self.config_manager = config_manager
        self.apk_manager = APKUpdaterManager(self.parent, config_manager)
        self.is_processing = False
        
        # Smart Sync state
        self.syncer = None
        self.current_report = None
        
        self.create_widgets()
        self.load_config_to_ui()
        
        # Bind close event
        self.parent.protocol("WM_DELETE_WINDOW", self.on_close)

    def on_close(self):
        """Handle window close event."""
        if self.is_processing:
            if not messagebox.askyesno("Process Running", 
                "An operation is currently in progress.\nAre you sure you want to exit?"):
                return
        
        # If running from main_app, we might need to notify it or just destroy
        # But since we're just a child UI, we probably just want to close
        # However, usually the X button closes the whole app or returns to main
        # Depending on how main_app manages this window.
        # Assuming we should revert to default behavior or destroy if confirmed
        self.parent.destroy()

    def on_back(self):
        """Handle back button click."""
        if self.is_processing:
            if not messagebox.askyesno("Process Running", 
                "An operation is currently in progress.\nAre you sure you want to go back?"):
                return
        self.switch_to_main_callback()

    def create_widgets(self):
        for widget in self.parent.winfo_children():
            widget.destroy()
            
        main_frame = ttk.Frame(self.parent, padding="15")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        title_frame = ttk.Frame(main_frame)
        title_frame.pack(fill=tk.X, pady=(0, 15))
        
        back_button = ttk.Button(title_frame, text="← Back", command=self.on_back)
        back_button.pack(side=tk.LEFT, padx=(0, 10))
        
        title_label = ttk.Label(title_frame, text="APK Updater", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True)
        self.style.configure("TNotebook", background=self.bg_color)
        self.style.configure("TNotebook.Tab", padding=[20, 10], font=("Arial", 11))
        
        # Create tabs
        config_tab = ttk.Frame(notebook)
        sync_tab = ttk.Frame(notebook)
        log_tab = ttk.Frame(notebook)
        
        notebook.add(config_tab, text="Configuration")
        notebook.add(sync_tab, text="Smart Sync")
        notebook.add(log_tab, text="Log")
        
        self.create_config_tab(config_tab)
        self.create_sync_tab(sync_tab)
        self.create_log_tab(log_tab)
        
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

    def create_sync_tab(self, parent):
        """Create the Smart Sync tab."""
        # Config frame
        config_frame = ttk.LabelFrame(parent, text="Directories", padding="10")
        config_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(config_frame, text="Website Directory:").grid(row=0, column=0, sticky=tk.W, pady=5)
        self.sync_website_dir_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.sync_website_dir_var, width=50).grid(row=0, column=1, sticky=tk.EW, pady=5, padx=5)
        ttk.Button(config_frame, text="Browse", command=self.browse_sync_website_dir).grid(row=0, column=2, pady=5)
        
        ttk.Label(config_frame, text="APK Directory:").grid(row=1, column=0, sticky=tk.W, pady=5)
        self.sync_apk_dir_var = tk.StringVar()
        ttk.Entry(config_frame, textvariable=self.sync_apk_dir_var, width=50).grid(row=1, column=1, sticky=tk.EW, pady=5, padx=5)
        ttk.Button(config_frame, text="Browse", command=self.browse_sync_apk_dir).grid(row=1, column=2, pady=5)
        
        config_frame.columnconfigure(1, weight=1)

        # Status frame
        status_frame = ttk.LabelFrame(parent, text="Sync Status", padding="10")
        status_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.sync_status_var = tk.StringVar(value="No sync point set. Set one when both projects are in sync.")
        ttk.Label(status_frame, textvariable=self.sync_status_var, font=("Arial", 10)).pack(anchor=tk.W)
        
        # Buttons frame
        buttons_frame = ttk.Frame(parent)
        buttons_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.sync_set_btn = ttk.Button(buttons_frame, text="🔒 Set Sync Point", command=self.set_sync_point)
        self.sync_set_btn.pack(side=tk.LEFT, padx=5)
        
        self.sync_detect_btn = ttk.Button(buttons_frame, text="🔍 Detect Changes", command=self.detect_changes)
        self.sync_detect_btn.pack(side=tk.LEFT, padx=5)
        
        self.sync_apply_btn = ttk.Button(buttons_frame, text="✅ Apply Safe Changes", command=self.apply_safe_changes, state=tk.DISABLED)
        self.sync_apply_btn.pack(side=tk.LEFT, padx=5)
        
        # Progress frame
        progress_frame = ttk.Frame(parent)
        progress_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.sync_progress_var = tk.StringVar(value="")
        ttk.Label(progress_frame, textvariable=self.sync_progress_var, font=("Arial", 9)).pack(side=tk.LEFT)
        
        self.sync_progressbar = ttk.Progressbar(progress_frame, mode='determinate', length=300)
        self.sync_progressbar.pack(side=tk.RIGHT, fill=tk.X, expand=True, padx=(10, 0))
        
        # Changes preview frame
        preview_frame = ttk.LabelFrame(parent, text="Changes Preview", padding="10")
        preview_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create scrollable text area
        self.sync_preview_text = tk.Text(
            preview_frame, 
            wrap=tk.WORD, 
            bg="#1e1e1e", 
            fg="#f0f0f0", 
            font=("Consolas", 9),
            state=tk.DISABLED
        )
        preview_scrollbar = ttk.Scrollbar(preview_frame, orient=tk.VERTICAL, command=self.sync_preview_text.yview)
        self.sync_preview_text.configure(yscrollcommand=preview_scrollbar.set)
        self.sync_preview_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        preview_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Configure text tags for colors
        self.sync_preview_text.tag_configure("safe", foreground="#4ade80")
        self.sync_preview_text.tag_configure("conflict", foreground="#f87171")
        self.sync_preview_text.tag_configure("preserved", foreground="#60a5fa")
        self.sync_preview_text.tag_configure("header", foreground="#fbbf24", font=("Consolas", 10, "bold"))
        
        # Load existing sync point status
        self._update_sync_status()

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

    def browse_sync_website_dir(self):
        path = filedialog.askdirectory(title="Select Website Directory (Smart Sync)")
        if path:
            self.sync_website_dir_var.set(path)

    def browse_sync_apk_dir(self):
        path = filedialog.askdirectory(title="Select APK Directory (Smart Sync)")
        if path:
            self.sync_apk_dir_var.set(path)

    def load_config_to_ui(self):
        config = self.apk_manager.config
        self.git_repo_var.set(config.get('git_repo_dir', ''))
        self.apk_dir_var.set(config.get('apk_dir', ''))
        
        # Load Smart Sync paths (last used)
        sync_config = config.get('smart_sync', {})
        self.sync_website_dir_var.set(sync_config.get('last_website_dir', config.get('git_repo_dir', '')))
        self.sync_apk_dir_var.set(sync_config.get('last_apk_dir', config.get('apk_dir', '')))
        
        # Add tracers to update status when paths change
        self.sync_website_dir_var.trace_add("write", self._update_sync_status)
        self.sync_apk_dir_var.trace_add("write", self._update_sync_status)
        
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
        self.notebook.select(2)  # Switch to log tab (index 2 now)
        
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

    # =========================================================================
    # Smart Sync Methods
    # =========================================================================
    
    def _get_project_key(self, website_dir: str, apk_dir: str) -> str:
        """Generate unique key for project pair."""
        raw = f"{os.path.normpath(website_dir)}|{os.path.normpath(apk_dir)}"
        return hashlib.md5(raw.encode()).hexdigest()

    def _get_syncer(self) -> SmartSyncer:
        """Get or create syncer instance."""
        git_repo = self.sync_website_dir_var.get()
        apk_dir = self.sync_apk_dir_var.get()
        
        # Save last used paths
        config = self.apk_manager.config
        if 'smart_sync' not in config:
            config['smart_sync'] = {}
        config['smart_sync']['last_website_dir'] = git_repo
        config['smart_sync']['last_apk_dir'] = apk_dir
        self.apk_manager.save_config(config)
        
        if not git_repo or not apk_dir:
            raise ValueError("Please set Website and APK directories in Smart Sync tab first.")
        
        apk_assets = os.path.join(apk_dir, "app", "src", "main", "assets")
        
        if not os.path.exists(git_repo):
            raise ValueError(f"Git repo directory does not exist: {git_repo}")
        if not os.path.exists(apk_assets):
            raise ValueError(f"APK assets directory does not exist: {apk_assets}")
        
        return SmartSyncer(git_repo, apk_assets)
    
    def _update_sync_status(self, *args):
        """Update sync point status display."""
        config = self.apk_manager.config
        
        web_dir = self.sync_website_dir_var.get()
        apk_dir = self.sync_apk_dir_var.get()
        
        if not web_dir or not apk_dir:
            self.sync_status_var.set("⚠️ Please select directories.")
            return

        project_key = self._get_project_key(web_dir, apk_dir)
        projects = config.get('smart_sync', {}).get('projects', {})
        project_data = projects.get(project_key, {})
        sync_point_data = project_data.get('sync_point', {})
        
        if sync_point_data.get('date'):
            date = sync_point_data['date']
            website_count = len(sync_point_data.get('website_hashes', {}))
            apk_count = len(sync_point_data.get('apk_hashes', {}))
            self.sync_status_var.set(f"✅ Sync point set: {date}\nWebsite files: {website_count} | APK files: {apk_count}")
        else:
            self.sync_status_var.set("⚠️ No sync point for these directories.")
    
    def _sync_progress_callback(self, message: str, progress: float):
        """Callback for sync progress updates."""
        self.sync_progress_var.set(message)
        self.sync_progressbar['value'] = progress * 100
        self.parent.update_idletasks()
    
    def _sync_log(self, message: str):
        """Log message to sync preview area."""
        self.sync_preview_text.config(state=tk.NORMAL)
        self.sync_preview_text.insert(tk.END, message + "\n")
        self.sync_preview_text.see(tk.END)
        self.sync_preview_text.config(state=tk.DISABLED)
        self.parent.update_idletasks()
    
    def _clear_sync_preview(self):
        """Clear the sync preview area."""
        self.sync_preview_text.config(state=tk.NORMAL)
        self.sync_preview_text.delete(1.0, tk.END)
        self.sync_preview_text.config(state=tk.DISABLED)
    
    def set_sync_point(self):
        """Set current state as sync point (baseline)."""
        if self.is_processing:
            messagebox.showinfo("Busy", "Another operation is in progress.")
            return
        
        try:
            syncer = self._get_syncer()
        except ValueError as e:
            messagebox.showerror("Error", str(e))
            return
        
        # Confirm with user
        if not messagebox.askyesno(
            "Set Sync Point",
            "This will save the current state of BOTH projects as baseline.\n\n"
            "Are both projects 100% in sync right now?"
        ):
            return
        
        self.is_processing = True
        self._clear_sync_preview()
        self._sync_log("Setting sync point...")
        
        def run():
            try:
                sync_point = syncer.set_sync_point(self._sync_progress_callback)
                
                # Save to updated config structure
                config = self.apk_manager.config
                if 'smart_sync' not in config: config['smart_sync'] = {}
                if 'projects' not in config['smart_sync']: config['smart_sync']['projects'] = {}
                
                web_dir = self.sync_website_dir_var.get()
                apk_dir = self.sync_apk_dir_var.get()
                project_key = self._get_project_key(web_dir, apk_dir)
                
                config['smart_sync']['projects'][project_key] = {
                    'website_path': web_dir,
                    'apk_path': apk_dir,
                    'sync_point': sync_point.to_dict()
                }
                
                self.apk_manager.save_config(config)
                
                self.parent.after(0, lambda: self._sync_log(
                    f"\n✅ Sync point saved for this project!"
                    f"\nWebsite files: {len(sync_point.website_hashes)}"
                    f"\nAPK files: {len(sync_point.apk_hashes)}"
                ))
                self.parent.after(0, self._update_sync_status)
                
            except Exception as e:
                self.parent.after(0, lambda: messagebox.showerror("Error", str(e)))
            finally:
                self.parent.after(0, lambda: setattr(self, 'is_processing', False))
        
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
    
    def detect_changes(self):
        """Detect changes since sync point."""
        if self.is_processing:
            messagebox.showinfo("Busy", "Another operation is in progress.")
            return
        
        # Get project specific sync point
        config = self.apk_manager.config
        if 'smart_sync' not in config: config['smart_sync'] = {}
        
        web_dir = self.sync_website_dir_var.get()
        apk_dir = self.sync_apk_dir_var.get()
        project_key = self._get_project_key(web_dir, apk_dir)
        
        project_data = config.get('smart_sync', {}).get('projects', {}).get(project_key, {})
        sync_data = project_data.get('sync_point', {})
        
        if not sync_data.get('date'):
            messagebox.showwarning("No Sync Point", "Please set a sync point for these specific directories first.")
            return
        
        try:
            syncer = self._get_syncer()
        except ValueError as e:
            messagebox.showerror("Error", str(e))
            return
        
        self.is_processing = True
        self._clear_sync_preview()
        self._sync_log("Detecting changes...")
        
        def run():
            try:
                sync_point = SyncPoint.from_dict(sync_data)
                report = syncer.detect_changes(sync_point, self._sync_progress_callback)
                
                self.current_report = report
                preview = syncer.generate_preview(report)
                
                self.parent.after(0, lambda: self._display_report(report, preview))
                
            except Exception as e:
                import traceback
                self.parent.after(0, lambda: self._sync_log(f"Error: {str(e)}\n{traceback.format_exc()}"))
            finally:
                self.parent.after(0, lambda: setattr(self, 'is_processing', False))
        
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
    
    def _display_report(self, report: ChangeReport, preview: str):
        """Display the change report in the preview area."""
        self._clear_sync_preview()
        self._sync_log(preview)
        
        # Enable/disable apply button
        if report.total_safe > 0:
            self.sync_apply_btn.config(state=tk.NORMAL)
            self._sync_log(f"\n{'='*60}")
            self._sync_log(f"Ready to apply {report.total_safe} safe changes.")
            self._sync_log(f"Click 'Apply Safe Changes' to proceed.")
        else:
            self.sync_apply_btn.config(state=tk.DISABLED)
            self._sync_log("\nNo safe changes to apply.")
    
    def apply_safe_changes(self):
        """Apply only safe (non-conflicting) changes."""
        if self.is_processing:
            messagebox.showinfo("Busy", "Another operation is in progress.")
            return
        
        if not self.current_report:
            messagebox.showwarning("No Changes", "Please detect changes first.")
            return
        
        report = self.current_report
        
        if report.total_safe == 0:
            messagebox.showinfo("No Changes", "No safe changes to apply.")
            return
        
        # Confirm
        if not messagebox.askyesno(
            "Apply Changes",
            f"Apply {report.total_safe} safe changes to APK?\n\n"
            f"• {len(report.new_folders)} new folders\n"
            f"• {len(report.new_files)} new files\n"
            f"• {len(report.safe_to_sync)} modified files\n\n"
            f"Conflicts and APK-only changes will NOT be touched."
        ):
            return
        
        try:
            syncer = self._get_syncer()
        except ValueError as e:
            messagebox.showerror("Error", str(e))
            return
        
        self.is_processing = True
        self._sync_log("\n" + "="*60)
        self._sync_log("Applying changes...")
        
        def run():
            try:
                results = syncer.apply_safe_changes(report, self._sync_progress_callback)
                
                # Show results
                summary = []
                if results['folders_created']:
                    summary.append(f"✅ Created {len(results['folders_created'])} folders")
                if results['files_copied']:
                    summary.append(f"✅ Copied {len(results['files_copied'])} new files")
                if results['files_updated']:
                    summary.append(f"✅ Updated {len(results['files_updated'])} files")
                if results['errors']:
                    summary.append(f"❌ {len(results['errors'])} errors")
                    for err in results['errors']:
                        summary.append(f"   • {err}")
                
                self.parent.after(0, lambda: self._sync_log("\n" + "\n".join(summary)))
                self.parent.after(0, lambda: self._sync_log("\n✅ Done! Changes applied."))
                self.parent.after(0, lambda: self.sync_apply_btn.config(state=tk.DISABLED))
                
                # Clear the report
                self.parent.after(0, lambda: self._sync_log("\n✅ Done! Changes applied."))
                self.parent.after(0, lambda: self.sync_apply_btn.config(state=tk.DISABLED))
                
                # Clear the report
                self.current_report = None
                
                # Prompt to update sync point
                def prompt_update_sync_point():
                    if messagebox.askyesno("Update Sync Point", 
                        "Changes applied successfully.\n\n"
                        "Do you want to update the Sync Point to NOW?\n"
                        "This will mark the current state as the new baseline."):
                        self.set_sync_point()
                
                self.parent.after(100, prompt_update_sync_point)
                
            except Exception as e:
                import traceback
                self.parent.after(0, lambda: self._sync_log(f"Error: {str(e)}\n{traceback.format_exc()}"))
            finally:
                self.parent.after(0, lambda: setattr(self, 'is_processing', False))
        
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
