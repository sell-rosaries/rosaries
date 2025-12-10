import os
import sys
import json
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich.syntax import Syntax
from rich import print as rprint

console = Console()

class SettingsManager:
    """Manages configuration and settings persistence"""
    
    def __init__(self):
        self.home_dir = Path.home()
        self.config_dir = self.home_dir / "NanoBanana"
        self.config_dir.mkdir(exist_ok=True)
        self.config_file = self.config_dir / "settings.json"
        self.api_key_file = self.config_dir / "api.txt"
        self.prompt_history_file = self.config_dir / "prompt_history.json"
        
    def _read_settings_file(self):
        """Read the raw settings file"""
        try:
            if self.config_file.exists():
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            return {"configurations": {}}
        except Exception as e:
            console.print(f"[red]Error loading settings file: {e}[/red]")
            return {"configurations": {}}

    def _write_settings_file(self, data):
        """Write to the settings file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            console.print(f"[red]Error saving settings file: {e}[/red]")

    def save_configuration(self, name, settings):
        """Save a named configuration"""
        data = self._read_settings_file()
        
        # Migration check: if file has flat settings (no 'configurations' key), migrate them
        if "configurations" not in data:
            # Assume existing data is a single config, maybe name it 'default' or 'backup'
            # But simpler to just initialize structure if it doesn't look like our new structure
            data = {"configurations": {}}
        
        data["configurations"][name] = settings
        self._write_settings_file(data)
        console.print(f"[green]✓[/green] Configuration '{name}' saved.")

    def list_configurations(self):
        """Return a list of configuration names"""
        data = self._read_settings_file()
        return list(data.get("configurations", {}).keys())

    def load_configuration(self, name):
        """Load a specific configuration by name"""
        data = self._read_settings_file()
        return data.get("configurations", {}).get(name)

    def delete_configuration(self, name):
        """Delete a named configuration"""
        data = self._read_settings_file()
        if "configurations" in data and name in data["configurations"]:
            del data["configurations"][name]
            self._write_settings_file(data)
            return True
        return False

    # Legacy support / Direct file operations for API keys
    def save_api_key(self, api_key):
        """Save API key to file"""
        try:
            with open(self.api_key_file, 'w') as f:
                f.write(api_key.strip())
            console.print("[green]✓[/green] API key saved successfully")
        except Exception as e:
            console.print(f"[red]Error saving API key: {e}[/red]")
    
    def load_api_key(self):
        """Load API key from file"""
        try:
            if self.api_key_file.exists():
                with open(self.api_key_file, 'r') as f:
                    return f.read().strip()
            return None
        except Exception as e:
            console.print(f"[red]Error loading API key: {e}[/red]")
            return None
    
    def save_prompt_history(self, prompts):
        """Save prompt history"""
        try:
            with open(self.prompt_history_file, 'w') as f:
                json.dump(prompts, f, indent=2)
        except Exception as e:
            console.print(f"[red]Error saving prompt history: {e}[/red]")
    
    def load_prompt_history(self):
        """Load prompt history"""
        try:
            if self.prompt_history_file.exists():
                with open(self.prompt_history_file, 'r') as f:
                    return json.load(f)
            return []
        except Exception as e:
            console.print(f"[red]Error loading prompt history: {e}[/red]")
            return []