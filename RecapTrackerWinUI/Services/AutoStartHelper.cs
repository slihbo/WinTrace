using Microsoft.Win32;

namespace RecapTrackerWinUI.Services;

public static class AutoStartHelper
{
    private const string AppName = "RecapTracker";
    private const string RegistryKey = @"SOFTWARE\Microsoft\Windows\CurrentVersion\Run";

    public static void EnableAutoStart()
    {
        try
        {
            var exePath = Environment.ProcessPath;
            if (string.IsNullOrEmpty(exePath))
                return;

            using var key = Registry.CurrentUser.OpenSubKey(RegistryKey, true);
            key?.SetValue(AppName, $"\"{exePath}\"");
        }
        catch
        {
            // Ignore errors
        }
    }

    public static void DisableAutoStart()
    {
        try
        {
            using var key = Registry.CurrentUser.OpenSubKey(RegistryKey, true);
            key?.DeleteValue(AppName, false);
        }
        catch
        {
            // Ignore errors
        }
    }
}
