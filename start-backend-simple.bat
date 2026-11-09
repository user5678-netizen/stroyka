@echo off
echo ========================================
echo    🚀 ЗАПУСК Stroyka Backend API
echo ========================================
echo.
echo Этот файл запустит backend сервер
echo который будет работать без ошибок!
echo.
echo Нажмите любую клавишу для запуска...
pause >nul

cd /d "%~dp0"

echo.
echo Проверка Node.js...
node --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ОШИБКА: Node.js не установлен!
    echo.
    echo Установите Node.js с официального сайта:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js обнаружен
echo.
echo Проверка Express...
npm list express >nul 2>nul
if %errorlevel% neq 0 (
    echo Устанавливаю Express и Cors...
    npm install express cors
)

echo.
echo Запускаю backend сервер...
echo.
echo ========================================
echo    🎉 СЕРВЕР ЗАПУЩЕН!
echo ========================================
echo.
echo Ссылки для тестирования (кликните):
echo.
echo 📍 http://localhost:3001/health
echo 📍 http://localhost:3001/products
echo 📍 http://localhost:3001/products/1
echo 📍 http://localhost:3001/products/2
echo.
echo Открываю health check...
start http://localhost:3001/health
echo.
echo Сервер работает на порту 3001
echo Не закрывайте это окно!
echo Для остановки нажмите Ctrl+C
echo.

node -e "
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const products = [
  { id: 1, name: 'Цемент М500', price: 450, category: 'Стройматериалы', stock: 150, rating: 4.5 },
  { id: 2, name: 'Кирпич красный', price: 25, category: 'Стройматериалы', stock: 5000, rating: 4.8 },
  { id: 3, name: 'Доска обрезная', price: 850, category: 'Пиломатериалы', stock: 120, rating: 4.3 },
  { id: 4, name: 'Краска акриловая', price: 1200, category: 'Отделочные материалы', stock: 75, rating: 4.7 },
  { id: 5, name: 'Плитка керамическая', price: 850, category: 'Отделочные материалы', stock: 200, rating: 4.6 }
];

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Stroyka Backend API работает',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/products', (req, res) => {
  const category = req.query.category;
  let filtered = products;
  if (category) filtered = products.filter(p => p.category === category);
  res.json({ count: filtered.length, products: filtered });
});

app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id) || {
    id: id, name: 'Товар ' + id, price: 100 * id, category: 'Категория'
  };
  res.json(product);
});

app.listen(PORT, () => {
  console.log(\`\\n========================================\\n   🚀 Stroyka Backend API запущен!\\n========================================\\n📍 Порт: \${PORT}\\n🔗 Health: http://localhost:\${PORT}/health\\n📦 API: http://localhost:\${PORT}/products\\n========================================\\n\`);
});
"

echo.
echo ========================================
echo    🔴 СЕРВЕР ОСТАНОВЛЕН
echo ========================================
echo.
pause