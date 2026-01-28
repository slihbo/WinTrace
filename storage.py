import json
import os
import sys

class DataStorage:
    def __init__(self, filename="usage_data.json"):
        self.filename = filename
        self.filepath = self._get_data_path()
        self.data = self.load_data()

    def _get_data_path(self):
        """
        Determines the correct path for the data file.
        In development: local directory.
        In PyInstaller bundle: User's Local AppData.
        """
        if getattr(sys, 'frozen', False):
            # If running as an EXE, save to AppData/Local/WinTrace
            app_data = os.getenv('LOCALAPPDATA')
            data_dir = os.path.join(app_data, 'WinTrace')
            os.makedirs(data_dir, exist_ok=True)
            return os.path.join(data_dir, self.filename)
        else:
            # If running as a script, save in the current directory
            return os.path.join(os.getcwd(), self.filename)

    def load_data(self):
        if not os.path.exists(self.filepath):
            return {}
        
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}

    def save_data(self, data):
        try:
            with open(self.filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        except IOError as e:
            print(f"Error saving data: {e}")

    def get_filepath(self):
        return self.filepath
