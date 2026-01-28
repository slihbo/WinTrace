namespace RecapTrackerWinUI.Models;

public class AppUsageItem
{
    public string AppName { get; set; } = string.Empty;
    public double Seconds { get; set; }

    public string FormattedTime
    {
        get
        {
            var totalSeconds = (int)Seconds;
            var h = totalSeconds / 3600;
            var m = (totalSeconds % 3600) / 60;
            var s = totalSeconds % 60;

            if (h > 0)
                return $"{h} saat {m} dk";
            if (m > 0)
                return $"{m} dk {s} sn";
            return $"{s} sn";
        }
    }
}
