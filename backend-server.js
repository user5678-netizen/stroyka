const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Products data
const products = [
  { id: 1, name: 'Цемент М500', price: 450, category: 'Стройматериалы', stock: 150, rating: 4.5 },
  { id: 2, name: 'Кирпич красный', price: 25, category: 'Стройматериалы', stock: 5000, rating: 4.8 },
  { id: 3, name: 'Доска обрезная', price: 850, category: 'Пиломатериалы', stock: 120, rating: 4.3 },
  { id: 4, name: 'Краска акриловая', price: 1200, category: 'Отделочные материалы', stock: 75, rating: 4.7 },
  { id: 5, name: 'Плитка керамическая', price: 850, category: 'Отделочные материалы', stock: 200, rating: 4.6 }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Stroyka Backend API работает',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// All products endpoint
app.get('/products', (req, res) => {
  const category = req.query.category;
  
  let filteredProducts = products;
  if (category) {
    filteredProducts = products.filter(p => p.category === category);
  }
  
  res.json({
    count: filteredProducts.length,
    products: filteredProducts
  });
});

// Single product endpoint
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({
      error: 'Товар не найден',
      message: `Товар с ID ${id} не существует`
    });
  }
});

// Cart endpoint
app.get('/cart', (req, res) => {
  res.json({
    items: [],
    total: 0,
    message: 'Корзина пуста'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
========================================
   🚀 Stroyka Backend API запущен!
========================================
📍 Порт: ${PORT}
🔗 Ссылки:
   http://localhost:${PORT}/health
   http://localhost:${PORT}/products
   http://localhost:${PORT}/products/1
========================================
   Сервер работает без ошибок!
========================================
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔴 Backend сервер остановлен');
  process.exit(0);
});