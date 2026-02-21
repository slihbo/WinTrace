
# exe_name (lowercase) -> Category Key (matches ui/types.ts and i18n keys)

APP_CATEGORIES = {
    # Browsers
    "chrome.exe": "Browsing",
    "firefox.exe": "Browsing",
    "msedge.exe": "Browsing",
    "opera.exe": "Browsing",
    "brave.exe": "Browsing",
    "vivaldi.exe": "Browsing",
    "zen.exe": "Browsing",

    # Development
    "code.exe": "Development",
    "devenv.exe": "Development",
    "idea64.exe": "Development",
    "pycharm64.exe": "Development",
    "webstorm64.exe": "Development",
    "sublime_text.exe": "Development",
    "notepad++.exe": "Development",
    "windowsterminal.exe": "Development",
    "powershell.exe": "Development",
    "cmd.exe": "Development",
    "wt.exe": "Development",
    "git.exe": "Development",
    "android studio.exe": "Development",
    "cursor.exe": "Development",

    # Communication
    "discord.exe": "Communication",
    "slack.exe": "Communication",
    "teams.exe": "Communication",
    "ms-teams.exe": "Communication",
    "zoom.exe": "Communication",
    "telegram.exe": "Communication",
    "whatsapp.exe": "Communication",
    "skype.exe": "Communication",
    "thunderbird.exe": "Communication",
    "outlook.exe": "Communication",

    # Productivity
    "winword.exe": "Productivity",
    "excel.exe": "Productivity",
    "powerpnt.exe": "Productivity",
    "onenote.exe": "Productivity",
    "notion.exe": "Productivity",
    "obsidian.exe": "Productivity",
    "todoist.exe": "Productivity",
    "anytype.exe": "Productivity",
    "acrobat.exe": "Productivity",
    "acrord32.exe": "Productivity",

    # Entertainment
    "spotify.exe": "Entertainment",
    "vlc.exe": "Entertainment",
    "wmplayer.exe": "Entertainment",
    "netflix.exe": "Entertainment",
    "mpc-hc64.exe": "Entertainment",
    "mpc-hc.exe": "Entertainment",
    "foobar2000.exe": "Entertainment",
    "itunes.exe": "Entertainment",

    # Games
    "steam.exe": "Games",
    "steamwebhelper.exe": "Games",
    "epicgameslauncher.exe": "Games",
    "gog galaxy.exe": "Games",
    "riotclientservices.exe": "Games",
    "battle.net.exe": "Games",
    "ubisoft connect.exe": "Games",
    "ea.exe": "Games",

    # Design & Media
    "photoshop.exe": "DesignMedia",
    "illustrator.exe": "DesignMedia",
    "figma.exe": "DesignMedia",
    "blender.exe": "DesignMedia",
    "gimp-2.10.exe": "DesignMedia",
    "inkscape.exe": "DesignMedia",
    "premiere pro.exe": "DesignMedia",
    "afterfx.exe": "DesignMedia",
    "obs64.exe": "DesignMedia",
    "obs32.exe": "DesignMedia",
    "davinci resolve.exe": "DesignMedia",
    "canva.exe": "DesignMedia",
    "paint.net.exe": "DesignMedia",
    "lightroom.exe": "DesignMedia",

    # Cloud & Storage
    "onedrive.exe": "Cloud",
    "googledrivesync.exe": "Cloud",
    "dropbox.exe": "Cloud",
    "megasync.exe": "Cloud",

    # System & Security
    "explorer.exe": "System",
    "taskmgr.exe": "System",
    "mmc.exe": "System",
    "control.exe": "System",
    "regedit.exe": "System",
    "msconfig.exe": "System",
    "windowsdefender.exe": "System",
    "securityhealthsystray.exe": "System",
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

    # 1. Check Custom
    if key in custom_categories:
        return custom_categories[key]

    # 2. Check Default
    return APP_CATEGORIES.get(key, "Other")

# Initialize on module load
load_custom_categories()
