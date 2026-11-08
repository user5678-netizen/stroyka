# Stroyka Backend API (Русская версия)

Backend API для интернет-магазина строительных материалов, построенный на NestJS, PostgreSQL, Redis и Docker.

## Технологический стек

- **Node.js** (LTS 20+)
- **NestJS** (v11)
- **PostgreSQL 15+** (Neon.tech Serverless)
- **TypeORM**
- **Redis** (Кэширование)
- **Docker & Docker Compose**
- **Cloudinary** (Хранилище медиа)
- **JWT Аутентификация**
- **RBAC** (Ролевая система доступа)

## Предварительные требования

- Docker & Docker Compose
- Node.js 20+ (для локальной разработки)
- Аккаунт Cloudinary (для хранения медиа)

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

Необходимые переменные окружения:

```env
# PostgreSQL Database (Neon.tech)
DB_HOST=
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=super_secret_key_change_in_production
JWT_EXPIRATION=86400s  # 24 часа

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Приложение
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Администратор (начальные учетные данные)
ADMIN_EMAIL=admin@stroyka.com
ADMIN_PASSWORD=Admin123!
```

## Локальная разработка с Docker

1. Клонируйте репозиторий:

```bash
git clone <repository-url>
cd backend
```

2. Создайте файл `.env` с вашей конфигурацией.
3. Запустите сервисы:

```bash
docker-compose up --build
```

Приложение будет доступно по адресам:

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

4. Запустите миграции базы данных:

```bash
# В новом окне терминала
docker-compose exec app npm run migration:run
```

5. Чтобы остановить сервисы:

```bash
docker-compose down
```

6. Чтобы остановить и удалить тома:

```bash
docker-compose down -v
```

## Локальная разработка без Docker

1. Установите зависимости:

```bash
npm ci
```

2. Запустите PostgreSQL и Redis через Docker:

```bash
# Только база данных и кэш
docker-compose up postgres redis
```

3. Создайте `.env` файл с локальной конфигурацией.
4. Запустите миграции:

```bash
npm run migration:run
```

5. Запустите приложение:

```bash
# Режим разработки
npm run start:dev

# Режим продакшн
npm run build
npm run start:prod
```

## Документация API

Интерактивная документация API доступна по адресу `/api-docs` при запущенном сервере.

## API Эндпоинты

### Аутентификация

- `POST /api/auth/register` - Регистрация нового пользователя
- `POST /api/auth/login` - Авторизация пользователя

### Товары (публичные)

- `GET /api/products` - Получить все товары с фильтрацией, сортировкой, пагинацией
- `GET /api/products/:id` - Получить товар по ID

### Товары (только администратор)

- `POST /api/products` - Создать новый товар
- `PUT /api/products/:id` - Обновить товар
- `DELETE /api/products/:id` - Удалить товар

### Корзина (только авторизованные пользователи)

- `GET /api/cart` - Получить корзину пользователя
- `POST /api/cart/items` - Добавить товар в корзину
- `PATCH /api/cart/items/:id` - Обновить количество товара в корзине
- `DELETE /api/cart/items/:id` - Удалить товар из корзины
- `POST /api/cart/apply-promo` - Применить промокод (SAVE10 - скидка 10%)
- `DELETE /api/cart/remove-promo` - Удалить промокод
- `DELETE /api/cart/clear` - Очистить всю корзину

## Фильтрация и сортировка (Товары)

Эндпоинт `GET /api/products` поддерживает следующие query-параметры:

- `page` (по умолчанию: 1) - Номер страницы
- `limit` (по умолчанию: 12) - Количество товаров на странице
- `search` - Поиск в названии/описании (без учета регистра)
- `min_price`, `max_price` - Фильтрация по диапазону цен
- `min_rating` - Фильтрация по минимальному рейтингу
- `sort_by` (price/title) - Поле для сортировки
- `order` (asc/desc) - Направление сортировки

Пример:

```
GET /api/products?page=1&limit=12&min_price=10&max_price=100&min_rating=4&sort_by=price&order=desc
```

## Стратегия кэширования

