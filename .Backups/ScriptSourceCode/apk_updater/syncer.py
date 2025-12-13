"""
Smart Sync Module
Intelligently syncs changes from website to APK while preserving APK-specific code.
Uses 3-way merge approach similar to Git.
"""

import os
import hashlib
import difflib
import json
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Callable
from datetime import datetime


@dataclass
class SyncPoint:
    """Represents a snapshot of both projects when they were in sync."""
    date: str
    website_hashes: Dict[str, str] = field(default_factory=dict)
    apk_hashes: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict) -> 'SyncPoint':
        return cls(
            date=data.get('date', ''),
            website_hashes=data.get('website_hashes', {}),
            apk_hashes=data.get('apk_hashes', {})
        )


@dataclass
class FileChange:
    """Represents a change detected in a file."""
    path: str
    change_type: str  # 'added', 'modified', 'deleted'
    website_changed: bool = False
    apk_changed: bool = False
    is_conflict: bool = False
    diff_preview: str = ""
    new_content: Optional[str] = None  # For new files


@dataclass
class ChangeReport:
    """Categorized report of all detected changes."""
    safe_to_sync: List[FileChange] = field(default_factory=list)
    preserved: List[FileChange] = field(default_factory=list)
    conflicts: List[FileChange] = field(default_factory=list)
    new_files: List[FileChange] = field(default_factory=list)
    new_folders: List[str] = field(default_factory=list)
    deleted_in_website: List[FileChange] = field(default_factory=list)
    
    @property
    def total_safe(self) -> int:
        return len(self.safe_to_sync) + len(self.new_files) + len(self.new_folders)
    
    @property
    def total_conflicts(self) -> int:
        return len(self.conflicts) + len(self.deleted_in_website)


