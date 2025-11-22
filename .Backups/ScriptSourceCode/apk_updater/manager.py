import os
import subprocess
import shutil
import threading
import re
from tkinter import messagebox


class APKUpdaterManager:
    def __init__(self, parent, config_manager):
        self.parent = parent
        self.config_manager = config_manager
        self.config = self.config_manager.get_tool_config('apk_updater') or {}
        self.stop_flag = threading.Event()

    def save_config(self, config_data):
        if self.config_manager.set_tool_config('apk_updater', config_data):
            self.config = config_data
            return True
        return False

    def stop_process(self):
        self.stop_flag.set()

    def update_apk(self, git_repo_dir, apk_dir, log_callback):
        """Main APK update process"""
        log_callback("=== Starting APK Update Process ===")
        self.stop_flag.clear()

        try:
            # Step 1: Validate paths
            if not os.path.exists(git_repo_dir):
                log_callback(f"ERROR: Git repo directory does not exist: {git_repo_dir}")
                self.show_error("Git repo directory does not exist.")
                return

            if not os.path.exists(apk_dir):
                log_callback(f"ERROR: APK directory does not exist: {apk_dir}")
                self.show_error("APK directory does not exist.")
                return

            # Step 2: Copy gallery and Jularies folders
            log_callback("\n--- Step 1: Copying folders from Git repo to APK assets ---")
            
            gallery_source = os.path.join(git_repo_dir, "gallery")
            jularies_source = os.path.join(git_repo_dir, "Jularies")
            assets_dest = os.path.join(apk_dir, "app", "src", "main", "assets")

            if not os.path.exists(gallery_source):
                log_callback(f"ERROR: Gallery folder not found: {gallery_source}")
                self.show_error("Gallery folder not found in Git repo.")
                return

            if not os.path.exists(jularies_source):
                log_callback(f"ERROR: Jularies folder not found: {jularies_source}")
                self.show_error("Jularies folder not found in Git repo.")
                return

            if not os.path.exists(assets_dest):
                log_callback(f"Creating assets directory: {assets_dest}")
                os.makedirs(assets_dest, exist_ok=True)

            # Copy gallery
            gallery_dest = os.path.join(assets_dest, "gallery")
            if os.path.exists(gallery_dest):
                log_callback(f"Removing existing gallery folder: {gallery_dest}")
                shutil.rmtree(gallery_dest)
            log_callback(f"Copying gallery from {gallery_source} to {gallery_dest}")
            shutil.copytree(gallery_source, gallery_dest)
            log_callback("✓ Gallery folder copied successfully")

            # Copy Jularies
            jularies_dest = os.path.join(assets_dest, "Jularies")
            if os.path.exists(jularies_dest):
                log_callback(f"Removing existing Jularies folder: {jularies_dest}")
                shutil.rmtree(jularies_dest)
            log_callback(f"Copying Jularies from {jularies_source} to {jularies_dest}")
            shutil.copytree(jularies_source, jularies_dest)
            log_callback("✓ Jularies folder copied successfully")

            if self.stop_flag.is_set():
                log_callback("Process stopped by user.")
                return

            # Step 3: Build APK using gradlew
            log_callback("\n--- Step 2: Building APK with Gradle ---")
            log_callback("Setting JAVA_HOME and running gradlew assembleDebug...")
            
            # PowerShell command to set JAVA_HOME and run gradlew
            ps_command = [
                "powershell.exe",
                "-NoProfile",
                "-Command",
                f'$env:JAVA_HOME = "C:\\Program Files\\jbr"; Set-Location "{apk_dir}"; .\\gradlew.bat assembleDebug'
            ]

            log_callback(f"Running: {' '.join(ps_command)}")
            
            process = subprocess.Popen(
                ps_command,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace'
            )

            # Stream output
            for line in process.stdout:
                if self.stop_flag.is_set():
                    process.terminate()
                    log_callback("Build process stopped by user.")
                    return
                log_callback(line.rstrip())

            process.wait()

            if process.returncode != 0:
                log_callback(f"\n✗ BUILD FAILED with return code {process.returncode}")
                self.show_error("Gradle build failed. Check the log for details.")
                return

            log_callback("\n✓ APK built successfully")

            if self.stop_flag.is_set():
                log_callback("Process stopped by user.")
                return

            # Step 4: Move APK to git repo with version increment
            log_callback("\n--- Step 3: Moving APK to Git repo ---")
            
            apk_source_dir = os.path.join(apk_dir, "app", "build", "outputs", "apk", "debug")
            latest_apk_dir = os.path.join(git_repo_dir, "apk", "latest")
            old_apk_dir = os.path.join(git_repo_dir, "apk", "old")

            # Create directories if they don't exist
            os.makedirs(latest_apk_dir, exist_ok=True)
            os.makedirs(old_apk_dir, exist_ok=True)

            # Find the built APK
            if not os.path.exists(apk_source_dir):
                log_callback(f"ERROR: APK output directory not found: {apk_source_dir}")
                self.show_error("APK output directory not found.")
                return

            log_callback(f"Scanning APK output directory: {apk_source_dir}")
            all_files = os.listdir(apk_source_dir)
            log_callback(f"All files in directory: {all_files}")
            
            apk_files = [f for f in all_files if f.endswith('.apk')]
            log_callback(f"APK files found: {apk_files}")
            
            if not apk_files:
                log_callback(f"ERROR: No APK file found in {apk_source_dir}")
                self.show_error("No APK file found in output directory.")
                return

            built_apk = os.path.join(apk_source_dir, apk_files[0])
            log_callback(f"Found built APK: {built_apk}")

            # Find current latest version and increment
            latest_files = [f for f in os.listdir(latest_apk_dir) if f.startswith("Latest-version-") and f.endswith(".apk")]
            
            if latest_files:
                # Extract version number
                latest_file = latest_files[0]
                match = re.search(r'Latest-version-(\d+)\.apk', latest_file)
                if match:
                    current_version = int(match.group(1))
                    new_version = current_version + 1
                    old_version = current_version
                else:
                    new_version = 1
                    old_version = 0
                
                # Move current latest to old
                old_apk_name = f"Old-version-{old_version}.apk"
                old_apk_path = os.path.join(old_apk_dir, old_apk_name)
                latest_apk_path = os.path.join(latest_apk_dir, latest_file)
                
                # Delete all existing old APKs
                existing_old_apks = [f for f in os.listdir(old_apk_dir) if f.endswith('.apk')]
                for old_apk in existing_old_apks:
                    old_apk_to_delete = os.path.join(old_apk_dir, old_apk)
                    log_callback(f"Deleting existing old APK: {old_apk_to_delete}")
                    os.remove(old_apk_to_delete)
                
                log_callback(f"Moving {latest_file} to old directory as {old_apk_name}")
                shutil.move(latest_apk_path, old_apk_path)
                log_callback(f"✓ Previous version moved to old directory")
            else:
                new_version = 1
                log_callback("No previous version found. Starting with version 1.")

            # Move new APK to latest
            new_apk_name = f"Latest-version-{new_version}.apk"
            new_apk_path = os.path.join(latest_apk_dir, new_apk_name)
            
            log_callback(f"Moving built APK to {new_apk_path}")
            shutil.move(built_apk, new_apk_path)
            log_callback(f"✓ New APK saved as {new_apk_name}")

            # Success
            log_callback("\n" + "=" * 60)
            log_callback("✓ SUCCESS! APK Update completed successfully.")
            log_callback(f"  New version: {new_version}")
            log_callback(f"  Location: {new_apk_path}")
            log_callback("=" * 60)
            
            self.parent.after(0, lambda: messagebox.showinfo(
                "Success", 
                f"APK Update completed!\n\nNew version: {new_version}\nSaved to: {new_apk_path}"
            ))

        except Exception as e:
            import traceback
            log_callback(f"\n✗ ERROR: {str(e)}")
            log_callback(f"Full traceback:\n{traceback.format_exc()}")
            self.show_error(f"An error occurred: {str(e)}")
        
        finally:
            log_callback("\n=== Process Finished ===")

    def show_error(self, message):
        """Show error message in main thread"""
        self.parent.after(0, lambda: messagebox.showerror("Error", message))