- Запросы к списку товаров кэшируются на **120 секунд** с использованием Redis
- Ключи кэша формируются на основе параметров запроса
- Кэш инвалидируется при создании, обновлении или удалении товаров
- Redis также используется для хранения сессий и ограничения скорости запросов

## Схема базы данных

### Пользователь (User)

- `id` (UUID, первичный ключ)
- `email` (string, уникальный)
- `password_hash` (string)
- `role` (enum: customer/admin)
- `created_at` (timestamp)

### Товар (Product)

- `id` (UUID, первичный ключ)
- `title` (string)
- `description` (text)
- `price` (decimal)
- `rating` (float)
- `images` (массив строк, Cloudinary URLs)
- `stock_quantity` (integer)
- `created_at` (timestamp)

### Корзина (Cart)

- `id` (UUID, первичный ключ)
- `user_id` (UUID, внешний ключ)
- `promo_code` (string, может быть null)
- `discount_amount` (decimal)
- `created_at`, `updated_at` (timestamps)

### Элемент корзины (CartItem)

- `id` (UUID, первичный ключ)
- `cart_id` (UUID, внешний ключ)
- `product_id` (UUID, внешний ключ)
- `quantity` (integer)

### Промокод (PromoCode)

- `id` (UUID, первичный ключ)
- `code` (string, уникальный, например SAVE10)
- `discount_percentage` (decimal)
- `is_active` (boolean)

## Деплой на Render

1. Подключите GitHub репозиторий к Render
2. Создайте новый Web Service
3. Выберите Docker как окружение
4. Добавьте переменные окружения из `.env.example`
5. Для базы данных используйте Neon.tech PostgreSQL (serverless)
6. Для Redis используйте Redis Cloud или аналогичный сервис
7. Для медиа хранилища настройте Cloudinary
8. Команда сборки: `docker build -t stroyka-backend .`
9. Команда запуска: `docker run -p 3000:3000 stroyka-backend`

### Настройка Neon.tech PostgreSQL

1. Создайте аккаунт Neon.tech
2. Создайте новый проект
3. Получите строку подключения: `postgresql://user:password@host:port/dbname`
4. Установите соответствующие переменные окружения

### Настройка Redis Cloud

1. Создайте аккаунт Redis Cloud
2. Создайте новую базу данных
3. Получите данные подключения и установите `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

### Настройка Cloudinary

1. Создайте аккаунт Cloudinary
2. Получите `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Администратор

При первом запуске автоматически создается администратор:

- Email: `admin@stroyka.com` (можно изменить через ADMIN_EMAIL)
- Пароль: `Admin123!` (можно изменить через ADMIN_PASSWORD)

## Промокоды

Система включает промокод по умолчанию:

- `SAVE10` - скидка 10% (активен по умолчанию)

## Тестирование

```bash
# Запустить тесты
npm run test

# Запустить тесты с покрытием
npm run test:cov

# Запустить тесты в режиме наблюдения
npm run test:watch
```

## Git Flow

Этот проект следует методологии Git Flow:

- `main` - Продакшн готовый код
- `develop` - Ветка разработки
- Ветки фич: `feature/*`
- Ветки релизов: `release/*`
- Ветки хотфиксов: `hotfix/*`

## Конвенция коммитов

Этот проект использует Conventional Commits:

- `feat:` - Новая фича
- `fix:` - Исправление бага
- `chore:` - Задачи по обслуживанию
- `refactor:` - Рефакторинг кода
- `docs:` - Изменения в документации
- `test:` - Изменения связанные с тестами

## Устранение проблем

### Проблема: Ошибка при запуске миграций

**Решение**: Убедитесь, что PostgreSQL запущен и доступен:

```bash
docker-compose up postgres
# Подождите 30 секунд
docker-compose exec app npm run migration:run
```

### Проблема: Redis не доступен

**Решение**: Убедитесь, что Redis запущен:

```bash
docker-compose up redis
```

### Проблема: Ошибки авторизации

**Решение**: Проверьте JWT_SECRET в .env файле и убедитесь, что он соответствует.

### Проблема: Не загружаются изображения

**Решение**: Проверьте настройки Cloudinary в .env файле.

## Лицензия

Частная - Все права защищены
