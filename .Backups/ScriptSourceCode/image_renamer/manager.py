import os
import threading
from PIL import Image
import google.generativeai as genai
import tkinter as tk
from tkinter import messagebox

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
        # --- EDIT START ---
        # Keep only alphanumeric characters (letters and numbers).
        # This will remove spaces, underscores, hyphens, and all other symbols.
        return "".join(c for c in text if c.isalnum())
        # --- EDIT END ---

    def process_and_rename_images(self, api_key, folder_path, prompt, excluded_words, log_callback):
        log_callback("=== Starting Image Renamer Process ===")
        self.stop_processing_flag.clear()

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
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
        files_to_process = [f for f in os.listdir(folder_path) if f.lower().endswith(image_extensions)]

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
                
                with Image.open(image_path) as image_file:
                    image = image_file.copy()

                full_prompt = prompt
                if excluded_words:
                    full_prompt += "\nDo not use these words: " + ", ".join(excluded_words)

                response = model.generate_content([full_prompt, image])

                if response.text:
                    sanitized_caption = self.sanitize_filename(response.text)
                    if not sanitized_caption:
                        log_callback(f"   ✗ Failed: AI output was empty after sanitizing for {filename}")
                        continue # Skip to the next file

                    _, ext = os.path.splitext(filename)
                    # --- EDIT START ---
                    # Removed the "_4,6,8" suffix from the new filename.
                    new_filename = f"{sanitized_caption}{ext}"
                    # --- EDIT END ---
                    old_path = os.path.join(folder_path, filename)
                    new_path = os.path.join(folder_path, new_filename)

                    counter = 1
                    while os.path.exists(new_path):
                        # --- EDIT START ---
                        # Updated the duplicate handling to append a simple underscore and counter.
                        new_filename = f"{sanitized_caption}_{counter}{ext}"
                        # --- EDIT END ---
                        new_path = os.path.join(folder_path, new_filename)
                        counter += 1
                    
                    os.rename(old_path, new_path)
                    log_callback(f"   ✓ Renamed '{filename}' to '{new_filename}'")
                else:
                    log_callback(f"   ✗ Failed: No caption generated for {filename}")

            except Exception as e:
                log_callback(f"   ✗ Error processing {filename}: {str(e)}")

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