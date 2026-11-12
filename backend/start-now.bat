@echo off
echo ========================================
echo    Stroyka Backend (NestJS)
echo ========================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker not found. Install Docker Desktop, then run:
    echo   docker compose up --build
    pause
    exit /b 1
)

if not exist ".env" (
    copy .env.example .env >nul
    echo Created .env from .env.example
)

echo Starting via Docker Compose...
echo API:     http://localhost:3000
echo Swagger: http://localhost:3000/api-docs
echo Health:  http://localhost:3000/health
echo.
echo Press Ctrl+C to stop.
echo.

docker compose up --build
pause
