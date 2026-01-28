
# exe_name (lowercase) -> Category Key (matches ui/types.ts and i18n keys)

APP_CATEGORIES = {
    # Browsers
    "chrome.exe": "Browsing",
    "firefox.exe": "Browsing",
    "msedge.exe": "Browsing",
}



# Dynamic Custom Categories
import os
import json
import sys

def get_config_path(filename):
    if getattr(sys, 'frozen', False):
        app_data = os.getenv('LOCALAPPDATA')
        data_dir = os.path.join(app_data, 'WinTrace')
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, filename)
    return filename

CUSTOM_CATEGORIES_FILE = get_config_path("user_categories.json")
custom_categories = {}

def load_custom_categories():
    global custom_categories
    try:
        if os.path.exists(CUSTOM_CATEGORIES_FILE):
            with open(CUSTOM_CATEGORIES_FILE, 'r', encoding='utf-8') as f:
                custom_categories = json.load(f)
    except Exception as e:
        print(f"Error loading custom categories: {e}")

def save_custom_category(exe_name, category):
    global custom_categories
    custom_categories[exe_name.lower()] = category
    try:
        with open(CUSTOM_CATEGORIES_FILE, 'w', encoding='utf-8') as f:
            json.dump(custom_categories, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Error saving custom category: {e}")



def get_category(exe_name):
    """
    Returns the category key for a given executable name.
    Priority: Custom > Default > Other
    """
    key = exe_name.lower()
    
    # Debug print
    # print(f"DEBUG: get_category key={key} in_custom={key in custom_categories}")
    
    # 1. Check Custom
    if key in custom_categories:
        return custom_categories[key]
        
    # 2. Check Default
    return APP_CATEGORIES.get(key, "Other")

# Initialize on module load
load_custom_categories()
