import os
import json

class AppConfigManager:
    """Manages configuration for all tools in a single JSON file."""
    def __init__(self):
        self.config_dir = os.path.expanduser("~")
        self.config_file = os.path.join(self.config_dir, "script_launcher_config.json")
        self.config = self.load_all()

    def load_all(self):
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}

    def save_all(self):
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=4)
            return True
        except IOError:
            return False

    def get_tool_config(self, tool_name):
        self.config = self.load_all() # Refresh from disk
        return self.config.get(tool_name, {})

    def set_tool_config(self, tool_name, config_data):
        self.config = self.load_all() # Refresh to get latest changes
        self.config[tool_name] = config_data
        return self.save_all()