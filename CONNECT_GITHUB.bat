@echo off
setlocal
cd /d "%~dp0"
title CS ^& AI Mastery - Connect GitHub Locally

echo.
echo CS ^& AI Mastery - Local GitHub
echo ======================================
echo.
where gh >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI is not installed yet.
  echo.
  echo Run this ONE-TIME command in PowerShell or Windows Terminal:
  echo.
  echo   winget install --id GitHub.cli --exact
  echo.
  echo After it finishes, close and reopen this window, then run CONNECT_GITHUB.bat again.
  echo Your GitHub token will NOT be stored inside the CS ^& AI Mastery project.
  echo.
  pause
  exit /b 1
)

gh auth status >nul 2>nul
if not errorlevel 1 (
  echo GitHub CLI is already signed in.
  gh auth status
  echo.
  echo You can return to CS ^& AI Mastery and refresh the page.
  pause
  exit /b 0
)

echo A GitHub browser sign-in will start now.
echo Complete the prompts and authorize GitHub CLI.
echo.
gh auth login --web --git-protocol https
if errorlevel 1 (
  echo.
  echo GitHub sign-in did not complete. You can run this file again anytime.
  pause
  exit /b 1
)

echo.
echo GitHub is connected locally. Return to CS ^& AI Mastery and refresh the page.
pause
