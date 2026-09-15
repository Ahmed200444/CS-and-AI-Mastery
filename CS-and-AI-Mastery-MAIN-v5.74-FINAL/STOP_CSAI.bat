@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Stop CS ^& AI Mastery

if not exist ".csai-server.pid" (
  echo No CS ^& AI Mastery background server PID was found.
  echo If a very old black START_SITE window is open, close that window manually.
  pause
  exit /b 0
)
set /p CSAI_PID=<".csai-server.pid"
if not defined CSAI_PID goto :done

tasklist /FI "PID eq %CSAI_PID%" 2>nul | find "%CSAI_PID%" >nul
if errorlevel 1 goto :done

taskkill /PID %CSAI_PID% /T /F >nul 2>nul
if errorlevel 1 (
  echo Could not stop PID %CSAI_PID%.
  pause
  exit /b 1
)
echo CS ^& AI Mastery local server stopped.
:done
del /q ".csai-server.pid" >nul 2>nul
exit /b 0
