import win32gui
import win32process
import psutil
import time

class WindowTracker:
    def __init__(self):
        self.active_app = None
        self.last_check_time = time.time()

    def get_active_window_info(self):
        """
        Returns the name of the executable of the currently active window.
        """
        try:
            hwnd = win32gui.GetForegroundWindow()
            if not hwnd:
                return None
            
            # active_title = win32gui.GetWindowText(hwnd) # Not needed for now, but good to know
            
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            try:
                process = psutil.Process(pid)
                app_name = process.name()
                return app_name
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                return None
        except Exception as e:
            # print(f"Error getting window info: {e}")
            return None

    def track(self, usage_data):
        current_time = time.time()
        elapsed = current_time - self.last_check_time
        self.last_check_time = current_time

        app_name = self.get_active_window_info()

        if app_name:
            from datetime import datetime
            today = datetime.now().strftime("%Y-%m-%d")
            
            if today not in usage_data:
                usage_data[today] = {}
            
            if app_name in usage_data[today]:
                usage_data[today][app_name] += elapsed
            else:
                usage_data[today][app_name] = elapsed
            
            return app_name, usage_data[today][app_name]
        return None, 0
