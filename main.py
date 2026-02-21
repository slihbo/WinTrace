import time
import sys
import winreg
import os
import threading
import json
import locale
import logging
import csv
import io
import base64
import ctypes
import ctypes.wintypes
from datetime import datetime, timedelta
import webview
import pystray
from PIL import Image
from tracker import WindowTracker
from storage import DataStorage
from sqlite_storage import SQLiteStorage
from notifications import BreakReminder
from categories import get_category, save_custom_category
import win32gui
import win32con

# Setup logging
logging.basicConfig(level=logging.WARNING, format='%(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Productive categories
PRODUCTIVE_CATEGORIES = {'Development', 'Productivity', 'DesignMedia'}
UNPRODUCTIVE_CATEGORIES = {'Games', 'Entertainment'}

# Global Application State
data_lock = threading.Lock()

# Settings defaults
DEFAULT_SETTINGS = {
    "language": "auto",
    "autoStart": True,
    "idleThreshold": 180,
    "idleDetectionEnabled": True,
    "trackingInterval": 3,
    "storageBackend": "sqlite",
    "breakReminder": True,
    "breakInterval": 45,
}

def _get_settings_path():
    if getattr(sys, 'frozen', False):
        app_data = os.getenv('LOCALAPPDATA')
        data_dir = os.path.join(app_data, 'WinTrace')
        os.makedirs(data_dir, exist_ok=True)
        return os.path.join(data_dir, 'settings.json')
    return 'settings.json'

def _load_settings():
    path = _get_settings_path()
    try:
        if os.path.exists(path):
            with open(path, 'r', encoding='utf-8') as f:
                saved = json.load(f)
                merged = {**DEFAULT_SETTINGS, **saved}
                return merged
    except Exception as e:
        logger.warning(f"Error loading settings: {e}")
    return dict(DEFAULT_SETTINGS)

def _save_settings(settings):
    path = _get_settings_path()
    try:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error saving settings: {e}")

app_state = {
    "running": True,
    "storage": None,
    "tracker": None,
    "usage_data": None,
    "window": None,
    "icon": None,
    "settings": _load_settings(),
    "break_reminder": None
}

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


def _get_apps_data(day_data):
    """
    Extract apps dict from day_data, handling both new and legacy formats.
    New format: {"apps": {...}, "hourly": {...}}
    Legacy format: {"chrome.exe": 123, ...}
    """
    if isinstance(day_data, dict) and "apps" in day_data:
        return day_data["apps"]
    return day_data  # legacy flat format


def _get_hourly_data(day_data):
    """Extract hourly dict from day_data. Returns empty dict for legacy format."""
    if isinstance(day_data, dict) and "hourly" in day_data:
        return day_data["hourly"]
    return {}


def _calculate_productivity_score(apps_list):
    """
    Calculate real productivity score (0-100) based on app categories.
    Productive (Development, Productivity, DesignMedia) vs Unproductive (Games, Entertainment).
    Neutral categories (Browsing, System, Other, etc.) don't count.
    """
    productive_seconds = 0
    unproductive_seconds = 0

    for app in apps_list:
        cat = app.get("category", "Other")
        dur = app.get("durationSeconds", 0)
        if cat in PRODUCTIVE_CATEGORIES:
            productive_seconds += dur
        elif cat in UNPRODUCTIVE_CATEGORIES:
            unproductive_seconds += dur

    total_scored = productive_seconds + unproductive_seconds
    if total_scored == 0:
        return 50  # Neutral if no categorized apps

    return int((productive_seconds / total_scored) * 100)


def _calculate_peak_hour(data, start_date, end_date):
    """
    Calculate the most active hour from hourly data in the date range.
    Returns string like '14:00' or '-' if no data.
    """
    hour_totals = {}

    current = start_date
    while current <= end_date:
        d_str = current.strftime("%Y-%m-%d")
        if d_str in data:
            hourly = _get_hourly_data(data[d_str])
            for hour_str, apps in hourly.items():
                total = sum(apps.values())
                hour_totals[hour_str] = hour_totals.get(hour_str, 0) + total
        current += timedelta(days=1)

    if not hour_totals:
        return "-"

    peak = max(hour_totals, key=hour_totals.get)
    return f"{int(peak):02d}:00"


def _is_productive(category):
    """Determine if an app category is productive."""
    return category in PRODUCTIVE_CATEGORIES


class PythonAPI:
    def log(self, value):
        print(str(value))

    def set_category(self, app_id, category):
        """Updates the category for a specific app (by exe name/id)."""
        try:
            save_custom_category(app_id, category)
            return True
        except Exception as e:
            logger.error(f"Error setting category: {e}")
            return False

    def get_daily_stats(self, date_str, view_mode, custom_range=None):
        with data_lock:
            data = app_state["usage_data"]

        # Parse date
        try:
            target_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")).date()
        except ValueError:
            target_date = datetime.now().date()

        # Helper to sum stats
        def get_stats_for_range(start_date, end_date):
            total_seconds = 0
            app_usage = {}

            current = start_date
            while current <= end_date:
                d_str = current.strftime("%Y-%m-%d")
                if d_str in data:
                    apps = _get_apps_data(data[d_str])
                    for app, duration in apps.items():
                        total_seconds += duration
                        app_usage[app] = app_usage.get(app, 0) + duration
                current += timedelta(days=1)

            # Format apps
            apps_list = []
            for app, duration in app_usage.items():
                clean_name = app[:-4] if app.lower().endswith('.exe') else app
                display_name = clean_name[0].upper() + clean_name[1:] if clean_name else clean_name
                category = get_category(app)

                apps_list.append({
                    "id": app,
                    "name": display_name,
                    "durationSeconds": int(duration),
                    "icon": None,
                    "category": category,
                    "isProductive": _is_productive(category)
                })

            apps_list.sort(key=lambda x: x["durationSeconds"], reverse=True)

            return {
                "date": start_date.strftime("%d %B %Y") if start_date == end_date else f"{start_date.strftime('%d.%m')} - {end_date.strftime('%d.%m.%Y')}",
                "viewMode": view_mode,
                "totalDurationSeconds": int(total_seconds),
                "productivityScore": _calculate_productivity_score(apps_list),
                "apps": apps_list
            }

        # Logic based on ViewMode
        if view_mode == 'daily':
            return get_stats_for_range(target_date, target_date)

        elif view_mode == 'weekly':
            start_of_week = target_date - timedelta(days=target_date.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            return get_stats_for_range(start_of_week, end_of_week)

        elif view_mode == 'monthly':
            start_of_month = target_date.replace(day=1)
            next_month = start_of_month.replace(day=28) + timedelta(days=4)
            end_of_month = next_month - timedelta(days=next_month.day)
            return get_stats_for_range(start_of_month, end_of_month)

        elif view_mode == 'yearly':
            start_of_year = target_date.replace(month=1, day=1)
            end_of_year = start_of_year.replace(year=start_of_year.year + 1) - timedelta(days=1)
            return get_stats_for_range(start_of_year, end_of_year)

        elif view_mode == 'custom' and custom_range:
            try:
                start = datetime.fromisoformat(custom_range['start'].replace("Z", "+00:00")).date()
                end = datetime.fromisoformat(custom_range['end'].replace("Z", "+00:00")).date()
                return get_stats_for_range(start, end)
            except Exception as e:
                logger.warning(f"Invalid custom range: {e}")

        # Fallback
        return get_stats_for_range(target_date, target_date)

    def get_yearly_recap(self):
        with data_lock:
            data = app_state["usage_data"]

        current_year = datetime.now().year

        total_seconds = 0
        app_usage = {}
        monthly_stats = {i: 0 for i in range(1, 13)}

        weekend_seconds = 0
        weekday_seconds = 0

        # Daily averages setup: 0=Monday, 6=Sunday
        daily_sums = {i: 0 for i in range(7)}
        daily_counts = {i: 0 for i in range(7)}

        # Hourly totals for peak hour
        hour_totals = {}

        for date_str, day_data in data.items():
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                if date_obj.year == current_year:
                    apps = _get_apps_data(day_data)
                    hourly = _get_hourly_data(day_data)

                    daily_total = sum(apps.values())
                    total_seconds += daily_total

                    # Monthly sum
                    monthly_stats[date_obj.month] += daily_total

                    # Weekend vs Weekday (5=Saturday, 6=Sunday)
                    if date_obj.weekday() >= 5:
                        weekend_seconds += daily_total
                    else:
                        weekday_seconds += daily_total

                    # Daily Average Accumulation
                    day_idx = date_obj.weekday()
                    daily_sums[day_idx] += daily_total
                    daily_counts[day_idx] += 1

                    # Hourly totals
                    for hour_str, hour_apps in hourly.items():
                        hour_total = sum(hour_apps.values())
                        hour_totals[hour_str] = hour_totals.get(hour_str, 0) + hour_total

                    # App aggregation
                    for app_name, duration in apps.items():
                        app_usage[app_name] = app_usage.get(app_name, 0) + duration
            except ValueError:
                continue

        # Process Apps
        apps_list = []
        for app, duration in app_usage.items():
            clean_name = app[:-4] if app.lower().endswith('.exe') else app
            display_name = clean_name[0].upper() + clean_name[1:] if clean_name else clean_name
            category = get_category(app)

            apps_list.append({
                "name": display_name,
                "durationSeconds": int(duration),
                "category": category,
                "isProductive": _is_productive(category),
                "id": app
            })

        apps_list.sort(key=lambda x: x["durationSeconds"], reverse=True)
        top_app = apps_list[0] if apps_list else None

        # Monthly usage list
        monthly_usage_list = []
        for i in range(1, 13):
            hours = int(monthly_stats[i] / 3600)
            monthly_usage_list.append({"month": i, "hours": hours})

        # Weekend Percentage
        total_tracked = weekend_seconds + weekday_seconds
        weekend_pct = int((weekend_seconds / total_tracked) * 100) if total_tracked > 0 else 0

        # Daily Averages
        daily_averages = []
        for i in range(7):
            avg_sec = daily_sums[i] / daily_counts[i] if daily_counts[i] > 0 else 0
            daily_averages.append({
                "day": i,
                "hours": round(avg_sec / 3600, 1)
            })

        # Most Productive Day
        most_productive_day_idx = max(daily_averages, key=lambda x: x['hours'])['day'] if total_seconds > 0 else 0

        # Peak Hour (real calculation)
        peak_hour = "-"
        if hour_totals:
            peak = max(hour_totals, key=hour_totals.get)
            peak_hour = f"{int(peak):02d}:00"

        # Top Category
        category_sums = {}
        for app_data in apps_list:
            cat = app_data["category"]
            category_sums[cat] = category_sums.get(cat, 0) + app_data["durationSeconds"]

        top_category_name = "Other"
        if category_sums:
            top_category_name = max(category_sums, key=category_sums.get)

        # Category breakdown (top 5 with percentages)
        category_breakdown = []
        if category_sums and total_seconds > 0:
            sorted_categories = sorted(category_sums.items(), key=lambda x: x[1], reverse=True)[:5]
            for cat, seconds in sorted_categories:
                percentage = int((seconds / total_seconds) * 100)
                category_breakdown.append({
                    "category": cat,
                    "percentage": percentage
                })

        return {
            "year": current_year,
            "totalHours": int(total_seconds / 3600),
            "peakHour": peak_hour,
            "weekendPercentage": weekend_pct,
            "mostProductiveDay": most_productive_day_idx,
            "topApp": top_app if top_app else {"name": "-", "durationSeconds": 0, "category": "Other"},
            "topCategory": top_category_name,
            "categoryBreakdown": category_breakdown,
            "monthlyUsage": monthly_usage_list,
            "dailyAverages": daily_averages,
            "apps": apps_list
        }

    def minimize_window(self):
        if app_state["window"]:
            app_state["window"].minimize()

    def close_window(self):
        if app_state["window"]:
            app_state["window"].hide()

    def start_drag(self):
        try:
            hwnd = win32gui.FindWindow(None, "WinTrace")
            if hwnd:
                win32gui.ReleaseCapture()
                win32gui.SendMessage(hwnd, win32con.WM_NCLBUTTONDOWN, win32con.HTCAPTION, 0)
        except Exception as e:
            logger.debug(f"Drag error: {e}")

    # ---- Settings API ----

    def get_settings(self):
        """Return current settings."""
        return app_state["settings"]

    def update_settings(self, new_settings):
        """Update settings and apply changes."""
        try:
            settings = app_state["settings"]
            settings.update(new_settings)
            app_state["settings"] = settings
            _save_settings(settings)

            # Apply auto-start setting
            auto = AutoStart()
            auto.set_autostart(settings.get("autoStart", True))

            # Apply idle settings
            if app_state["tracker"]:
                app_state["tracker"].idle_threshold = settings.get("idleThreshold", 180)
                app_state["tracker"].idle_detection_enabled = settings.get("idleDetectionEnabled", True)

            return True
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            return False

    # ---- Data Export API ----

    def export_data(self, format_type="json", date_range=None):
        """
        Export usage data as JSON or CSV string.
        format_type: 'json' or 'csv'
        date_range: optional {start: str, end: str}
        """
        with data_lock:
            data = dict(app_state["usage_data"])

        # Filter by date range if specified
        if date_range:
            try:
                start = datetime.fromisoformat(date_range['start'].replace('Z', '+00:00')).date()
                end = datetime.fromisoformat(date_range['end'].replace('Z', '+00:00')).date()
                filtered = {}
                for d_str, d_data in data.items():
                    try:
                        d = datetime.strptime(d_str, '%Y-%m-%d').date()
                        if start <= d <= end:
                            filtered[d_str] = d_data
                    except ValueError:
                        continue
                data = filtered
            except Exception as e:
                logger.warning(f"Invalid date range for export: {e}")

        if format_type == 'csv':
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(['Date', 'Application', 'Duration (seconds)', 'Category'])
            for d_str in sorted(data.keys()):
                apps = _get_apps_data(data[d_str])
                for app, dur in sorted(apps.items(), key=lambda x: x[1], reverse=True):
                    writer.writerow([d_str, app, int(dur), get_category(app)])
            return output.getvalue()
        else:
            # JSON export with readable structure
            export_data = {}
            for d_str in sorted(data.keys()):
                apps = _get_apps_data(data[d_str])
                export_data[d_str] = [
                    {
                        "app": app,
                        "durationSeconds": int(dur),
                        "category": get_category(app)
                    }
                    for app, dur in sorted(apps.items(), key=lambda x: x[1], reverse=True)
                ]
            return json.dumps(export_data, indent=2, ensure_ascii=False)

    # ---- App Icon API ----

    def get_app_icon(self, exe_name):
        """
        Extract icon from an executable and return as base64 PNG.
        Returns None if extraction fails.
        """
        try:
            import win32api
            import win32ui

            # Find the exe path
            exe_path = self._find_exe_path(exe_name)
            if not exe_path:
                return None

            # Extract large icon
            large, small = win32gui.ExtractIconEx(exe_path, 0)
            if not large:
                return None

            hicon = large[0]

            # Get icon info
            icon_info = win32gui.GetIconInfo(hicon)
            bmp = icon_info[4]  # hbmColor

            # Create device context and bitmap
            hdc = win32ui.CreateDCFromHandle(win32gui.GetDC(0))
            hbmp = win32ui.CreateBitmapFromHandle(bmp)

            # Get bitmap info
            bmp_info = hbmp.GetInfo()
            width = bmp_info['bmWidth']
            height = bmp_info['bmHeight']

            # Convert to PIL Image
            bmp_str = hbmp.GetBitmapBits(True)
            img = Image.frombuffer('RGBA', (width, height), bmp_str, 'raw', 'BGRA', 0, 1)

            # Resize to 32x32
            img = img.resize((32, 32), Image.LANCZOS)

            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

            # Cleanup
            for icon in large:
                win32gui.DestroyIcon(icon)
            for icon in small:
                win32gui.DestroyIcon(icon)

            return f"data:image/png;base64,{b64}"

        except Exception as e:
            logger.debug(f"Icon extraction failed for {exe_name}: {e}")
            return None

    def _find_exe_path(self, exe_name):
        """Try to find the full path of an executable."""
        import shutil
        # Try shutil.which first
        path = shutil.which(exe_name)
        if path:
            return path

        # Common install locations
        search_dirs = [
            os.environ.get('PROGRAMFILES', 'C:\\Program Files'),
            os.environ.get('PROGRAMFILES(X86)', 'C:\\Program Files (x86)'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Programs'),
            os.environ.get('SYSTEMROOT', 'C:\\Windows'),
            os.path.join(os.environ.get('SYSTEMROOT', 'C:\\Windows'), 'System32'),
        ]

        for search_dir in search_dirs:
            if not search_dir or not os.path.exists(search_dir):
                continue
            for root, dirs, files in os.walk(search_dir):
                if exe_name.lower() in [f.lower() for f in files]:
                    return os.path.join(root, exe_name)
                # Don't recurse too deep
                if root.count(os.sep) - search_dir.count(os.sep) > 2:
                    del dirs[:]

        return None


class AutoStart:
    def __init__(self, app_name="WinTrace"):
        self.app_name = app_name
        self.key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"

    def set_autostart(self, enable=True):
        if getattr(sys, 'frozen', False):
            exe_path = sys.executable
        else:
            python_exe = sys.executable
            script_path = os.path.abspath(__file__)
            pythonw = python_exe.replace("python.exe", "pythonw.exe")
            if os.path.exists(pythonw):
                exe_path = f'"{pythonw}" "{script_path}"'
            else:
                exe_path = f'"{python_exe}" "{script_path}"'

        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, self.key_path, 0, winreg.KEY_SET_VALUE)
            if enable:
                winreg.SetValueEx(key, self.app_name, 0, winreg.REG_SZ, exe_path)
            else:
                try:
                    winreg.DeleteValue(key, self.app_name)
                except FileNotFoundError:
                    pass
            winreg.CloseKey(key)
        except Exception as e:
            logger.warning(f"AutoStart error: {e}")

def tracker_loop():
    storage = app_state["storage"]
    tracker = app_state["tracker"]
    break_reminder = app_state.get("break_reminder")
    last_save_time = time.time()

    while app_state["running"]:
        try:
            with data_lock:
                usage_data = app_state["usage_data"]
                tracker.track(usage_data)

            # Update break reminder
            if break_reminder:
                is_idle = tracker.is_idle()
                break_reminder.update(is_idle=is_idle)

            if time.time() - last_save_time > 60:
                with data_lock:
                    storage.save_data(app_state["usage_data"])
                last_save_time = time.time()

            time.sleep(1)
        except Exception as e:
            logger.error(f"Tracker loop error: {e}")

    with data_lock:
        storage.save_data(app_state["usage_data"])

def on_quit(icon, item):
    app_state["running"] = False
    icon.stop()
    if app_state["window"]:
        app_state["window"].destroy()
    sys.exit()

def show_window(icon=None, item=None):
    if app_state["window"]:
        app_state["window"].restore()
        app_state["window"].show()

def setup_tray():
    try:
        icon_path = get_resource_path(os.path.join("assets", "icon.png"))
        if os.path.exists(icon_path):
            image = Image.open(icon_path)
        else:
            image = Image.new('RGB', (64, 64), color=(0, 0, 0))

        # Detect system language for tray menu
        sys_lang = locale.getdefaultlocale()[0]
        is_turkish = sys_lang and sys_lang.startswith('tr')
        show_label = "Göster" if is_turkish else "Show"
        quit_label = "Çıkış" if is_turkish else "Quit"

        menu = pystray.Menu(
            pystray.MenuItem(show_label, show_window, default=True),
            pystray.MenuItem(quit_label, on_quit)
        )
        icon = pystray.Icon("WinTrace", image, "WinTrace", menu)
        app_state["icon"] = icon

        # Wire break reminder notification through tray icon
        br = app_state.get("break_reminder")
        if br:
            def notify_via_tray(title, message):
                try:
                    if app_state.get("icon"):
                        app_state["icon"].notify(message, title)
                except Exception as e:
                    logger.debug(f"Tray notify error: {e}")
            br.set_notify_callback(notify_via_tray)

        icon.run()
    except Exception as e:
        logger.error(f"Tray error: {e}")

def main():
    # 1. Setup Data & Settings
    settings = app_state["settings"]

    auto = AutoStart()
    auto.set_autostart(settings.get("autoStart", True))

    # Select storage backend
    backend = settings.get("storageBackend", "json")
    if backend == "sqlite":
        app_state["storage"] = SQLiteStorage()
        logger.info("Using SQLite storage backend")
    else:
        app_state["storage"] = DataStorage()
        logger.info("Using JSON storage backend")

    app_state["tracker"] = WindowTracker(
        idle_threshold=settings.get("idleThreshold", 180)
    )
    app_state["usage_data"] = app_state["storage"].data

    # Setup break reminder
    br = BreakReminder(
        interval_minutes=settings.get("breakInterval", 45),
        enabled=settings.get("breakReminder", True)
    )
    app_state["break_reminder"] = br

    # 2. Start Tracker Thread
    t_tracker = threading.Thread(target=tracker_loop)
    t_tracker.daemon = True
    t_tracker.start()

    # 3. Start Tray Thread
    t_tray = threading.Thread(target=setup_tray)
    t_tray.daemon = True
    t_tray.start()

    # 4. Determine UI Path
    if getattr(sys, 'frozen', False):
        base_dir = sys._MEIPASS
        ui_dir = os.path.join(base_dir, 'web')
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        ui_dir = os.path.join(base_dir, 'ui', 'dist')

    index_file = os.path.join(ui_dir, 'index.html')
    if not os.path.exists(index_file):
        logger.warning(f"UI not found at {index_file}")

    # 5. Create Window
    api = PythonAPI()
    window = webview.create_window(
        'WinTrace',
        url=f'file:///{index_file}',
        js_api=api,
        width=1000,
        height=700,
        resizable=True,
        hidden=True,
        frameless=True,
        easy_drag=True
    )
    app_state["window"] = window

    # Handle close event to hide instead of destroy
    def on_closing():
        window.hide()
        return False

    window.events.closing += on_closing

    # 6. Start GUI Loop
    webview.start(debug=False)

if __name__ == "__main__":
    main()