class SmartSyncer:
    """Handles intelligent syncing between website and APK projects."""
    
    # Paths to exclude from syncing
    EXCLUDED_PATHS = [
        'gallery/',
        'Jularies/',
        'gallery-index.json',
        'inventory-index.json',
        'apk-index.json',
        '.git/',
        '.github/',
        '.Backups/',
        'apk/',
    ]
    
    # File extensions to sync
    SYNC_EXTENSIONS = ['.html', '.css', '.js', '.json']
    
    def __init__(self, website_dir: str, apk_assets_dir: str):
        self.website_dir = os.path.normpath(website_dir)
        self.apk_assets_dir = os.path.normpath(apk_assets_dir)
    
    def _is_excluded(self, relative_path: str) -> bool:
        """Check if a path should be excluded from sync."""
        # Normalize path separators
        rel_path = relative_path.replace('\\', '/')
        
        # Check if starts with dot (hidden folder)
        parts = rel_path.split('/')
        for part in parts:
            if part.startswith('.'):
                return True
        
        # Check against excluded paths
        for excluded in self.EXCLUDED_PATHS:
            if rel_path.startswith(excluded) or rel_path == excluded.rstrip('/'):
                return True
        
        return False
    
    def _should_sync_file(self, filename: str) -> bool:
        """Check if file type should be synced."""
        _, ext = os.path.splitext(filename.lower())
        return ext in self.SYNC_EXTENSIONS
    
    def _hash_file(self, filepath: str) -> str:
        """Generate MD5 hash of file contents."""
        try:
            with open(filepath, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception:
            return ""
    
    def _get_all_files(self, directory: str, progress_callback: Optional[Callable] = None) -> Dict[str, str]:
        """
        Get all syncable files recursively.
        Returns: {relative_path: hash}
        """
        files = {}
        total_files = 0
        
        # First count files for progress
        for root, dirs, filenames in os.walk(directory):
            # Filter out excluded directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            total_files += len(filenames)
        
        current = 0
        for root, dirs, filenames in os.walk(directory):
            # Filter out excluded directories
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for filename in filenames:
                current += 1
                filepath = os.path.join(root, filename)
                relative = os.path.relpath(filepath, directory)
                
                if self._is_excluded(relative):
                    continue
                
                if not self._should_sync_file(filename):
                    continue
                
                files[relative] = self._hash_file(filepath)
                
                if progress_callback and current % 10 == 0:
                    progress_callback(f"Scanning... {current}/{total_files}", current / total_files)
        
        return files
    
    def set_sync_point(self, progress_callback: Optional[Callable] = None) -> SyncPoint:
        """
        Save current state of both projects as baseline.
        Call this when both projects are 100% synced.
        """
        if progress_callback:
            progress_callback("Scanning website files...", 0)
        
        website_hashes = self._get_all_files(self.website_dir, progress_callback)
        
        if progress_callback:
            progress_callback("Scanning APK files...", 0.5)
        
        apk_hashes = self._get_all_files(self.apk_assets_dir, progress_callback)
        
        sync_point = SyncPoint(
            date=datetime.now().isoformat(),
            website_hashes=website_hashes,
            apk_hashes=apk_hashes
        )
        
        if progress_callback:
            progress_callback("Sync point saved!", 1.0)
        
        return sync_point
    
    def detect_changes(self, sync_point: SyncPoint, progress_callback: Optional[Callable] = None) -> ChangeReport:
        """
        Detect all changes since sync point.
        Categorizes into: safe, preserved, conflicts, new files/folders.
        """
        report = ChangeReport()
        
        if progress_callback:
            progress_callback("Scanning current website...", 0.1)
        
        current_website = self._get_all_files(self.website_dir)
        
        if progress_callback:
            progress_callback("Scanning current APK...", 0.3)
        
        current_apk = self._get_all_files(self.apk_assets_dir)
        
        if progress_callback:
            progress_callback("Analyzing changes...", 0.5)
        
        # Get all paths across all sources
        all_paths = set()
        all_paths.update(sync_point.website_hashes.keys())
        all_paths.update(sync_point.apk_hashes.keys())
        all_paths.update(current_website.keys())
        all_paths.update(current_apk.keys())
        
        # Track new folders
        new_folders = set()
        
        total = len(all_paths)
        for i, path in enumerate(sorted(all_paths)):
            if progress_callback and i % 20 == 0:
                progress_callback(f"Analyzing {i}/{total}...", 0.5 + (0.4 * i / total))
            
            baseline_web = sync_point.website_hashes.get(path)
            baseline_apk = sync_point.apk_hashes.get(path)
            current_web = current_website.get(path)
            current_apk_hash = current_apk.get(path)
            
            # Determine what changed
            website_changed = baseline_web != current_web
            apk_changed = baseline_apk != current_apk_hash
            
            # Case 1: File is new in website (not in baseline)
            if baseline_web is None and current_web is not None:
                # Check if APK already has this file
                if current_apk_hash is not None:
                    # APK already has it, might be conflict
                    if current_web != current_apk_hash:
                        change = FileChange(
                            path=path,
                            change_type='added',
                            website_changed=True,
                            apk_changed=True,
                            is_conflict=True,
                            diff_preview=f"New file in website, but APK has different version"
                        )
                        report.conflicts.append(change)
                else:
                    # Truly new file
                    # Track folder
                    folder = os.path.dirname(path)
                    if folder and folder not in new_folders:
                        apk_folder = os.path.join(self.apk_assets_dir, folder)
                        if not os.path.exists(apk_folder):
                            new_folders.add(folder)
                    
                    web_filepath = os.path.join(self.website_dir, path)
                    try:
                        with open(web_filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                    except:
                        content = "[Binary or unreadable file]"
                    
                    change = FileChange(
                        path=path,
                        change_type='added',
                        website_changed=True,
                        new_content=content,
                        diff_preview=f"New file ({len(content)} chars)"
                    )
                    report.new_files.append(change)
                continue
            
            # Case 2: File deleted in website
            if baseline_web is not None and current_web is None:
                change = FileChange(
                    path=path,
                    change_type='deleted',
                    website_changed=True,
                    diff_preview="File deleted in website - manual review required"
                )
                report.deleted_in_website.append(change)
                continue
            
            # Case 3: File exists in baseline and current
            if not website_changed and not apk_changed:
                # No changes, skip
                continue
            
            if website_changed and not apk_changed:
                # Only website changed - SAFE TO SYNC
                diff = self._generate_diff(path)
                change = FileChange(
                    path=path,
                    change_type='modified',
                    website_changed=True,
                    apk_changed=False,
                    is_conflict=False,
                    diff_preview=diff
                )
                report.safe_to_sync.append(change)
            
            elif not website_changed and apk_changed:
                # Only APK changed - PRESERVE
                change = FileChange(
                    path=path,
                    change_type='modified',
                    website_changed=False,
                    apk_changed=True,
                    is_conflict=False,
                    diff_preview="APK has custom changes - will be preserved"
                )
                report.preserved.append(change)
            
            else:
                # BOTH changed - potential conflict
                # Check if changes overlap
                is_conflict = self._check_conflict(path)
                if is_conflict:
                    diff = self._generate_diff(path)
                    change = FileChange(
                        path=path,
                        change_type='modified',
                        website_changed=True,
                        apk_changed=True,
                        is_conflict=True,
                        diff_preview=f"CONFLICT: Both changed this file\n\nWebsite changes:\n{diff}"
                    )
                    report.conflicts.append(change)
                else:
                    # Changes don't overlap - can be merged
                    diff = self._generate_diff(path)
                    change = FileChange(
                        path=path,
                        change_type='modified',
                        website_changed=True,
                        apk_changed=True,
                        is_conflict=False,
                        diff_preview=f"Both changed but in different areas\n\n{diff}"
                    )
                    report.safe_to_sync.append(change)
        
        report.new_folders = sorted(list(new_folders))
        
        if progress_callback:
            progress_callback("Analysis complete!", 1.0)
        
        return report
    
    def _generate_diff(self, path: str, context_lines: int = 2) -> str:
        """Generate a unified diff between APK (old) and Website (new) content."""
        try:
            web_filepath = os.path.join(self.website_dir, path)
            apk_filepath = os.path.join(self.apk_assets_dir, path)
            
            # If APK file doesn't exist (new file), diff against empty
            if os.path.exists(apk_filepath):
                with open(apk_filepath, 'r', encoding='utf-8') as f:
                    # Normalize: strip trailing whitespace from each line
                    old_lines = [line.rstrip() + '\n' for line in f.readlines()]
            else:
                old_lines = []

            # If Website file doesn't exist (deleted), diff against empty
            if os.path.exists(web_filepath):
                with open(web_filepath, 'r', encoding='utf-8') as f:
                    # Normalize: strip trailing whitespace from each line
                    new_lines = [line.rstrip() + '\n' for line in f.readlines()]
            else:
                new_lines = []
                
            diff_lines = list(difflib.unified_diff(
                old_lines, 
                new_lines, 
                fromfile=f'APK/{path}', 
                tofile=f'Website/{path}',
                n=context_lines
            ))
            
            if not diff_lines:
                return "No significant content changes (whitespace/line-endings only?)"
                
            # Skip the header lines (--- and +++)
            return ''.join(diff_lines[2:])
            
        except Exception as e:
            return f"Could not generate diff: {str(e)}"
    
    def _check_conflict(self, path: str) -> bool:
        """
        Check if website and APK changes conflict.
        Currently returns True if file exists in different states.
        More sophisticated line-level checking can be added.
        """
        try:
            web_filepath = os.path.join(self.website_dir, path)
            apk_filepath = os.path.join(self.apk_assets_dir, path)
            
            if not os.path.exists(web_filepath) or not os.path.exists(apk_filepath):
                return True
            
            with open(web_filepath, 'r', encoding='utf-8') as f:
                web_content = f.read()
            with open(apk_filepath, 'r', encoding='utf-8') as f:
                apk_content = f.read()
            
            # If contents are identical, no conflict
            if web_content == apk_content:
                return False
            
            # For now, mark as conflict if both are different
            # More sophisticated: check if change hunks overlap
            return True
            
        except Exception:
            return True
    
    def generate_preview(self, report: ChangeReport) -> str:
        """Generate human-readable preview of all changes."""
        lines = []
        separator = "_" * 60
        hunk_separator = "+" * 60
        
        # Safe to sync
        if report.safe_to_sync:
            lines.append("=" * 60)
            lines.append(f"✅ SAFE TO SYNC ({len(report.safe_to_sync)} files)")
            lines.append("=" * 60)
            lines.append("")
            
            for i, change in enumerate(report.safe_to_sync):
                if i > 0:
                    lines.append(separator)
                    lines.append("")
                
                lines.append(f"📄 {change.path} (MODIFIED)")
                lines.append("-" * 40)
                
                diff_text = change.diff_preview.strip()
                # Format the diff output
                formatted_diff = []
                for line in diff_text.splitlines():
                    if line.startswith('@@'):
                        formatted_diff.append(hunk_separator)
                        formatted_diff.append(line)
                    else:
                        formatted_diff.append(line)
                
                lines.extend(formatted_diff)
                lines.append("")
        
        # New files
        if report.new_files:
            lines.append("=" * 60)
            lines.append(f"📁 NEW FILES ({len(report.new_files)} files)")
            lines.append("=" * 60)
            lines.append("")
            
            for i, change in enumerate(report.new_files):
                if i > 0:
                    lines.append(separator)
                    lines.append("")
                    
                lines.append(f"📄 {change.path} (NEW)")
                lines.append("-" * 40)
                # Show first few lines of new file
                if change.new_content:
                    preview_lines = change.new_content.splitlines()
                    lines.extend(preview_lines)
                lines.append("")
        
        # New folders
        if report.new_folders:
            lines.append("=" * 60)
            lines.append(f"📂 NEW FOLDERS ({len(report.new_folders)} folders)")
            lines.append("=" * 60)
            lines.append("")
            for folder in report.new_folders:
                lines.append(f"  + {folder}/")
            lines.append("")
        
        # Preserved
        if report.preserved:
            lines.append("=" * 60)
            lines.append(f"🔒 PRESERVED - APK-only changes ({len(report.preserved)} files)")
            lines.append("=" * 60)
            lines.append("")
            for change in report.preserved:
                lines.append(f"📄 {change.path}")
                lines.append("   (APK version differs from new website version)")
            lines.append("")
        
        # Conflicts
        if report.conflicts:
            lines.append("=" * 60)
            lines.append(f"⚠️ CONFLICTS - Manual review needed ({len(report.conflicts)} files)")
            lines.append("=" * 60)
            lines.append("")
            
            for i, change in enumerate(report.conflicts):
                if i > 0:
                    lines.append(separator)
                    lines.append("")
                    
                lines.append(f"📄 {change.path}")
                lines.append("-" * 40)
                lines.append(change.diff_preview)
                lines.append("")
        
        # Deleted
        if report.deleted_in_website:
            lines.append("=" * 60)
            lines.append(f"🗑️ DELETED IN WEBSITE ({len(report.deleted_in_website)} files)")
            lines.append("=" * 60)
            lines.append("")
            for change in report.deleted_in_website:
                lines.append(f"📄 {change.path}")
            lines.append("(Files won't be auto-deleted from APK)")
            lines.append("")
        
        if not any([report.safe_to_sync, report.new_files, report.new_folders, 
                    report.preserved, report.conflicts, report.deleted_in_website]):
            lines.append("No changes detected since last sync point.")
        
        return "\n".join(lines)
    
    def apply_safe_changes(self, report: ChangeReport, progress_callback: Optional[Callable] = None) -> dict:
        """
        Apply only non-conflicting changes to APK.
        Returns summary of what was applied.
        """
        results = {
            'folders_created': [],
            'files_copied': [],
            'files_updated': [],
            'errors': []
        }
        
        total = len(report.new_folders) + len(report.new_files) + len(report.safe_to_sync)
        current = 0
        
        # Create new folders
        for folder in report.new_folders:
            current += 1
            if progress_callback:
                progress_callback(f"Creating folder: {folder}", current / total)
            
            try:
                apk_folder = os.path.join(self.apk_assets_dir, folder)
                os.makedirs(apk_folder, exist_ok=True)
                results['folders_created'].append(folder)
            except Exception as e:
                results['errors'].append(f"Failed to create folder {folder}: {str(e)}")
        
        # Copy new files
        for change in report.new_files:
            current += 1
            if progress_callback:
                progress_callback(f"Copying: {change.path}", current / total)
            
            try:
                src = os.path.join(self.website_dir, change.path)
                dst = os.path.join(self.apk_assets_dir, change.path)
                
                # Ensure directory exists
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                
                with open(src, 'r', encoding='utf-8') as f:
                    content = f.read()
                with open(dst, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                results['files_copied'].append(change.path)
            except Exception as e:
                results['errors'].append(f"Failed to copy {change.path}: {str(e)}")
        
        # Apply modifications
        for change in report.safe_to_sync:
            current += 1
            if progress_callback:
                progress_callback(f"Updating: {change.path}", current / total)
            
            try:
                src = os.path.join(self.website_dir, change.path)
                dst = os.path.join(self.apk_assets_dir, change.path)
                
                # For safe changes (only website changed), we can copy directly
                with open(src, 'r', encoding='utf-8') as f:
                    content = f.read()
                with open(dst, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                results['files_updated'].append(change.path)
            except Exception as e:
                results['errors'].append(f"Failed to update {change.path}: {str(e)}")
        
        if progress_callback:
            progress_callback("All changes applied!", 1.0)
        
        return results
