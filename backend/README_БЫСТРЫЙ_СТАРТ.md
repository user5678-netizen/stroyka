# Stroyka Backend - Быстрый старт 🇷🇺

## Быстрый запуск с Docker

1. **Скопируйте настройки:**
```bash
cp .env.example .env
```

2. **Запустите сервисы:**
```bash
docker-compose up --build
```

3. **Запустите миграции базы данных:**
```bash
# В новом окне терминала
docker-compose exec app npm run migration:run
```

4. **API доступно по адресам:**
- Главная: http://localhost:3000
- Swagger документация: http://localhost:3000/api-docs
- База данных: localhost:5432
- Redis: localhost:6379

## Основные API эндпоинты

### 🔐 Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход

### 🛍️ Товары (публичные)
- `GET /api/products` - Список товаров с фильтрацией
- `GET /api/products/:id` - Один товар

### 🛒 Корзина (требуется авторизация)
- `GET /api/cart` - Моя корзина
- `POST /api/cart/items` - Добавить в корзину
- `PATCH /api/cart/items/:id` - Изменить количество
- `DELETE /api/cart/items/:id` - Удалить из корзины
- `POST /api/cart/apply-promo` - Применить промокод SAVE10 (10% скидка)

### 👑 Админ (только для администраторов)
- `POST /api/products` - Создать товар
- `PUT /api/products/:id` - Обновить товар
- `DELETE /api/products/:id` - Удалить товар

## Фильтрация товаров

Пример запроса:
```
GET /api/products?page=1&limit=12&min_price=10&max_price=1000&min_rating=4&sort_by=price&order=desc&search=молоток
```

Параметры:
- `page` - страница (по умолчанию: 1)
- `limit` - количество на странице (по умолчанию: 12)
- `search` - поиск в названии/описании
- `min_price`, `max_price` - диапазон цен
- `min_rating` - минимальный рейтинг
- `sort_by` - поле сортировки (price/title)
- `order` - направление сортировки (asc/desc)

## Тестовые данные

При первом запуске автоматически создается администратор:
- Email: `admin@stroyka.com`
- Пароль: `Admin123!`

Промокод по умолчанию:
- `SAVE10` - скидка 10%

## Переменные окружения (.env)

Обязательные настройки для продакшн:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis
- `JWT_SECRET` - Секретный ключ для JWT
- `CLOUDINARY_*` - Настройки Cloudinary для изображений

## Остановка проекта

```bash
# Остановить сервисы
docker-compose down

# Остановить и удалить данные
docker-compose down -v
```

## Проблемы и решения

### Ошибка: "Cannot connect to database"
1. Убедитесь, что PostgreSQL запущен: `docker-compose up postgres`
2. Подождите 30 секунд после запуска
3. Проверьте настройки в .env файле

### Ошибка: "JWT token invalid"
Проверьте `JWT_SECRET` в .env файле

### Ошибка: "Redis connection failed"
Убедитесь, что Redis запущен: `docker-compose up redis`

## Деплой на продакшн

1. **База данных:** Neon.tech (PostgreSQL serverless)
2. **Кэш:** Redis Cloud
3. **Медиа:** Cloudinary
4. **Хостинг:** Render (Docker)

Конфигурация для Render в файле `render.yaml`