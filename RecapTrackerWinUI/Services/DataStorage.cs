using System.Text.Json;

namespace RecapTrackerWinUI.Services;

public class DataStorage
{
    private readonly string _dataFolder;
    private readonly string _dataFile;
    private Dictionary<string, Dictionary<string, double>> _allData;

    public DataStorage()
    {
        _dataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "RecapTracker"
        );
        Directory.CreateDirectory(_dataFolder);
        _dataFile = Path.Combine(_dataFolder, "usage_data.json");
        _allData = LoadData();
    }

    private Dictionary<string, Dictionary<string, double>> LoadData()
    {
        if (!File.Exists(_dataFile))
            return new Dictionary<string, Dictionary<string, double>>();

        try
        {
            var json = File.ReadAllText(_dataFile);
            return JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, double>>>(json)
                   ?? new Dictionary<string, Dictionary<string, double>>();
        }
        catch
        {
            return new Dictionary<string, Dictionary<string, double>>();
        }
    }

    public Dictionary<string, double> GetTodayData()
    {
        var today = DateTime.Now.ToString("yyyy-MM-dd");
        if (!_allData.ContainsKey(today))
            _allData[today] = new Dictionary<string, double>();
        return _allData[today];
    }

    public void SaveTodayData(Dictionary<string, double> todayData)
    {
        var today = DateTime.Now.ToString("yyyy-MM-dd");
        _allData[today] = todayData;

        try
        {
            var json = JsonSerializer.Serialize(_allData, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(_dataFile, json);
        }
        catch
        {
            // Ignore write errors
        }
    }
}
