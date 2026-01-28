using Microsoft.UI.Xaml;

namespace RecapTrackerWinUI;

public partial class App : Application
{
    public static Window? MainWindow { get; private set; }

    public App()
    {
        try {
             System.IO.File.WriteAllText("debug_start.txt", "App Constructor\n");
        } catch {}
        
        this.InitializeComponent();
        
        this.UnhandledException += (s, e) => {
            try {
                System.IO.File.AppendAllText("debug_start.txt", $"Unhandled: {e.Exception}\n");
            } catch {}
        };
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        try {
             System.IO.File.AppendAllText("debug_start.txt", "OnLaunched\n");
             MainWindow = new MainWindow();
             MainWindow.Activate();
             System.IO.File.AppendAllText("debug_start.txt", "Window Activated\n");
        } catch (System.Exception ex) {
             System.IO.File.AppendAllText("debug_start.txt", $"Launch Error: {ex}\n");
        }
    }
}
