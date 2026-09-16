@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
title Install CS ^& AI Mastery

rem Install to a truly local Windows folder, not Documents/OneDrive.
if defined LOCALAPPDATA (
  set "INSTALL_ROOT=%LOCALAPPDATA%\CS-and-AI-Mastery"
) else (
  set "INSTALL_ROOT=%USERPROFILE%\AppData\Local\CS-and-AI-Mastery"
)

for %%A in ("%CD%") do set "SOURCE_DIR=%%~fA"
for %%A in ("%INSTALL_ROOT%") do set "TARGET_DIR=%%~fA"
set "RC=0"

echo.
echo CS ^& AI Mastery - Install on this computer
echo ============================================
echo.
echo The app will be stored locally at:
echo   %TARGET_DIR%
echo.
echo This avoids OneDrive/Documents sync and permission problems.
echo A desktop shortcut will also be created.
echo Your GitHub token is NOT copied into the app folder.
echo.
choice /C YN /N /M "Continue? [Y/N]: "
if errorlevel 2 exit /b 0

if /I "%SOURCE_DIR%"=="%TARGET_DIR%" goto :precache

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%" 2>nul
if not exist "%TARGET_DIR%" goto :copy_failed

set "LOG_FILE=%TEMP%\csai-install-%RANDOM%.log"
rem Preserve any runtime-cache already downloaded by an older installed version.
robocopy "%SOURCE_DIR%" "%TARGET_DIR%" /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /XJ /XD ".git" "node_modules" "runtime-cache" /XF "*.zip" /NFL /NDL /NP /LOG:"%LOG_FILE%"
set "RC=%ERRORLEVEL%"
if !RC! GEQ 8 goto :copy_failed

if not exist "%TARGET_DIR%\START_CSAI.bat" goto :copy_failed
if not exist "%TARGET_DIR%\local-server.js" goto :copy_failed
if not exist "%TARGET_DIR%\desktop-launcher.js" goto :copy_failed
if not exist "%TARGET_DIR%\server-bootstrap.js" goto :copy_failed
if not exist "%TARGET_DIR%\runtime-cache-prepare.js" goto :copy_failed

:precache
rem Prepare heavy browser runtimes once during installation so Run/Check is fast later.
set "NODE_EXE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"
if defined NODE_EXE if exist "%TARGET_DIR%\runtime-cache-prepare.js" (
  echo.
  echo Preparing Python, SQL and C++ runtimes for maximum speed...
  echo This is a one-time cache step. If the internet is unavailable, the app will retry later automatically.
  pushd "%TARGET_DIR%"
  "%NODE_EXE%" runtime-cache-prepare.js
  popd
)

:make_shortcut
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $desktop=[Environment]::GetFolderPath('Desktop'); if(-not $desktop){$desktop=Join-Path $env:USERPROFILE 'Desktop'}; $target=Join-Path $env:LOCALAPPDATA 'CS-and-AI-Mastery\START_CSAI.bat'; $shell=New-Object -ComObject WScript.Shell; $shortcut=$shell.CreateShortcut((Join-Path $desktop 'CS & AI Mastery.lnk')); $shortcut.TargetPath=$target; $shortcut.WorkingDirectory=(Split-Path $target); $shortcut.IconLocation=($env:SystemRoot+'\System32\shell32.dll,220'); $shortcut.Description='Start CS & AI Mastery locally'; $shortcut.Save()"
if errorlevel 1 goto :shortcut_failed

rem Check GitHub CLI without choosing or verifying any repository.
where gh >nul 2>nul
if errorlevel 1 (
  echo.
  echo GitHub CLI is not installed. The website still works normally.
  echo Use the GitHub page later if you want to connect a GitHub account and repository.
) else (
  gh auth status >nul 2>nul
  if errorlevel 1 (
    echo.
    echo GitHub CLI is installed but not signed in. GitHub remains optional.
    echo Connect later from the GitHub page in the website.
  ) else (
    echo.
    echo GitHub CLI connection: signed in.
    echo No repository is selected automatically; choose one on the GitHub page.
  )
)

echo.
echo Installation complete.
echo.
echo Installed app:
echo   %TARGET_DIR%
echo.
echo Desktop shortcut:
echo   CS ^& AI Mastery
echo.
echo If you connect GitHub, its login remains on this computer and is never copied into the app.
echo You may delete the downloaded ZIP and extracted download copy after this.
echo.
choice /C YN /N /M "Start CS & AI Mastery now? [Y/N]: "
if errorlevel 2 exit /b 0
start "CS & AI Mastery" "%TARGET_DIR%\START_CSAI.bat"
exit /b 0

:copy_failed
echo.
echo Installation could not copy all required files.
echo.
echo Source:
echo   %SOURCE_DIR%
echo Target:
echo   %TARGET_DIR%
echo Robocopy result code: !RC!
echo.
if defined LOG_FILE if exist "!LOG_FILE!" (
  echo Opening the copy log so the exact Windows error is visible...
  start "" notepad.exe "!LOG_FILE!"
)
echo.
echo Make sure no older CS ^& AI Mastery installer is currently running, then try again.
pause
exit /b 1

:shortcut_failed
echo.
echo The app was copied successfully, but Windows could not create the desktop shortcut.
echo You can still start it from:
echo   %TARGET_DIR%\START_CSAI.bat
pause
exit /b 1
