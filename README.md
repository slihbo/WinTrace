# WinTrace

**WinTrace** is a Windows application usage tracker with a beautiful React-based interface. Track your daily computer usage, analyze productivity patterns, and visualize your digital habits.

## Features

- 🕒 **Real-time Tracking**: Automatically tracks active window usage
- 📊 **Beautiful Analytics**: Modern, animated dashboard with detailed statistics
- 📅 **Multiple View Modes**: Daily, Weekly, Monthly, Yearly, and Custom date ranges
- 🏷️ **Smart Categorization**: Automatic app categorization with manual override
- 🌍 **Multilingual**: Supports Turkish and English
- 💾 **Persistent Storage**: Local data storage with category preferences
- 🎨 **Modern UI**: Dark theme with smooth animations and glassmorphism effects

## Download

Download the latest `WinTrace.exe` from the [Releases](../../releases) page. No installation required!

## Building from Source

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/WinTrace.git
   cd WinTrace
   ```

2. **Install Python dependencies**
   ```bash
   pip install pywebview pystray Pillow pywin32
   pip install pyinstaller
   ```

3. **Build the UI**
   ```bash
   cd ui
   npm install
   npm run build
   cd ..
   ```

4. **Build the executable**
   ```bash
   pyinstaller build.spec
   ```

The executable will be created in the `dist/` folder.

## Usage

1. Run `WinTrace.exe`
2. The app will start in the system tray (look for the WinTrace icon)
3. Right-click the tray icon → **Göster** (Show) to open the dashboard
4. View your usage statistics and analyze your productivity
5. Click on any app to change its category

## Data Storage

All data is stored locally:
- **Usage Data**: `%LOCALAPPDATA%\WinTrace\usage_data.json`
- **Category Preferences**: `%LOCALAPPDATA%\WinTrace\user_categories.json`

## Technologies

- **Backend**: Python, pywebview, pystray
- **Frontend**: React, TypeScript, Recharts, Tailwind CSS
- **Build**: Vite, PyInstaller

## License

MIT License - Feel free to use and modify!

## Screenshots

_Add screenshots here_
