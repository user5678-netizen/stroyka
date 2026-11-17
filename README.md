Бэкенд: Node.js, NestJS 11, PostgreSQL 15+, TypeORM, Redis, JWT, Cloudinary

Структура проекта

stroyka/
├── backend/   REST API, миграции, Dockerfile, docker-compose.yml
├── src/       фронтенд (React + Vite)
├── README.md

Быстрый старт — бэкенд в Docker

Нужен запущенный Docker Desktop.

cd backend
Test-Path .env
docker compose up -d --build
docker compose ps


Ожидается: 3 контейнера в статусе `Up` (postgres, redis, app).

После старта:

| Сервис | Адрес |
|--------|-------|
| API | `http://localhost:3000` |
| Swagger (OpenAPI) | `http://localhost:3000/api-docs` |
| Health check | `http://localhost:3000/health` |
| PostgreSQL | внутри Docker, `postgres:5432`, база `stroyka` |
| Redis | `localhost:6379` |

Остановка: `docker compose down` (вместе с данными: `docker compose down -v`).


Переменные окружения

Все переменные бэкенда перечислены в `backend/.env` (файл в `.gitignore`).

| Переменная | Назначение |
|------------|------------|
| `DATABASE_URL` | Строка подключения Neon. Если задана, `DB_*` не обязательны |
| `DB_HOST` | Хост PostgreSQL (`localhost` или `postgres` в Docker) |
| `DB_PORT` | Порт PostgreSQL (по умолчанию `5432`) |
| `DB_USERNAME` | Имя пользователя БД (`postgres`) |
| `DB_PASSWORD` | Пароль БД (`postgres`) |
| `DB_NAME` | Имя базы (`stroyka`) |
| `DB_SSL` | `true` для Neon и Render, `false` локально |
| `DB_LOGGING` | `true` включает вывод SQL-запросов |
| `REDIS_URL` | Строка Redis Cloud / Upstash, заменяет `REDIS_HOST` |
| `REDIS_HOST` | Хост Redis (`localhost` или `redis` в Docker) |
| `REDIS_PORT` | Порт Redis (по умолчанию `6379`) |
| `REDIS_PASSWORD` | Пароль Redis |
| `JWT_SECRET` | Секрет для подписи JWT |
| `JWT_EXPIRATION` | Срок жизни токена (по умолчанию `86400s`) |
| `CLOUDINARY_CLOUD_NAME` | Имя облака Cloudinary (`q9jdrfuj`) |
| `CLOUDINARY_API_KEY` | API ключ Cloudinary |
| `CLOUDINARY_API_SECRET` | Секретный ключ Cloudinary |
| `PORT` | Порт API, по умолчанию `3000` |
| `NODE_ENV` | `development` или `production` |
| `CORS_ORIGIN` | Origin фронтенда |
| `ADMIN_EMAIL` | Email администратора, создаётся при первом старте |
| `ADMIN_PASSWORD` | Пароль администратора, создаётся при первом старте |

Фронтенд: `VITE_API_BASE_URL` в `src/.env`.


Бэкенд без Docker

Нужны Node.js 20+, PostgreSQL 15+ и Redis на `localhost:6379`.

cd backend
cp .env.example .env
npm ci
npm run start:dev

Схема создаётся автоматически при `NODE_ENV=development` (`synchronize`). Для `production` применяются миграции из `src/migrations`.

 API

Полная интерактивная документация — Swagger: `http://localhost:3000/api-docs`.

| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| `POST` | `/api/auth/register` | все | Регистрация пользователя |
| `POST` | `/api/auth/login` | все | Вход, возврат JWT-токена |
| `GET` | `/api/products` | все | Список товаров (пагинация, фильтры, сортировка) |
| `GET` | `/api/products/:id` | все | Один товар по ID |
| `POST` | `/api/products` | admin | Создать товар (JSON) |
| `POST` | `/api/products/upload` | admin | Создать товар + загрузить изображения в Cloudinary |
| `PUT` | `/api/products/:id` | admin | Обновить товар |
| `DELETE` | `/api/products/:id` | admin | Удалить товар |
| `GET` | `/api/cart` | авторизованные | Получить корзину пользователя |
| `POST` | `/api/cart/items` | авторизованные | Добавить товар в корзину |
| `PATCH` | `/api/cart/items/:id` | авторизованные | Изменить количество товара |
| `DELETE` | `/api/cart/items/:id` | авторизованные | Удалить товар из корзины |
| `POST` | `/api/cart/apply-promo` | авторизованные | Применить промокод |
| `DELETE` | `/api/cart/remove-promo` | авторизованные | Удалить промокод |
| `DELETE` | `/api/cart/clear` | авторизованные | Очистить корзину |
| `GET` | `/health` | все | Статус API |

