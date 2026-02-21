"""
Break reminder / notification system for WinTrace.
Uses pystray notifications to alert users after continuous usage.
"""
import time
import threading
import logging

logger = logging.getLogger(__name__)


class BreakReminder:
    """
    Monitors continuous active usage and sends break reminders.
    Triggers a notification after `interval_minutes` of continuous usage.
    Resets when user goes idle or dismisses.
    """

    def __init__(self, interval_minutes=45, enabled=True):
        self.interval_minutes = interval_minutes
        self.enabled = enabled
        self.continuous_active_seconds = 0
        self._last_reminded_at = 0
        self._notify_callback = None
        self._running = False

    def set_notify_callback(self, callback):
        """Set callback function: callback(title, message)"""
        self._notify_callback = callback

    def update(self, is_idle):
        """
        Called every tracking tick (~1 second).
        Tracks continuous active time and triggers break reminder.
        """
        if not self.enabled:
            return

        if is_idle:
            # Reset on idle
            self.continuous_active_seconds = 0
            self._last_reminded_at = 0
            return

        self.continuous_active_seconds += 1
        interval_seconds = self.interval_minutes * 60

        if interval_seconds <= 0:
            return

        # Check if we should remind
        if (self.continuous_active_seconds >= interval_seconds and
                self.continuous_active_seconds - self._last_reminded_at >= interval_seconds):
            self._last_reminded_at = self.continuous_active_seconds
            self._send_reminder()

    def _send_reminder(self):
        """Send break reminder notification."""
        minutes_active = int(self.continuous_active_seconds / 60)

        # Detect language
        try:
            import locale
            lang = locale.getdefaultlocale()[0]
            is_turkish = lang and lang.startswith('tr')
        except Exception:
            is_turkish = False

        if is_turkish:
            title = "🧘 Mola Zamanı!"
            message = f"{minutes_active} dakikadır kesintisiz çalışıyorsun. Kısa bir mola ver!"
        else:
            title = "🧘 Break Time!"
            message = f"You've been active for {minutes_active} minutes straight. Take a short break!"

        logger.info(f"Break reminder: {minutes_active} minutes continuous usage")

        if self._notify_callback:
            try:
                self._notify_callback(title, message)
            except Exception as e:
                logger.debug(f"Notification callback error: {e}")

    def reset(self):
        """Reset continuous usage counter."""
        self.continuous_active_seconds = 0
        self._last_reminded_at = 0
