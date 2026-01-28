[Setup]
AppName=Recap Tracker
AppVersion=1.0
AppPublisher=Salih
DefaultDirName={autopf}\RecapTracker
DefaultGroupName=Recap Tracker
OutputDir=..\..\..\Installer
OutputBaseFilename=RecapTrackerSetup
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=lowest
SetupIconFile=
UninstallDisplayIcon={app}\RecapTrackerWinUI.exe

[Files]
Source: "bin\x64\Release\net9.0-windows10.0.22621.0\win-x64\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Recap Tracker"; Filename: "{app}\RecapTrackerWinUI.exe"
Name: "{group}\Uninstall Recap Tracker"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Recap Tracker"; Filename: "{app}\RecapTrackerWinUI.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Masaüstüne kısayol oluştur"; GroupDescription: "Ek simgeler:"

[Run]
Filename: "{app}\RecapTrackerWinUI.exe"; Description: "Recap Tracker'ı başlat"; Flags: nowait postinstall skipifsilent
