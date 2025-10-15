#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Image & File Manager for Real Project Repo
- 1: Add images to Jularies/category.
- 2: Delete images from Jularies (auto-rm empty cats).
- 3: Manage general files: Add/Replace (copy to root) or Delete (scan/rm anywhere).
- Auto: git add/commit/push, custom status.
- Defaults: Saves repo path to config.json.
- Credentials: Edit top lines for real account.
Author: Your Assistant | For Real Repo: https://github.com/yourrealusername/real-project
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path

# Config file for defaults
CONFIG_FILE = 'config.json'

# Repo details (EDIT THESE FOR REAL ACCOUNT)
REPO_URL = 'https://github.com/yourrealusername/real-project.git'  # Swap to real
USERNAME = 'yourrealusername'  # Swap to real
PAT = 'ghp_yourrealpat'  # Paste real PAT here
SITE_URL = 'https://yourrealusername.github.io/real-project/'  # Swap to real

def check_prereqs():
    """Check for Git; print install info if missing."""
    try:
        subprocess.run(['git', '--version'], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: Git not found. Download from https://git-scm.com/download/win")
        sys.exit(1)
    print("✓ Git ready.")

def load_config():
    """Load/save repo path from/to config.json."""
    config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
    return config

def save_config(repo_path):
    """Save repo path to config."""
    config = {'repo_path': str(repo_path)}
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✓ Saved default repo path: {repo_path}")

def get_repo_path(config):
    """Prompt for repo path, default if set."""
    if 'repo_path' in config and os.path.exists(config['repo_path']):
        default = config['repo_path']
        path = input(f"Repo path [{default}]: ").strip()
        if not path:
            path = default
    else:
        path = input("Enter local repo path (e.g., D:\\real-project): ").strip()
        if not os.path.exists(path):
            print("Error: Path not found.")
            sys.exit(1)
    save_config(path)
    return Path(path).resolve()

def run_git_cmd(cmd, cwd, desc):
    """Run git command with error handling."""
    try:
        result = subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True)
        print(f"✓ {desc}: {result.stdout.strip() if result.stdout else 'Done'}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"✗ Git error ({desc}): {e.stderr.strip()}")
        return False

def setup_auth(repo_path):
    """Set Git remote with auth for push."""
    # Uncomment below for embedded PAT (if caching fails)
    # auth_url = f"https://{USERNAME}:{PAT}@{REPO_URL.replace('https://', '')}"
    # run_git_cmd(['git', 'remote', 'set-url', 'origin', auth_url], repo_path, "Set auth")
    print("Note: Ensure PAT is cached (git config --global credential.helper store) for push.")
    # Pull first to sync
    if not run_git_cmd(['git', 'pull', 'origin', 'main'], repo_path, "Pull latest"):
        print("Warning: Pull failed—proceed with caution (possible conflicts).")

def list_status(repo_path):
    """List Jularies: Category > 'img1 ___ img2 ___ ... (N images)'."""
    jul_path = repo_path / 'Jularies'
    if not jul_path.exists():
        print("No Jularies folder yet.")
        return
    
    print("\nCurrent Inventory:")
    categories = sorted([d for d in jul_path.iterdir() if d.is_dir()])
    if not categories:
        print("  No categories.")
        return
    
    for cat in categories:
        cat_files = [f.name for f in cat.iterdir() if f.is_file()]
        if cat_files:
            print(f"{cat.name}")
            print("  " + " ___ ".join(sorted(cat_files)) + f" ({len(cat_files)} images)")
        else:
            print(f"{cat.name} (0 images)")

def add_images(repo_path):
    """Option 1: Add images to Jularies/category."""
    category = input("Enter category (e.g., Gems): ").strip()
    if not category:
        print("Error: Category required.")
        return
    src_folder = input("Enter source folder path: ").strip()
    src_path = Path(src_folder).resolve()
    if not src_path.exists() or not src_path.is_dir():
        print("Error: Source folder not found.")
        return
    
    dest_dir = repo_path / 'Jularies' / category
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    files_to_add = [f for f in src_path.iterdir() if f.is_file() and f.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}]
    
    if not files_to_add:
        print("No images found in source.")
        return
    
    print(f"Will copy {len(files_to_add)} images to Jularies/{category}/:")
    for f in files_to_add:
        print(f"  - {f.name}")
    
    if input("\nConfirm add? (y/n): ").lower() != 'y':
        print("Aborted.")
        return
    
    copied = 0
    for f in files_to_add:
        dest = dest_dir / f.name
        if dest.exists():
            print(f"Warning: {f.name} already exists—skipping.")
            continue
        shutil.copy2(f, dest)
        copied += 1
    
    if copied == 0:
        print("No new files copied.")
        return
    
    # Git
    if run_git_cmd(['git', 'add', 'Jularies'], repo_path, "Stage adds"):
        commit_msg = f"Add {copied} images to {category}"
        if run_git_cmd(['git', 'commit', '-m', commit_msg], repo_path, "Commit"):
            if run_git_cmd(['git', 'push', 'origin', 'main'], repo_path, "Push"):
                print(f"✓ Added! Inventory updates in ~3 mins. Site: {SITE_URL}")
                list_status(repo_path)

