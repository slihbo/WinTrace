@echo off
echo Building Recap Tracker...
"C:\Users\salih\AppData\Local\Programs\Python\Python311\Scripts\pyinstaller.exe" --noconfirm --onefile --noconsole --name "RecapTracker" --clean main.py
echo Build complete. Check the dist folder.
pause
