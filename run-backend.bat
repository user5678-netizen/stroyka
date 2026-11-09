@echo off
echo ========================================
echo    🚀 Запуск Stroyka Backend API
echo ========================================
echo.
echo Проверка Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Ошибка: Node.js не установлен
    echo Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js обнаружен
echo.
echo Проверка зависимостей...
cd /d "%~dp0"
npm list express >nul 2>nul
if %errorlevel% neq 0 (
    echo Установка Express и Cors...
    npm install express cors
) else (
    echo ✅ Зависимости уже установлены
)

echo.
echo Проверка порта 3001...
netstat -ano | findstr :3001 >nul
if %errorlevel% equ 0 (
    echo ⚠ Порт 3001 занят, пытаемся освободить...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :3001') do (
        taskkill /PID %%i /F >nul 2>nul
    )
    timeout /t 2 /nobreak >nul
)

echo.
echo ========================================
echo    🎉 Запускаю Backend API...
echo ========================================
echo.
echo Ссылки для тестирования:
echo.
echo 📍 http://localhost:3001/health
echo 📍 http://localhost:3001/products
echo 📍 http://localhost:3001/products/1
echo.
echo Открываю health check в браузере...
start http://localhost:3001/health
echo.
echo Сервер запущен и работает!
echo Для остановки нажмите Ctrl+C
echo.

node backend-server.js

echo.
echo ========================================
echo    🔴 Backend остановлен
echo ========================================
pause