import os
import threading
import io
from PIL import Image
import rembg
import tkinter as tk
from tkinter import messagebox

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