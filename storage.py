import json
import os
import sys
import logging

logger = logging.getLogger(__name__)

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
            app_data = os.getenv('LOCALAPPDATA')
            data_dir = os.path.join(app_data, 'WinTrace')
            os.makedirs(data_dir, exist_ok=True)
            return os.path.join(data_dir, self.filename)
        else:
            return os.path.join(os.getcwd(), self.filename)

    def load_data(self):
        if not os.path.exists(self.filepath):
            return {}

        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Migrate legacy flat format entries to new format
            for date_str, day_data in data.items():
                if isinstance(day_data, dict) and "apps" not in day_data:
                    # Legacy format: {"chrome.exe": 123, ...}
                    # Convert to new format: {"apps": {...}, "hourly": {}}
                    data[date_str] = {
                        "apps": day_data,
                        "hourly": {}
                    }

            return data
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Error loading data: {e}")
            return {}

    def save_data(self, data):
        try:
            with open(self.filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        except IOError as e:
            logger.error(f"Error saving data: {e}")

    def get_filepath(self):
        return self.filepath