def delete_images(repo_path):
    """Option 2: Delete images from Jularies; rm empty cats."""
    txt_path = input("Enter TXT file path (one filename per line): ").strip()
    txt = Path(txt_path).resolve()
    if not txt.exists() or not txt.is_file():
        print("Error: TXT not found.")
        return
    
    to_delete = [line.strip() for line in txt.open('r') if line.strip()]
    
    if not to_delete:
        print("No files listed.")
        return
    
    # Scan Jularies for matches
    jul_path = repo_path / 'Jularies'
    matches = []
    for root, _, files in os.walk(jul_path):
        for f in files:
            if f in to_delete:
                matches.append(Path(root) / f)
    
    if not matches:
        print("No matching files found.")
        return
    
    print(f"Will delete {len(matches)} matches:")
    for m in matches:
        rel = m.relative_to(repo_path)
        print(f"  - {rel}")
    
    if input("\nConfirm delete? (y/n): ").lower() != 'y':
        print("Aborted.")
        return
    
    deleted = 0
    for m in matches:
        try:
            m.unlink()
            deleted += 1
        except OSError as e:
            print(f"Error deleting {m}: {e}")
    
    if deleted == 0:
        print("No files deleted.")
        return
    
    # Auto-rm empty categories
    empty_cats = []
    for cat in jul_path.iterdir():
        if cat.is_dir():
            cat_files = list(cat.iterdir())
            if all(not f.is_file() for f in cat_files):
                try:
                    shutil.rmtree(cat)
                    empty_cats.append(cat.name)
                except OSError as e:
                    print(f"Error removing empty {cat.name}: {e}")
    
    if empty_cats:
        print(f"Auto-removed {len(empty_cats)} empty categories: {' '.join(empty_cats)}")
    
    # Git
    if run_git_cmd(['git', 'add', '-A', 'Jularies'], repo_path, "Stage deletes"):
        commit_msg = f"Delete {deleted} images" + (f" and {len(empty_cats)} empty categories" if empty_cats else "")
        if run_git_cmd(['git', 'commit', '-m', commit_msg], repo_path, "Commit"):
            if run_git_cmd(['git', 'push', 'origin', 'main'], repo_path, "Push"):
                print(f"✓ Deleted! Inventory updates in ~3 mins. Site: {SITE_URL}")
                list_status(repo_path)

def manage_files(repo_path):
    """Option 3: Add/Replace/Delete general files."""
    action = input("Action: 1) Add new 2) Replace existing 3) Delete (1/3): ").strip()
    if action not in ['1', '2', '3']:
        print("Invalid action.")
        return
    
    if action in ['1', '2']:  # Add/Replace: Copy local file/dir to root
        local_path_str = input("Enter local file or folder path: ").strip()
        local_path = Path(local_path_str).resolve()
        if not local_path.exists():
            print("Error: Path not found.")
            return
        
        # Handle file or dir
        if local_path.is_file():
            files = [local_path]
            is_dir = False
        elif local_path.is_dir():
            files = [local_path / f for f in local_path.iterdir() if not f.is_dir()]  # Files only, flat copy
            is_dir = True
        else:
            print("Error: Not a file or dir.")
            return
        
        print(f"Will {'add' if action == '1' else 'replace'} {len(files)} file(s) to repo root:")
        for f in files:
            print(f"  - {f.name}")
        
        if input("\nConfirm? (y/n): ").lower() != 'y':
            print("Aborted.")
            return
        
        copied = 0
        for f in files:
            dest = repo_path / f.name
            if dest.exists() and action == '1':
                print(f"Warning: {f.name} exists—skipping (use replace option).")
                continue
            shutil.copy2(f, dest)
            copied += 1
        
        if copied == 0:
            print("No files updated.")
            return
        
        # Git
        if run_git_cmd(['git', 'add', '-A', '.'], repo_path, "Stage files"):
            commit_msg = f"{'Add' if action == '1' else 'Replace'} {copied} file(s)"
            if run_git_cmd(['git', 'commit', '-m', commit_msg], repo_path, "Commit"):
                if run_git_cmd(['git', 'push', 'origin', 'main'], repo_path, "Push"):
                    print(f"✓ Updated! Site refreshes in ~1 min. {SITE_URL}")
    
    elif action == '3':  # Delete: Scan/rm by name
        filename = input("Enter filename to delete (scans entire repo): ").strip()
        if not filename:
            print("Error: Filename required.")
            return
        
        matches = []
        for root, _, files in os.walk(repo_path):
            for f in files:
                if f == filename:
                    matches.append(Path(root) / f)
        
        if not matches:
            print("No matches found.")
            return
        
        print(f"Will delete {len(matches)} matches:")
        for m in matches:
            rel = m.relative_to(repo_path)
            print(f"  - {rel}")
        
        if input("\nConfirm delete? (y/n): ").lower() != 'y':
            print("Aborted.")
            return
        
        deleted = 0
        for m in matches:
            try:
                m.unlink()
                deleted += 1
            except OSError as e:
                print(f"Error deleting {m}: {e}")
        
        if deleted == 0:
            print("No files deleted.")
            return
        
        # Git
        if run_git_cmd(['git', 'add', '-A', '.'], repo_path, "Stage deletes"):
            commit_msg = f"Delete {deleted} {filename}(s)"
            if run_git_cmd(['git', 'commit', '-m', commit_msg], repo_path, "Commit"):
                if run_git_cmd(['git', 'push', 'origin', 'main'], repo_path, "Push"):
                    print(f"✓ Deleted! Site refreshes in ~1 min. {SITE_URL}")

def main():
    check_prereqs()
    config = load_config()
    repo_path = get_repo_path(config)
    print(f"Using repo: {repo_path}")
    setup_auth(repo_path)
    
    action = input("Choose: 1) Add images 2) Delete images 3) Manage general files (1/3): ").strip()
    if action == '1':
        add_images(repo_path)
    elif action == '2':
        delete_images(repo_path)
    elif action == '3':
        manage_files(repo_path)
    else:
        print("Invalid choice.")
        sys.exit(1)

if __name__ == '__main__':
    main()