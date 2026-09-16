@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title CS ^& AI Mastery Launcher

set "NODE_EXE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if exist "%LocalAppData%\Programs\nodejs\node.exe" set "NODE_EXE=%LocalAppData%\Programs\nodejs\node.exe"

if not defined NODE_EXE (
  echo.
  echo Node.js is needed to run CS ^& AI Mastery locally.
  echo.
  where winget >nul 2>nul
  if errorlevel 1 goto :no_node
  choice /C YN /N /M "Install the official Node.js LTS package now? [Y/N]: "
  if errorlevel 2 goto :no_node
  winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
  if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
  if not defined NODE_EXE (
    echo.
    echo Node.js was installed, but Windows needs a PATH refresh.
    echo Close this window and double-click CS ^& AI Mastery again.
    pause
    exit /b 0
  )
)

"%NODE_EXE%" -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)" >nul 2>nul
if errorlevel 1 goto :bad_node

"%NODE_EXE%" desktop-launcher.js
if errorlevel 1 (
  echo.
  echo CS ^& AI Mastery could not start. The error above was saved in csai-server.log when available.
  pause
  exit /b 1
)
exit /b 0

:bad_node
echo.
echo Node.js 20 or newer is required.
echo Please update Node.js, then run this launcher again.
pause
exit /b 1

:no_node
echo.
echo Node.js was not found. Install Node.js LTS, then run this launcher again.
pause
exit /b 1
