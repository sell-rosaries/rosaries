import os
import threading
import tkinter as tk
from tkinter import messagebox
from concurrent.futures import ThreadPoolExecutor, as_completed
from .core.api_handler import GeminiAPIHandler
from .core.image_processor import ImageProcessor
from .config.models import MODELS

class NanoBananaManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        
        self.tool_config = self.config_manager.get_tool_config('nano_banana') or {}
        self.profiles = self.tool_config.get('profiles', {})
        self.current_profile_name = self.tool_config.get('last_profile', 'Default')
        self.config = self.profiles.get(self.current_profile_name, {})
        
        self.api_handler = None
        self.image_processor = ImageProcessor()
        self.stop_flag = threading.Event()

    # --- Profile Management ---
    def get_profile_names(self):
        return list(self.profiles.keys())

    def load_profile(self, name):
        if name in self.profiles:
            self.current_profile_name = name
            self.config = self.profiles[name]
            self._save_tool_config()
            return self.config
        return None

    def save_profile(self, name, config_data):
        self.profiles[name] = config_data
        self.current_profile_name = name
        self.config = config_data
        return self._save_tool_config()

    def delete_profile(self, name):
        if name in self.profiles:
            del self.profiles[name]
            if self.current_profile_name == name:
                if self.profiles:
                    self.current_profile_name = list(self.profiles.keys())[0]
                    self.config = self.profiles[self.current_profile_name]
                else:
                    self.current_profile_name = "Default"
                    self.config = {}
            return self._save_tool_config()
        return False

    def _save_tool_config(self):
        self.tool_config['profiles'] = self.profiles
        self.tool_config['last_profile'] = self.current_profile_name
        return self.config_manager.set_tool_config('nano_banana', self.tool_config)

    # --- Processing ---
    def stop_process(self):
        self.stop_flag.set()

    def _process_single_image(self, 
                              img_info, 
                              prompt, 
                              model_name_api, 
                              image_size_str, 
                              aspect_ratio_str, 
                              reference_images, 
                              use_grounding, 
                              output_format, 
                              output_folder, 
                              log_callback):
        
        if self.stop_flag.is_set():
            return False

        filename = img_info['name'] + img_info['extension']
        
        # 1. Determine Output Filename EARLY
        base_name = img_info['name']
        suffix = "-nano-pro" if "pro" in model_name_api else "-nano"
        target_filename = f"{base_name}{suffix}.{output_format}"
        target_path = os.path.join(output_folder, target_filename)
        
        # 2. Check for existence (Strict Skip Logic)
        if os.path.exists(target_path):
            log_callback(f"-> Skipping {filename} (Already processed: {target_filename})")
            return True # Treat skip as success to not count as failure

        log_callback(f"-> Processing {filename}...")
        
        current_inputs = [img_info['path']]
        if reference_images:
            for ref in reference_images:
                if os.path.exists(ref['path']):
                    current_inputs.append(ref['path'])

        try:
            # Check for Flash model limitations
            is_flash = "flash" in model_name_api
            current_grounding = use_grounding and not is_flash
            
            # Context at START of prompt
            final_prompt = f"(Context: Input filename is '{filename}')\n{prompt}"
            
            generated_data = self.api_handler.generate_image(
                prompt=final_prompt,
                model_name=model_name_api,
                image_size=image_size_str,
                aspect_ratio=aspect_ratio_str,
                input_images=current_inputs,
                number_of_images=1,
                enable_grounding=current_grounding
            )

            if generated_data:
                image_obj, _ = generated_data[0]
                
                # Double check before saving (though race conditions are rare in this context)
                if os.path.exists(target_path):
                     # Fallback to counter if created during processing? 
                     # User wanted strict skip, but if we generated it, we should probably save it.
                     # Let's stick to the strict target_filename as primary.
                     pass

                save_fmt = 'JPEG' if output_format.lower() in ['jpg', 'jpeg'] else 'PNG'
                image_obj.save(target_path, format=save_fmt)
                
                log_callback(f"   ✓ Saved: {target_filename}")
                return True
            else:
                log_callback(f"   ✗ Failed: No image generated for {filename}.")
                return False

        except Exception as e:
            log_callback(f"   ✗ Error ({filename}): {str(e)}")
            return False

    def process_images(self, 
                       api_key, 
                       prompt, 
                       input_path, 
                       model_id, 
                       resolution, 
                       aspect_ratio, 
                       reference_images, 
                       use_grounding, 
                       output_format, 
                       max_workers,
                       log_callback):
        
        log_callback("=== Starting Nano Banana Process ===")
        self.stop_flag.clear()

        # 1. Initialize API Handler
        try:
            self.api_handler = GeminiAPIHandler(api_key)
            if not self.api_handler.validate_api_key():
                log_callback("ERROR: Invalid API Key or Connection Failed.")
                self.parent.after(0, lambda: messagebox.showerror("Error", "Invalid API Key or Connection Failed."))
                return
            log_callback("✓ API Client initialized.")
        except Exception as e:
            log_callback(f"CRITICAL ERROR: Failed to initialize AI client: {str(e)}")
            return

        # 2. Validate Input & Scan
        images = []
        output_folder = ""
        
        if os.path.isfile(input_path):
            if not self.image_processor.validate_image_file(input_path)['valid']:
                 log_callback(f"ERROR: Invalid image file: {input_path}")
                 return
            path_obj = os.path.splitext(input_path)
            images = [
                {
                    'path': input_path,
                    'name': os.path.basename(path_obj[0]),
                    'extension': path_obj[1]
                }
            ]
            output_folder = os.path.join(os.path.dirname(input_path), "processed")
            
        elif os.path.isdir(input_path):
            images = self.image_processor.scan_input_folder(input_path)
            output_folder = os.path.join(input_path, "processed")
        else:
             log_callback(f"ERROR: Invalid input path: {input_path}")
             return

        if not images:
            log_callback("No supported image files found.")
            return
        
        log_callback(f"Found {len(images)} images to process.")

        # 3. Setup Output Folder
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            log_callback(f"Created output folder: {output_folder}")

        # 4. Prepare API Arguments
        model_name_api = MODELS.get(model_id, {}).get('id', 'gemini-3-pro-image-preview')
        
        image_size_str = "1K"
        if resolution:
            if "(" in resolution:
                 if "4K" in resolution: image_size_str = "4K"
                 elif "2K" in resolution: image_size_str = "2K"
                 else: image_size_str = "1K"
            else:
                 try:
                    w = int(resolution.split('x')[0])
                    if w >= 4096: image_size_str = "4K"
                    elif w >= 2048: image_size_str = "2K"
                 except: pass

        aspect_ratio_str = "1:1"
        if aspect_ratio:
            aspect_ratio_str = aspect_ratio.split(' ')[0]

        # 5. Process Loop (Parallel or Sequential)
        success_count = 0
        try:
            # Ensure max_workers is a valid integer between 1 and 5
            try:
                workers = int(max_workers)
                workers = max(1, min(5, workers))
            except (ValueError, TypeError):
                workers = 1
                
            log_callback(f"Processing with {workers} parallel worker(s).")

            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = []
                for img_info in images:
                    if self.stop_flag.is_set():
                        break
                    
                    # Submit task
                    future = executor.submit(
                        self._process_single_image,
                        img_info,
                        prompt,
                        model_name_api,
                        image_size_str,
                        aspect_ratio_str,
                        reference_images,
                        use_grounding,
                        output_format,
                        output_folder,
                        log_callback
                    )
                    futures.append(future)
                
                # Wait for all submitted tasks
                for future in as_completed(futures):
                    if self.stop_flag.is_set():
                        # We can't easily cancel running threads, but we stop submitting new ones
                        # and individual threads check the flag.
                        break
                    if future.result():
                        success_count += 1

        except Exception as e:
            log_callback(f"CRITICAL LOOP ERROR: {str(e)}")

        if self.stop_flag.is_set():
            log_callback("\n!!! Process stopped by user. !!!")
            self.parent.after(0, lambda: messagebox.showwarning("Stopped", "Process stopped by user."))
        else:
            log_callback(f"\n=== Finished. Processed {success_count}/{len(images)} images. ===")
            self.parent.after(0, lambda: messagebox.showinfo("Success", f"Processing Complete!\nProcessed {success_count} images."))