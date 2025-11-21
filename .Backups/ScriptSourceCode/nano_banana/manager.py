import os
import threading
from PIL import Image
from io import BytesIO
from google import genai
from google.genai import types
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

    def process_images(self, api_key, prompt, folder_path, log_callback, 
                       thinking_level="low", media_resolution="media_resolution_medium", 
                       output_resolution="1024x1024", use_grounding=False, use_advanced_text=False):
        log_callback("=== Starting Nano Banana Process ===")
        self.stop_processing_flag.clear() # Clear flag at the start
        
        try:
            # Initialize client with new SDK
            client = genai.Client(api_key=api_key)
            log_callback("   AI Client initialized (google-genai).")
        except Exception as e:
            log_callback(f"   CRITICAL ERROR: Failed to initialize AI client: {str(e)}")
            self.parent.after(0, lambda: messagebox.showerror("AI Error", f"Failed to initialize AI client.\n{str(e)}"))
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
        
        # Prepare configuration
        tools = []
        if use_grounding:
            # Fix: Use google_search tool as per error message
            tools.append(types.Tool(google_search=types.GoogleSearch()))

        # Map Output Resolution to Image Size
        image_size = "1K" # Default
        if output_resolution == "2048x2048":
            image_size = "2K"
        elif output_resolution == "4096x4096":
            image_size = "4K"
            
        # Augment prompt for features not directly in config or as best effort
        full_prompt = prompt
        if use_advanced_text:
             full_prompt += "\n\n(Ensure high legibility and advanced text rendering for any text in the image.)"

        log_callback(f"   Settings:")
        log_callback(f"     - Thinking Process: Enabled (Default)")
        log_callback(f"     - Grounding: {'Enabled' if use_grounding else 'Disabled'}")
        log_callback(f"     - Output Resolution: {image_size}")
        if use_advanced_text:
            log_callback(f"     - Advanced Text: Enabled (Prompt augmented)")
        if media_resolution:
             log_callback(f"     - Media Resolution: {media_resolution} (Note: Not currently mapped in new SDK)")

        for i, filename in enumerate(files_to_process):
            if self.stop_processing_flag.is_set():
                log_callback("\n!!! STOP REQUESTED: Halting image processing. !!!")
                break
            
            try:
                log_callback(f"\n-> Processing {filename} ({i+1}/{len(files_to_process)})...")
                image_path = os.path.join(folder_path, filename)
                
                image = Image.open(image_path)
                
                # Use generate_content with multimodal input (text + image)
                # This is how the documentation describes "Image editing (text-and-image-to-image)"
                
                response = client.models.generate_content(
                    model='gemini-3-pro-image-preview',
                    contents=[full_prompt, image],
                    config=types.GenerateContentConfig(
                        response_modalities=['IMAGE'], # We primarily want the image
                        image_config=types.ImageConfig(
                            image_size=image_size,
                            # aspect_ratio="1:1" # Defaulting to 1:1 or letting model decide based on input
                        ),
                        safety_settings=[types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_ONLY_HIGH"
                        )],
                        tools=tools if tools else None
                    )
                )
                
                processed_image = None
                # Check for generated images in parts
                if response.parts:
                    for part in response.parts:
                        if part.inline_data: # Old SDK style, but check just in case
                             processed_image = Image.open(BytesIO(part.inline_data.data))
                             break
                        # New SDK might have a helper or different structure.
                        # The doc says: `elif image:= part.as_image(): image.save(...)`
                        try:
                            img = part.as_image()
                            if img:
                                processed_image = img
                                break
                        except:
                            pass
                
                # Fallback: check candidates if parts didn't yield
                if not processed_image and response.candidates:
                     for part in response.candidates[0].content.parts:
                         try:
                            img = part.as_image()
                            if img:
                                processed_image = img
                                break
                         except:
                             pass

                if processed_image:
                    base_name, ext = os.path.splitext(filename)
                    new_filename = f"{base_name}_semiprocessed{ext}"
                    new_path = os.path.join(folder_path, new_filename)
                    processed_image.save(new_path)
                    log_callback(f"   ✓ Saved: {new_filename}")
                else:
                    log_callback(f"   ✗ Failed: No image generated for {filename}")
                    # Debug info
                    if response.parts:
                        for part in response.parts:
                            if part.text:
                                log_callback(f"     [Model Text]: {part.text}")

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