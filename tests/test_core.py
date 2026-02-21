"""
Unit tests for WinTrace core modules.
Run with: python -m pytest tests/ -v
"""
import pytest
import os
import sys
import json
import tempfile
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


# ==========================================
# Tests for categories.py
# ==========================================

class TestCategories:
    def test_known_browser(self):
        from categories import get_category
        assert get_category("chrome.exe") == "Browsing"
        assert get_category("firefox.exe") == "Browsing"
        assert get_category("msedge.exe") == "Browsing"

    def test_known_dev_tool(self):
        from categories import get_category
        assert get_category("code.exe") == "Development"

    def test_known_communication(self):
        from categories import get_category
        assert get_category("discord.exe") == "Communication"

    def test_known_productivity(self):
        from categories import get_category
        assert get_category("winword.exe") == "Productivity"

    def test_known_entertainment(self):
        from categories import get_category
        assert get_category("spotify.exe") == "Entertainment"

    def test_known_game(self):
        from categories import get_category
        assert get_category("steam.exe") == "Games"

    def test_unknown_app_returns_other(self):
        from categories import get_category
        assert get_category("totally_unknown_app_xyz.exe") == "Other"

    def test_case_insensitive(self):
        from categories import get_category
        assert get_category("Chrome.exe") == "Browsing"
        assert get_category("CHROME.EXE") == "Browsing"

    def test_save_custom_category(self):
        from categories import save_custom_category, get_category
        # Save a custom category
        save_custom_category("test_custom_app.exe", "Development")
        assert get_category("test_custom_app.exe") == "Development"

    def test_category_values(self):
        """All categories should be one of the known types."""
        from categories import APP_CATEGORIES
        known = {"Browsing", "Development", "Communication", "Productivity",
                 "Entertainment", "Games", "System", "DesignMedia", "Cloud", "Other"}
        for app, cat in APP_CATEGORIES.items():
            assert cat in known, f"Unknown category '{cat}' for '{app}'"


# ==========================================
# Tests for storage.py
# ==========================================

class TestStorage:
    def test_load_empty(self):
        """Should return empty dict when no data file exists."""
        from storage import DataStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                s = DataStorage()
                assert s.data == {}
            finally:
                os.chdir(original_dir)

    def test_save_and_load(self):
        """Should persist data correctly."""
        from storage import DataStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                s = DataStorage()
                test_data = {
                    "2025-01-15": {
                        "apps": {"chrome.exe": 3600},
                        "hourly": {"14": {"chrome.exe": 3600}}
                    }
                }
                s.save_data(test_data)

                s2 = DataStorage()
                assert "2025-01-15" in s2.data
                assert s2.data["2025-01-15"]["apps"]["chrome.exe"] == 3600
            finally:
                os.chdir(original_dir)

    def test_legacy_migration(self):
        """Should migrate legacy flat format to new format."""
        from storage import DataStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                # Write legacy format
                legacy_data = {
                    "2025-01-15": {"chrome.exe": 3600, "code.exe": 1800}
                }
                with open("usage_data.json", "w") as f:
                    json.dump(legacy_data, f)

                s = DataStorage()
                # Should be migrated to new format
                day = s.data["2025-01-15"]
                assert "apps" in day
                assert "hourly" in day
                assert day["apps"]["chrome.exe"] == 3600
            finally:
                os.chdir(original_dir)


# ==========================================
# Tests for notifications.py
# ==========================================

class TestBreakReminder:
    def test_initial_state(self):
        from notifications import BreakReminder
        br = BreakReminder(interval_minutes=1)
        assert br.continuous_active_seconds == 0
        assert br.enabled is True

    def test_disabled_does_nothing(self):
        from notifications import BreakReminder
        br = BreakReminder(interval_minutes=1, enabled=False)
        for _ in range(120):
            br.update(is_idle=False)
        assert br.continuous_active_seconds == 0

    def test_idle_resets_counter(self):
        from notifications import BreakReminder
        br = BreakReminder(interval_minutes=1)
        for _ in range(30):
            br.update(is_idle=False)
        assert br.continuous_active_seconds == 30
        br.update(is_idle=True)
        assert br.continuous_active_seconds == 0

    def test_triggers_notification(self):
        from notifications import BreakReminder
        notified = []
        br = BreakReminder(interval_minutes=1)
        br.set_notify_callback(lambda t, m: notified.append((t, m)))

        # Simulate 60 seconds of activity
        for _ in range(60):
            br.update(is_idle=False)

        assert len(notified) == 1

    def test_reset(self):
        from notifications import BreakReminder
        br = BreakReminder(interval_minutes=1)
        for _ in range(30):
            br.update(is_idle=False)
        br.reset()
        assert br.continuous_active_seconds == 0


# ==========================================
# Tests for sqlite_storage.py
# ==========================================

class TestSQLiteStorage:
    def test_init_creates_db(self):
        from sqlite_storage import SQLiteStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                s = SQLiteStorage()
                assert os.path.exists("usage_data.db")
                assert s.data == {}
            finally:
                os.chdir(original_dir)

    def test_save_and_load(self):
        from sqlite_storage import SQLiteStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                s = SQLiteStorage()
                test_data = {
                    "2025-06-15": {
                        "apps": {"chrome.exe": 1800},
                        "hourly": {"10": {"chrome.exe": 1800}}
                    }
                }
                s.data = test_data
                s.save_data(test_data)

                # Reload
                s2 = SQLiteStorage()
                assert "2025-06-15" in s2.data
                assert s2.data["2025-06-15"]["apps"]["chrome.exe"] == 1800
            finally:
                os.chdir(original_dir)

    def test_json_migration(self):
        from sqlite_storage import SQLiteStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                # Create JSON data file
                json_data = {
                    "2025-03-10": {
                        "apps": {"code.exe": 7200},
                        "hourly": {"9": {"code.exe": 3600}, "10": {"code.exe": 3600}}
                    }
                }
                with open("usage_data.json", "w") as f:
                    json.dump(json_data, f)

                s = SQLiteStorage()
                assert "2025-03-10" in s.data
                assert s.data["2025-03-10"]["apps"]["code.exe"] == 7200
            finally:
                os.chdir(original_dir)

    def test_get_total_records(self):
        from sqlite_storage import SQLiteStorage
        with tempfile.TemporaryDirectory() as tmpdir:
            original_dir = os.getcwd()
            try:
                os.chdir(tmpdir)
                s = SQLiteStorage()
                test_data = {
                    "2025-01-01": {"apps": {"a.exe": 100}, "hourly": {"0": {"a.exe": 100}}},
                    "2025-01-02": {"apps": {"b.exe": 200}, "hourly": {"1": {"b.exe": 200}}},
                }
                s.save_data(test_data)
                # Reload to query
                s2 = SQLiteStorage()
                assert s2.get_total_records() == 2
            finally:
                os.chdir(original_dir)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
