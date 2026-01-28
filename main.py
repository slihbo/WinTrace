import time
import sys
import winreg
import os
import threading
import json
from datetime import datetime, timedelta
import webview
import pystray
from PIL import Image
from tracker import WindowTracker
from storage import DataStorage
from categories import get_category, save_custom_category
import win32gui
import win32con

# Global Application State
app_state = {
    "running": True,
    "storage": None,
    "tracker": None,
    "usage_data": None,
    "window": None,
    "icon": None
}

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)


class PythonAPI:
    def log(self, value):
        print(str(value))

    def set_category(self, app_id, category):
        """
        Updates the category for a specific app (by exe name/id).
        """
        try:
            save_custom_category(app_id, category)
            # We might want to trigger a UI refresh here, or just let the UI assume success and refresh next time
            return True
        except Exception as e:
            print(f"Error setting category: {e}")
            return False



    def get_daily_stats(self, date_str, view_mode, custom_range=None):
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
                    for app, duration in data[d_str].items():
                        total_seconds += duration
                        app_usage[app] = app_usage.get(app, 0) + duration
                current += timedelta(days=1)
            
            # Format apps
            apps_list = []
            for app, duration in app_usage.items():
                clean_name = app[:-4] if app.lower().endswith('.exe') else app
                # Capitalize first letter
                display_name = clean_name[0].upper() + clean_name[1:] if clean_name else clean_name
                
                apps_list.append({
                    "id": app,
                    "name": display_name,
                    "durationSeconds": int(duration),
                    "icon": None, 
                    "category": get_category(app),
                    "isProductive": True # TODO: Implement productivity logic
                })
            
            apps_list.sort(key=lambda x: x["durationSeconds"], reverse=True)
            
            return {
                "date": start_date.strftime("%d %B %Y") if start_date == end_date else f"{start_date.strftime('%d.%m')} - {end_date.strftime('%d.%m.%Y')}",
                "viewMode": view_mode,
                "totalDurationSeconds": int(total_seconds),
                "productivityScore": 85, # Mock score
                "apps": apps_list
            }

        # Logic based on ViewMode
        if view_mode == 'daily':
            return get_stats_for_range(target_date, target_date)
            
        elif view_mode == 'weekly':
            # Find start of week (Monday)
            start_of_week = target_date - timedelta(days=target_date.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            return get_stats_for_range(start_of_week, end_of_week)
            
        elif view_mode == 'monthly':
            # Start of month
            start_of_month = target_date.replace(day=1)
            # End of month
            next_month = start_of_month.replace(day=28) + timedelta(days=4)
            end_of_month = next_month - timedelta(days=next_month.day)
            return get_stats_for_range(start_of_month, end_of_month)

        elif view_mode == 'yearly':
            # Start of year
            start_of_year = target_date.replace(month=1, day=1)
            # End of year
            end_of_year = start_of_year.replace(year=start_of_year.year + 1) - timedelta(days=1)
            return get_stats_for_range(start_of_year, end_of_year)
            
        elif view_mode == 'custom' and custom_range:
            try:
                start = datetime.fromisoformat(custom_range['start'].replace("Z", "+00:00")).date()
                end = datetime.fromisoformat(custom_range['end'].replace("Z", "+00:00")).date()
                return get_stats_for_range(start, end)
            except:
                pass
        
        # Fallback
        return get_stats_for_range(target_date, target_date)

    def get_yearly_recap(self):
        data = app_state["usage_data"]
        current_year = datetime.now().year
        
        total_seconds = 0
        app_usage = {}
        monthly_stats = {i: 0 for i in range(1, 13)}

        weekend_seconds = 0
        weekday_seconds = 0
        
        # Daily averages setup
        # 0=Monday, 6=Sunday
        daily_sums = {i: 0 for i in range(7)}
        daily_counts = {i: 0 for i in range(7)}

        for date_str, apps in data.items():
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                if date_obj.year == current_year:
                    # Daily sum
                    daily_total = sum(apps.values())
                    total_seconds += daily_total
                    
                    # Monthly sum
                    monthly_stats[date_obj.month] += daily_total

                    # Weekend vs Weekday
                    # 5=Saturday, 6=Sunday
                    if date_obj.weekday() >= 5:
                        weekend_seconds += daily_total
                    else:
                        weekday_seconds += daily_total

                    # Daily Average Accumulation
                    day_idx = date_obj.weekday()
                    daily_sums[day_idx] += daily_total
                    daily_counts[day_idx] += 1

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
            
            apps_list.append({
                "name": display_name,
                "durationSeconds": int(duration),
                "category": get_category(app),
                "isProductive": True,
                "id": app 
            })
        
        apps_list.sort(key=lambda x: x["durationSeconds"], reverse=True)
        top_app = apps_list[0] if apps_list else None

        # Process Monthly (convert to list for UI)
        # 1-12
        monthly_usage_list = []
        for i in range(1, 13):
            # Do not divide by 0 if no seconds
            hours = int(monthly_stats[i] / 3600)
            monthly_usage_list.append({"month": i, "hours": hours})

        # Calculate Weekend Percentage
        total_tracked = weekend_seconds + weekday_seconds
        weekend_pct = int((weekend_seconds / total_tracked) * 100) if total_tracked > 0 else 0

        # Calculate Daily Averages
        # 0=Monday
        daily_averages = []
        for i in range(7):
            avg_sec = daily_sums[i] / daily_counts[i] if daily_counts[i] > 0 else 0
            daily_averages.append({
                "day": i,
                "hours": round(avg_sec / 3600, 1) # Round to 1 decimal
            })

        # Calculate Most Productive Day Index
        most_productive_day_idx = max(daily_averages, key=lambda x: x['hours'])['day'] if total_seconds > 0 else 0

        # Calculate Top Category
        category_sums = {}
        for app_data in apps_list:
             cat = app_data["category"]
             category_sums[cat] = category_sums.get(cat, 0) + app_data["durationSeconds"]
        
        
        top_category_name = "Other"
        if category_sums:
            top_category_name = max(category_sums, key=category_sums.get)
        
        # Calculate category breakdown (top 5 with percentages)
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
            "peakHour": "14:00", # Placeholder
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
            print(f"Drag error: {e}")


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
        except Exception:
            pass

def tracker_loop():
    storage = app_state["storage"]
    tracker = app_state["tracker"]
    usage_data = app_state["usage_data"]
    last_save_time = time.time()
    
    while app_state["running"]:
        try:
            tracker.track(usage_data)
            if time.time() - last_save_time > 60:
                storage.save_data(usage_data)
                last_save_time = time.time()
            time.sleep(1)
        except Exception:
            pass
    storage.save_data(usage_data)

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
            # Fallback icon
            image = Image.new('RGB', (64, 64), color = (0, 0, 0))
        
        menu = pystray.Menu(
            pystray.MenuItem("Göster", show_window, default=True),
            pystray.MenuItem("Çıkış", on_quit)
        )
        icon = pystray.Icon("WinTrace", image, "WinTrace", menu)
        app_state["icon"] = icon
        icon.run()
    except Exception as e:
        print(f"Tray error: {e}")

def main():
    # 1. Setup Data
    auto = AutoStart()
    auto.set_autostart(True)
    
    app_state["storage"] = DataStorage()
    app_state["tracker"] = WindowTracker()
    app_state["usage_data"] = app_state["storage"].data
    
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
        ui_dir = os.path.join(base_dir, 'web') # mapped in spec file
    else:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        ui_dir = os.path.join(base_dir, 'ui', 'dist')

    index_file = os.path.join(ui_dir, 'index.html')
    if not os.path.exists(index_file):
        print(f"UI not found at {index_file}")
        # Fallback to URL if needed for dev (optional)
    
    # 5. Create Window (Hidden initially if possible, or minimize)
    api = PythonAPI()
    window = webview.create_window(
        'WinTrace', 
        url=f'file:///{index_file}',
        js_api=api,
        width=1000,
        height=700,
        resizable=True,
        hidden=True, # Start hidden
        frameless=True, # Frameless for transparent title bar
        easy_drag=True # Enable easy drag as fallback
    )
    app_state["window"] = window
    
    # Handle close event to hide instead of destroy
    def on_closing():
        window.hide()
        return False # Prevent close
    
    window.events.closing += on_closing

    # 6. Start GUI Loop
    webview.start(debug=False)

if __name__ == "__main__":
    main()
