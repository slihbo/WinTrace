using Microsoft.UI.Xaml;
using Microsoft.UI.Dispatching;
using RecapTrackerWinUI.Services;
using RecapTrackerWinUI.Models;
using System.Collections.ObjectModel;

namespace RecapTrackerWinUI;

public sealed partial class MainWindow : Window
{
    private readonly WindowTracker _tracker;
    private readonly DataStorage _storage;
    private readonly DispatcherQueueTimer _timer;
    private readonly DispatcherQueueTimer _uiTimer;
    private readonly Dictionary<string, double> _todayData;
    
    public ObservableCollection<AppUsageItem> UsageItems { get; } = new();

    public MainWindow()
    {
        this.InitializeComponent();
        
        // Set date
        DateText.Text = DateTime.Now.ToString("dd MMMM yyyy", new System.Globalization.CultureInfo("tr-TR"));
        
        // Initialize services
        _storage = new DataStorage();
        _tracker = new WindowTracker();
        _todayData = _storage.GetTodayData();
        
        // Bind data
        UsageListView.ItemsSource = UsageItems;
        
        // Setup tracking timer (1 second)
        var queue = DispatcherQueue.GetForCurrentThread();
        _timer = queue.CreateTimer();
        _timer.Interval = TimeSpan.FromSeconds(1);
        _timer.Tick += TrackTick;
        _timer.Start();
        
        // Setup UI refresh timer (1 second)
        _uiTimer = queue.CreateTimer();
        _uiTimer.Interval = TimeSpan.FromSeconds(1);
        _uiTimer.Tick += RefreshUI;
        _uiTimer.Start();
        
        // Initial UI
        RefreshUI(null, null);
        
        // Handle window closing
        this.Closed += MainWindow_Closed;
        
        // Setup auto-start
        AutoStartHelper.EnableAutoStart();
    }

    private void TrackTick(DispatcherQueueTimer sender, object args)
    {
        var appName = _tracker.GetActiveAppName();
        if (!string.IsNullOrEmpty(appName))
        {
            if (_todayData.ContainsKey(appName))
                _todayData[appName] += 1;
            else
                _todayData[appName] = 1;
        }
    }

    private void RefreshUI(DispatcherQueueTimer? sender, object? args)
    {
        UsageItems.Clear();
        
        var sorted = _todayData.OrderByDescending(x => x.Value);
        foreach (var item in sorted)
        {
            UsageItems.Add(new AppUsageItem
            {
                AppName = item.Key,
                Seconds = item.Value
            });
        }
    }

    private void MainWindow_Closed(object sender, WindowEventArgs args)
    {
        _timer.Stop();
        _uiTimer.Stop();
        _storage.SaveTodayData(_todayData);
    }
}
