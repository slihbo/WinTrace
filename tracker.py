import win32gui
import win32process
import win32api
import psutil
import time
import ctypes

class WindowTracker:
    def __init__(self, idle_threshold=180, idle_detection_enabled=True):
        """
        idle_threshold: seconds of no user input before considered idle (default: 3 minutes)
        """
        self.active_app = None
        self.last_check_time = time.time()
        self.idle_threshold = idle_threshold
        self.idle_detection_enabled = idle_detection_enabled

    def get_idle_seconds(self):
        """Returns seconds since last user input (mouse/keyboard)."""
        try:
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [
                    ('cbSize', ctypes.c_uint),
                    ('dwTime', ctypes.c_uint),
                ]
            lii = LASTINPUTINFO()
            lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
                millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
                return millis / 1000.0
        except Exception:
            pass
        return 0

    def is_idle(self):
        """Check if user is idle (no input for idle_threshold seconds)."""
        if not self.idle_detection_enabled:
            return False
        return self.get_idle_seconds() >= self.idle_threshold

    def get_active_window_info(self):
        """
        Returns the name of the executable of the currently active window.
        """
        try:
            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return None

            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            try:
                process = psutil.Process(pid)
                app_name = process.name()
                return app_name
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                return None
        except Exception:
            return None

    def track(self, usage_data):
        """
        Track active window usage. Records both total app time and hourly breakdown.
        Skips tracking when user is idle.
        
        Data structure per day:
        {
            "2025-01-28": {
                "apps": {"chrome.exe": 3600, ...},
                "hourly": {"14": {"chrome.exe": 1800, ...}, ...}
            }
        }
        
        Also supports legacy flat format for backward compatibility:
        {
            "2025-01-28": {"chrome.exe": 3600, ...}
        }
        """
        current_time = time.time()
        elapsed = current_time - self.last_check_time
        self.last_check_time = current_time

        # Skip tracking if user is idle
        if self.is_idle():
            return None, 0

        app_name = self.get_active_window_info()

        if app_name:
            from datetime import datetime
            now = datetime.now()
            today = now.strftime("%Y-%m-%d")
            hour = str(now.hour)

            if today not in usage_data:
                usage_data[today] = {"apps": {}, "hourly": {}}

            day_data = usage_data[today]

            # Migration: convert legacy flat format to new format
            if "apps" not in day_data:
                old_data = dict(day_data)
                usage_data[today] = {
                    "apps": old_data,
                    "hourly": {}
                }
                day_data = usage_data[today]

            # Update total app time
            apps = day_data["apps"]
            apps[app_name] = apps.get(app_name, 0) + elapsed

            # Update hourly breakdown
            hourly = day_data.setdefault("hourly", {})
            hour_data = hourly.setdefault(hour, {})
            hour_data[app_name] = hour_data.get(app_name, 0) + elapsed

            return app_name, apps[app_name]
        return None, 0
