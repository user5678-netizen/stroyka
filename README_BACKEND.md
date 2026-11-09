# 🏗️ Stroyka Backend API - Быстрый запуск

## 🚀 Мгновенный запуск

### Вариант 1: Самый простой (рекомендуется)

1. Перейдите в папку `backend`
2. Дважды кликните по файлу **`LAUNCH_ME.bat`**
3. Сервер запустится автоматически

### Вариант 2: PowerShell

```powershell
cd backend
.\LAUNCH_ME.bat
```

## 🔗 Ссылки после запуска

После запуска сервера будут доступны:

| Ссылка                                                                     | Описание                    |
| -------------------------------------------------------------------------------- | ----------------------------------- |
| 🌐 **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**     | API документация        |
| 🩺 **[http://localhost:3000/health](http://localhost:3000/health)**         | Проверка состояния |
| 📦 **[http://localhost:3000/products](http://localhost:3000/products)**     | Все товары                 |
| 🔍 **[http://localhost:3000/products/1](http://localhost:3000/products/1)** | Товар #1                       |
| 🔍 **[http://localhost:3000/products/2](http://localhost:3000/products/2)** | Товар #2                       |

## 📚 Доступные API эндпоинты

### Health Check

```
GET http://localhost:3000/health
```

Возвращает статус сервера и доступные эндпоинты.

### Получить все товары

```
GET http://localhost:3000/products
```

Возвращает список товаров. Поддерживает фильтрацию:

```
GET http://localhost:3000/products?category=Стройматериалы
```

### Получить товар по ID

```
GET http://localhost:3000/products/{id}
```

Пример: `http://localhost:3000/products/1`

## 🛠 Техническая информация

Сервер использует:

- **Node.js** + **Express.js**
- **CORS** для кросс-доменных запросов
- **Port 3000**

## 📁 Структура проекта

```
stroyka/
├── backend/                  # Backend API
│   ├── LAUNCH_ME.bat        # 📌 ГЛАВНЫЙ ФАЙЛ ЗАПУСКА
│   ├── simple-server.js     # Основной сервер
│   ├── start-now.bat        # Альтернативный запуск
│   └── README_START_NOW.md  # Подробная инструкция
├── src/                     # Frontend (React)
└── README_BACKEND.md        # Эта инструкция
```

## 🔧 Для разработчиков

### Запуск вручную:

```bash
cd backend
npm install express cors
node simple-server.js
```

### Проверка работы:

```bash
# Health check
curl http://localhost:3000/health

# Все товары
curl http://localhost:3000/products

# Товар по ID
curl http://localhost:3000/products/1
```

## 🚨 Устранение проблем

### Ошибка "Node.js не установлен"

1. Скачайте Node.js с [nodejs.org](https://nodejs.org/)
2. Установите LTS версию
3. Перезапустите скрипт

### Порт 3000 занят

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F
```

### Сервер не запускается

- Закройте все терминалы
- Запустите скрипт от администратора
- Проверьте антивирусные блокировки

## 📞 Поддержка

Сервер запускается за 10 секунд и показывает все ссылки в консоли.
Просто кликните по любой ссылке чтобы протестировать API!

**Приятного использования!** 🎉

---

### Дополнительные скрипты в папке `backend`:

| Файл                | Назначение                            |
| ----------------------- | ----------------------------------------------- |
| `LAUNCH_ME.bat`       | 📌 Основной скрипт запуска |
| `start-now.bat`       | Альтернативный запуск       |
| `run-simple.bat`      | Простой запуск                     |
| `simple-server.js`    | Исходный код сервера          |
| `README_START_NOW.md` | Подробная инструкция         |

**Запустите `LAUNCH_ME.bat` и сервер заработает!**
