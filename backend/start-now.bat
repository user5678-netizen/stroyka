@echo off
echo ========================================
echo    🚀 МГНОВЕННЫЙ ЗАПУСК Stroyka Backend
echo ========================================
echo.
echo Установка Express и запуск сервера...
echo.

cd /d "%~dp0"

REM Установка Express если не установлен
echo [1/3] Проверка зависимостей...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен!
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js обнаружен

REM Установка express и cors
echo [2/3] Установка Express...
npm install express cors --save 2>nul

echo [3/3] Запуск сервера...
echo.
echo ========================================
echo    СЕРВЕР ЗАПУЩЕН!
echo ========================================
echo.
echo Кликните по ссылкам для быстрого доступа:
echo 🌐 http://localhost:3000/api-docs
echo 🩺 http://localhost:3000/health
echo 📦 http://localhost:3000/products
echo.
echo Открываю документацию в браузере...
start http://localhost:3000/api-docs

echo.
echo Сервер запускается...
echo Для остановки закройте это окно или нажмите Ctrl+C
echo.

node simple-server.js

echo.
echo ========================================
echo    СЕРВЕР ОСТАНОВЛЕН
echo ========================================
pause