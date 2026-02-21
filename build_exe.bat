@echo off
echo Building WinTrace...
pyinstaller --noconfirm --onefile --noconsole --name "WinTrace" --clean main.py
echo Build complete. Check the dist folder.
pause