`GET /api/products` принимает параметры: `page`, `limit`, `search`, `min_price`, `max_price`, `min_rating`, `sort_by` (`price` или `title`), `order` (`asc` или `desc`). Фильтрация, сортировка и пагинация выполняются в SQL. Ответ имеет вид:

```json
{ "items": [...], "meta": { "total_items", "total_pages", "current_page", "limit" } }
```

Одинаковые наборы query-параметров кэшируются в Redis на 120 секунд. Создание, изменение и удаление товара сбрасывают кэш каталога.

Пример проверки:

curl "http://localhost:3000/api/products?search=cement&min_price=10&max_price=100&sort_by=price&order=asc"

curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@stroyka.com","password":"Admin123!"}'


cp .env.example .env

Изображения товаров

Изображения хранятся в Cloudinary, по папке на товар:

```
stroyka/products/<slug>/1-..., 2-..., 3-...
```

В `images` товара записаны три разных URL — этого достаточно для слайдера `ImageCarousel`.

Исправление ошибки: в исходном состоянии у каждого товара в `images` был записан **один и тот же Unsplash-URL трижды**. После исправления у всех 6 товаров стоят **разные живые URL** из Cloudinary аккаунта `q9jdrfuj`:

| Товар | Изображения |
|-------|-------------|
| Exterior Paint Set | `1-paint-can`, `2-paint-roller`, `3-painted-interior`, `4-painted-interior-alt` |
| Plywood Sheets | `1-plywood-board`, `2-plywood-sheets`, `3-plywood-panels` |
| Premium Cement Bags | `1-cement-warehouse`, `2-concrete-site`, `3-cement-bags` |
| Premium Lumber Planks | `1-lumber-stack`, `2-carpentry-workshop`, `3-miter-saw` |
| Red Clay Bricks | `1-brick-stack`, `2-brick-renovation`, `3-brick-pallet` |
| Steel I-Beams | `1-steel-pipes`, `2-metalwork`, `3-welding` |

Все 18 изображений проверены через Cloudinary Admin API (`ping` → `{"status":"ok"}`) и существуют в аккаунте `q9jdrfuj` с префиксом `stroyka/products/`.

`POST /api/products/upload` принимает multipart-форму с 3–10 файлами и сам раскладывает их в папку нового товара в Cloudinary.

Аутентификация и роли

- Администратор создаётся при первом старте: `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env` (по умолчанию `admin@stroyka.com` / `Admin123!`)
- Промокод `SAVE10` создаётся автоматически (скидка 10%)
- Роли: `customer` и `admin`. Админ может создавать/редактировать/удалять товары и загружать изображения


1. Бэкенд
cd C:\Users\37529\Downloads\stroyka\backend
Test-Path .env
docker compose up -d --build
docker compose ps
curl http://localhost:3000/health
curl http://localhost:3000/api/products | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d);console.log('Товаров:', j.meta.total_items)})"

2. Фронтенд (новое окно терминала)
cd C:\Users\37529\Downloads\stroyka
npm ci
npm run dev

3. Остановить всё
cd C:\Users\37529\Downloads\stroyka\backend
docker compose down
и Ctrl+C в окне с npm run dev

4. Проверка сборки
cd C:\Users\37529\Downloads\stroyka
npm run build
cd backend
npm run build


В браузере:

| Что показать | Адрес |
|--------------|-------|
| Статус API | `http://localhost:3000/health` |
| Каталог товаров | `http://localhost:3000/api/products` |
| Swagger документация | `http://localhost:3000/api-docs` |
| Главная страница | `http://localhost:5173` |
| Страница товара | `http://localhost:5173/product/<id>` |
| Корзина | `http://localhost:5173/cart` |

Деплой

- База: Neon (Serverless Postgres), в Render передаётся `DATABASE_URL` и `DB_SSL=true`
- Кэш: Upstash или Redis Cloud, строка `rediss://...` в `REDIS_URL`
- Медиа: Cloudinary
- Бэкенд: Render, Web Service из `backend/Dockerfile` (стадия `production`, процесс от пользователя `node`)
- CORS: `CORS_ORIGIN` должен совпадать с адресом фронтенда

После деплоя в этот раздел добавляются ссылки на рабочий API и Swagger.

Git

Ветки: `main` — стабильная версия, `dev` — разработка, задачи ведутся в `feature/*` и вливаются в `dev`. Сообщения коммитов — Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).


