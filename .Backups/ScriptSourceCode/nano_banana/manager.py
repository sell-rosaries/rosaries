import os
import threading
from PIL import Image
from io import BytesIO
import google.generativeai as genai
import tkinter as tk
from tkinter import messagebox

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