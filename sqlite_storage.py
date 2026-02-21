"""
SQLite-based storage for WinTrace.
Drop-in replacement for JSON-based DataStorage with automatic migration.
"""
import sqlite3
import os
import sys
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class SQLiteStorage:
    """
    SQLite storage backend for usage data.
    Provides the same interface as DataStorage (JSON-based) but uses SQLite.
    """

    def __init__(self):
        self.db_path = self._get_db_path()
        self.data = {}  # In-memory cache for compatibility
        self._init_db()
        self._migrate_from_json()
        self._load_data()

    def _get_db_path(self):
        if getattr(sys, 'frozen', False):
            app_data = os.getenv('LOCALAPPDATA')
            data_dir = os.path.join(app_data, 'WinTrace')
            os.makedirs(data_dir, exist_ok=True)
            return os.path.join(data_dir, 'usage_data.db')
        return 'usage_data.db'

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        return conn

    def _init_db(self):
        """Initialize database schema."""
        try:
            conn = self._get_connection()
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS app_usage (
                    date TEXT NOT NULL,
                    hour INTEGER NOT NULL,
                    app_name TEXT NOT NULL,
                    duration_seconds REAL NOT NULL DEFAULT 0,
                    PRIMARY KEY (date, hour, app_name)
                );

                CREATE INDEX IF NOT EXISTS idx_date ON app_usage(date);
                CREATE INDEX IF NOT EXISTS idx_app ON app_usage(app_name);
            """)
            conn.commit()
            conn.close()
            logger.info(f"SQLite database initialized at {self.db_path}")
        except Exception as e:
            logger.error(f"Error initializing SQLite: {e}")

    def _migrate_from_json(self):
        """Migrate existing JSON data to SQLite if JSON file exists."""
        # Determine JSON path
        if getattr(sys, 'frozen', False):
            app_data = os.getenv('LOCALAPPDATA')
            json_path = os.path.join(app_data, 'WinTrace', 'usage_data.json')
        else:
            json_path = 'usage_data.json'

        if not os.path.exists(json_path):
            return

        # Check if migration already done
        migrated_flag = json_path + '.migrated'
        if os.path.exists(migrated_flag):
            return

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)

            if not json_data:
                return

            conn = self._get_connection()
            cursor = conn.cursor()

            count = 0
            for date_str, day_data in json_data.items():
                if isinstance(day_data, dict):
                    # New format: {apps: {...}, hourly: {...}}
                    if 'hourly' in day_data:
                        for hour_str, apps in day_data['hourly'].items():
                            for app, dur in apps.items():
                                cursor.execute(
                                    "INSERT OR REPLACE INTO app_usage (date, hour, app_name, duration_seconds) VALUES (?, ?, ?, ?)",
                                    (date_str, int(hour_str), app, dur)
                                )
                                count += 1
                    elif 'apps' in day_data:
                        # Has apps but no hourly — put all in hour 0
                        for app, dur in day_data['apps'].items():
                            cursor.execute(
                                "INSERT OR REPLACE INTO app_usage (date, hour, app_name, duration_seconds) VALUES (?, ?, ?, ?)",
                                (date_str, 0, app, dur)
                            )
                            count += 1
                    else:
                        # Legacy flat format: {app: duration}
                        for app, dur in day_data.items():
                            cursor.execute(
                                "INSERT OR REPLACE INTO app_usage (date, hour, app_name, duration_seconds) VALUES (?, ?, ?, ?)",
                                (date_str, 0, app, dur)
                            )
                            count += 1

            conn.commit()
            conn.close()

            # Mark migration as done
            with open(migrated_flag, 'w') as f:
                f.write(datetime.now().isoformat())

            logger.info(f"Migrated {count} records from JSON to SQLite")

        except Exception as e:
            logger.error(f"JSON to SQLite migration error: {e}")

    def _load_data(self):
        """Load all data from SQLite into memory dict for API compatibility."""
        try:
            conn = self._get_connection()
            cursor = conn.execute(
                "SELECT date, hour, app_name, duration_seconds FROM app_usage ORDER BY date"
            )

            self.data = {}
            for date_str, hour, app_name, duration in cursor:
                if date_str not in self.data:
                    self.data[date_str] = {"apps": {}, "hourly": {}}

                # Aggregate into apps total
                apps = self.data[date_str]["apps"]
                apps[app_name] = apps.get(app_name, 0) + duration

                # Store hourly breakdown
                hourly = self.data[date_str]["hourly"]
                h_str = str(hour)
                if h_str not in hourly:
                    hourly[h_str] = {}
                hourly[h_str][app_name] = hourly[h_str].get(app_name, 0) + duration

            conn.close()
        except Exception as e:
            logger.error(f"Error loading SQLite data: {e}")
            self.data = {}

    def save_data(self, data=None):
        """
        Save current in-memory data to SQLite.
        Performs an incremental upsert of the data dict.
        """
        if data is None:
            data = self.data

        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            for date_str, day_data in data.items():
                if isinstance(day_data, dict) and 'hourly' in day_data:
                    for hour_str, apps in day_data['hourly'].items():
                        for app, dur in apps.items():
                            cursor.execute(
                                "INSERT OR REPLACE INTO app_usage (date, hour, app_name, duration_seconds) VALUES (?, ?, ?, ?)",
                                (date_str, int(hour_str), app, dur)
                            )
                elif isinstance(day_data, dict) and 'apps' in day_data:
                    for app, dur in day_data['apps'].items():
                        cursor.execute(
                            "INSERT OR REPLACE INTO app_usage (date, hour, app_name, duration_seconds) VALUES (?, ?, ?, ?)",
                            (date_str, 0, app, dur)
                        )
                elif isinstance(day_data, dict):
                    for app, dur in day_data.items():
                        cursor.execute(
                            "INSERT OR REPLACE INTO app_usage (date, hour, app_name, duration_seconds) VALUES (?, ?, ?, ?)",
                            (date_str, 0, app, dur)
                        )

            conn.commit()
            conn.close()
        except Exception as e:
            logger.error(f"Error saving to SQLite: {e}")

    def get_date_range(self):
        """Get the earliest and latest dates in the database."""
        try:
            conn = self._get_connection()
            cursor = conn.execute("SELECT MIN(date), MAX(date) FROM app_usage")
            row = cursor.fetchone()
            conn.close()
            if row and row[0]:
                return row[0], row[1]
        except Exception as e:
            logger.error(f"Error getting date range: {e}")
        return None, None

    def get_total_records(self):
        """Get total number of unique date records."""
        try:
            conn = self._get_connection()
            cursor = conn.execute("SELECT COUNT(DISTINCT date) FROM app_usage")
            count = cursor.fetchone()[0]
            conn.close()
            return count
        except Exception as e:
            logger.error(f"Error counting records: {e}")
            return 0
