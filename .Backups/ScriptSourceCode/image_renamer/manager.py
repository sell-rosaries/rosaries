import os
import threading
from PIL import Image
import google.generativeai as genai
import tkinter as tk
from tkinter import messagebox
import concurrent.futures

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
        # Keep only alphanumeric characters (letters and numbers).
        return "".join(c for c in text if c.isalnum())

    def process_and_rename_images(self, api_key, folder_path, prompt, excluded_words, log_callback, batch_size=1, model_id='gemini-2.5-flash'):
        log_callback(f"=== Starting Image Renamer Process (Batch Size: {batch_size}, Model: {model_id}) ===")
        self.stop_processing_flag.clear()

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_id)
            log_callback(f"   AI Model ({model_id}) configured successfully.")
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

        # Use ThreadPoolExecutor for concurrent processing
        with concurrent.futures.ThreadPoolExecutor(max_workers=batch_size) as executor:
            futures = {
                executor.submit(self._process_single_image, model, folder_path, filename, prompt, excluded_words, log_callback): filename 
                for filename in files_to_process
            }

            for future in concurrent.futures.as_completed(futures):
                filename = futures[future]
                if self.stop_processing_flag.is_set():
                    # We continue to drain the queue but logic inside _process_single_image will return early
                    pass
                
                try:
                    future.result() # Check for exceptions
                except Exception as e:
                     log_callback(f"   ✗ Error in thread for {filename}: {str(e)}")

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

    def _process_single_image(self, model, folder_path, filename, prompt, excluded_words, log_callback):
        # Check stop flag at the start
        if self.stop_processing_flag.is_set():
            return

        try:
            log_callback(f"-> Processing {filename}...")
            image_path = os.path.join(folder_path, filename)
            
            with Image.open(image_path) as image_file:
                image = image_file.copy()

            full_prompt = prompt
            if excluded_words:
                full_prompt += "\nDo not use these words: " + ", ".join(excluded_words)

            # Check stop flag before API call
            if self.stop_processing_flag.is_set():
                return

            response = model.generate_content([full_prompt, image])

            if self.stop_processing_flag.is_set():
                return

            if response.text:
                sanitized_caption = self.sanitize_filename(response.text)
                if not sanitized_caption:
                    log_callback(f"   ✗ Failed: AI output was empty after sanitizing for {filename}")
                    return

                _, ext = os.path.splitext(filename)
                new_filename = f"{sanitized_caption}{ext}"
                old_path = os.path.join(folder_path, filename)
                new_path = os.path.join(folder_path, new_filename)

                counter = 1
                while os.path.exists(new_path):
                    new_filename = f"{sanitized_caption}_{counter}{ext}"
                    new_path = os.path.join(folder_path, new_filename)
                    counter += 1
                
                os.rename(old_path, new_path)
                log_callback(f"   ✓ Renamed '{filename}' to '{new_filename}'")
            else:
                log_callback(f"   ✗ Failed: No caption generated for {filename}")

        except Exception as e:
            log_callback(f"   ✗ Error processing {filename}: {str(e)}")
            raise e