# Stroyka — интернет-магазин строительных материалов

Учебный проект: серверная часть и REST API интернет-магазина, **вариант № 2 (NestJS + PostgreSQL)**. Клиентское приложение на React взаимодействует с REST API для просмотра каталога, поиска, фильтрации, сортировки и управления корзиной.

## Содержание

- [Рабочий деплой](#рабочий-деплой)
- [Стек и архитектура](#стек-и-архитектура)
- [Локальный запуск](#локальный-запуск)
- [Переменные окружения](#переменные-окружения)
- [Модели данных](#модели-данных)
- [REST API](#rest-api)
- [Кэширование](#кэширование)
- [Облачная инфраструктура](#облачная-инфраструктура)
- [Проверка проекта](#проверка-проекта)
- [Git Flow](#git-flow)

## Рабочий деплой

| Ресурс | Адрес |
| --- | --- |
| Репозиторий | https://github.com/user5678-netizen/stroyka |
| Публичный REST API | https://stroyka-backend.onrender.com |
| Swagger / OpenAPI | https://stroyka-backend.onrender.com/api-docs |
| Health check | https://stroyka-backend.onrender.com/health |
| Каталог | https://stroyka-backend.onrender.com/api/products |
| Клиентское приложение | http://localhost:5173 (локальный запуск) |

Бэкенд развёрнут на Render из Dockerfile, ветка `dev`. PostgreSQL размещён в Neon, для Redis настроен Upstash, URL демонстрационных фотографий указывают на Cloudinary. Успешный запуск сервера и получение каталога подтверждены при развёртывании; работоспособность кэша следует отдельно проверить по инструкции ниже. Корневой путь `/` не является страницей сайта и возвращает 404. Если при переходе по ссылке добавляется `utm_source`, скопируйте URL без этого параметра.

## Стек и архитектура

| Компонент | Технология |
| --- | --- |
| Сервер | Node.js 20 (текущий Dockerfile), NestJS 11, TypeScript |
| База данных | PostgreSQL 15+ / Neon |
| ORM | TypeORM |
| Кэш | Redis 7 / Upstash, ioredis |
| Авторизация | JWT, Passport, bcrypt, RBAC |
| Валидация | class-validator, class-transformer, Joi |
| Медиа | Cloudinary |
| Документация | Swagger / OpenAPI |
| Клиент | React 19, Vite 7, TypeScript, React Router |
| Инфраструктура | Docker, Docker Compose, Render |

> Dockerfile использует Node.js 20. Для соблюдения требования поддерживаемой LTS-версии на момент сдачи следует отдельно обновить базовый образ на поддерживаемую LTS-ветку и проверить сборку. Настоящая документация не меняет Dockerfile.

```mermaid
flowchart TD
    UI[React / Vite — localhost:5173] -->|HTTPS REST API + JWT| API[NestJS — Render / Docker]
    API -->|TypeORM| DB[(PostgreSQL — Neon)]
    API -->|ioredis| CACHE[(Redis — Upstash)]
    API -->|Upload API| MEDIA[Cloudinary]
    UI -->|HTTPS image URLs| MEDIA
```

Локально вместо облачных PostgreSQL и Redis используются сервисы Docker Compose. Фронтенд можно запускать локально и подключать как к локальному, так и к публичному API.

```text
stroyka/
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT, регистрация и вход
│   │   ├── products/      # каталог и административный CRUD
│   │   ├── cart/          # корзина и промокоды
│   │   ├── health/        # проверка HTTP-сервера
│   │   ├── migrations/    # миграции TypeORM
│   │   └── shared/        # сущности, конфигурация, сервисы
│   ├── scripts/           # работа с Cloudinary
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── render.yaml
│   ├── api-examples.http
│   └── .env.example
├── src/
│   ├── api/               # клиент REST API
│   ├── components/        # компоненты интерфейса
│   ├── pages/             # каталог, товар, корзина, checkout
│   ├── store/             # состояние приложения
│   └── styles/
├── .env.example
└── README.md
```

## Локальный запуск

Необходимы Git, Docker Desktop с Compose v2, Node.js и npm (для Vite 7 рекомендуется Node.js 22.12+ или совместимая более новая LTS-версия). Команды ниже рассчитаны на macOS/Linux.

### 1. Клонирование

```bash
git clone -b dev https://github.com/user5678-netizen/stroyka.git
cd stroyka
```

Для приватного репозитория используйте авторизованный HTTPS или SSH.

### 2. Запуск бэкенда, PostgreSQL и Redis

Запустите Docker Desktop. В корне проекта выполните:

```bash
cd backend
cp -n .env.example .env
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

`cp -n` сохраняет существующий `.env`. Для локального режима не задавайте облачные `DATABASE_URL` и `REDIS_URL` в этом файле. Compose устанавливает хосты `postgres` и `redis` через внутреннюю Docker-сеть. Для просмотра существующих изображений достаточно URL из каталога; для загрузки новых файлов требуются действующие ключи Cloudinary.

Ожидаются три сервиса: `app`, `postgres`, `redis`. Выход из просмотра логов через Ctrl+C не останавливает контейнеры.

```bash
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3000/api/products
```

При первом запуске создаются администратор, промокод SAVE10 и шесть демонстрационных товаров (товары добавляются, если каталог пуст). В development схема создаётся через TypeORM `synchronize`; в production перед запуском NestJS выполняются миграции.

### 3. Запуск фронтенда

В новом терминале перейдите в корневую папку `stroyka`, где находится клиентский `package.json`:

```bash
cp -n .env.example .env
npm ci
npm run dev
```

В корневом `.env` для локального бэкенда должно быть:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Откройте `http://localhost:5173`. Swagger находится по адресу `http://localhost:3000/api-docs`.

### 4. Локальный фронтенд + облачный API

Для работы с Render установите в корневом `.env`:

```dotenv
VITE_API_BASE_URL=https://stroyka-backend.onrender.com
```

Перезапустите `npm run dev`. Локальный Docker при этом не требуется. Origin фронтенда должен быть разрешён в `CORS_ORIGIN` на Render. При смене API может потребоваться очистить данные сайта localhost в браузере и получить новую JWT-сессию.

### 5. Остановка и сборка

```bash
# Из корня проекта
cd backend
docker compose down
```

Остановите Vite сочетанием Ctrl+C. Именованные volumes `postgres_data` и `redis_data` сохраняются. Команда `docker compose down -v` удаляет локальные данные — используйте её только при намеренном сбросе.

Проверка компиляции вне Docker (из корня проекта):

```bash
npm ci
npm run build
cd backend
npm ci
npm run build
```

## Переменные окружения

Шаблоны: `backend/.env.example` и корневой `.env.example`. Секреты задаются локально или в Render Environment, не публикуются в Git. Корневой `.env` в исходном архиве уже присутствовал в репозитории; перед коммитами проверяйте `git ls-files .env` и не записывайте туда секреты. Клиентская переменная `VITE_*` публична.

### Бэкенд (`backend/.env` или Render)

| Переменная | Назначение / пример |
| --- | --- |
| `NODE_ENV` | `development` локально, `production` на Render; также поддерживается `test` |
| `PORT` | HTTP-порт, по умолчанию `3000` |
| `DATABASE_URL` | Облачная строка PostgreSQL; при наличии заменяет параметры DB_HOST и другие реквизиты |
| `DB_HOST` | `localhost` вне Docker, `postgres` в Compose |
| `DB_PORT` | `5432` |
| `DB_USERNAME` | Локальный пользователь PostgreSQL, `postgres` в Compose |
| `DB_PASSWORD` | Пароль PostgreSQL |
| `DB_NAME` | `stroyka` локально |
| `DB_SSL` | `false` локально, `true` на Render |
| `DB_LOGGING` | `false`; `true` включает SQL-логи |
| `REDIS_URL` | TLS-строка Upstash `rediss://...`; при наличии заменяет параметры REDIS_HOST/PORT/PASSWORD |
| `REDIS_HOST` | `localhost` или `redis` в Compose |
| `REDIS_PORT` | `6379` |
| `REDIS_PASSWORD` | Пароль Redis, локально может быть пустым |
| `JWT_SECRET` | Секрет подписи JWT, обязателен |
| `JWT_EXPIRATION` | Срок действия JWT, по умолчанию `86400s` |
| `CLOUDINARY_CLOUD_NAME` | Имя облака Cloudinary |
| `CLOUDINARY_API_KEY` | Ключ API Cloudinary |
| `CLOUDINARY_API_SECRET` | Секрет API Cloudinary |
| `CORS_ORIGIN` | Список разрешённых origin через запятую |
| `ADMIN_EMAIL` | Email первоначального администратора |
| `ADMIN_PASSWORD` | Пароль первоначального администратора, минимум 8 символов |
| `DB_TYPE` | Необязательная подпись типа БД в стартовом логе; подключение всегда PostgreSQL |
| `CHOKIDAR_USEPOLLING` | Устанавливается Compose для наблюдения за изменениями файлов |

`ADMIN_PASSWORD` применяется при создании нового администратора; изменение переменной не сбрасывает пароль существующего аккаунта.

### Фронтенд (корневой `.env`)

| Переменная | Назначение |
| --- | --- |
| `VITE_API_BASE_URL` | Базовый URL сервера без `/api`, например `http://localhost:3000` |

## Модели данных

| Сущность | Основное назначение и поля |
| --- | --- |
| User | `id`, `email`, `password_hash`, `role`, `created_at` |
| Product | `id`, `title`, `category`, `description`, `price`, `rating`, `images`, `stock_quantity`, `created_at` |
| Cart | Корзина пользователя, связь с промокодом и рассчитанная скидка |
| CartItem | Связь корзины и товара, количество |
| PromoCode | `id`, `code`, `discount_percentage`, `is_active` |

```mermaid
erDiagram
    USER ||--o| CART : owns
    CART ||--o{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : references
    PROMO_CODE o|--o{ CART : applies
```

Пароли хешируются bcrypt. Регистрация создаёт покупателя; административные операции защищены JWT и проверкой роли. При удалении товара связанные позиции корзин удаляются, затем инвалидируется кэш каталога.

## REST API

Интерактивная документация: `/api-docs`. Примеры HTTP-запросов также находятся в `backend/api-examples.http`.

| Метод | Маршрут | Доступ | Назначение |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Публичный | Регистрация |
| POST | `/api/auth/login` | Публичный | Вход и JWT |
| GET | `/api/products` | Публичный | Каталог |
| GET | `/api/products/:id` | Публичный | Карточка товара |
| POST | `/api/products` | Admin | Создание товара по URL изображений |
| POST | `/api/products/upload` | Admin | Создание с загрузкой изображений |
| PUT | `/api/products/:id` | Admin | Редактирование |
| DELETE | `/api/products/:id` | Admin | Удаление |
| GET | `/api/cart` | JWT | Личная корзина |
| POST | `/api/cart/items` | JWT | Добавление позиции |
| PATCH | `/api/cart/items/:id` | JWT | Изменение количества |
| DELETE | `/api/cart/items/:id` | JWT | Удаление позиции |
| POST | `/api/cart/apply-promo` | JWT | Применение промокода |
| DELETE | `/api/cart/remove-promo` | JWT | Снятие промокода |
| DELETE | `/api/cart/clear` | JWT | Очистка корзины |
| GET | `/health` | Публичный | Статус HTTP-сервера |

### Каталог, поиск и пагинация

| Query-параметр | Значение |
| --- | --- |
| `page` | Номер страницы, по умолчанию 1 |
| `limit` | Размер страницы 1–100, по умолчанию 12 |
| `search` | Подстрока названия или описания, без учёта регистра |
| `min_price`, `max_price` | Границы цены |
| `min_rating` | Минимальный рейтинг, 0–5 |
| `sort_by` | `price` или `title` (по умолчанию `title`) |
| `order` | `asc` (по умолчанию) или `desc` |

TypeORM QueryBuilder выполняет поиск через `ILIKE`, фильтрацию через SQL-условия, сортировку через `ORDER BY`, пагинацию через `skip/take`. Полный массив товаров не фильтруется в памяти сервера.

```bash
curl 'https://stroyka-backend.onrender.com/api/products?page=1&limit=12&search=cement&min_price=10&max_price=100&sort_by=price&order=asc'
```

Пример структуры ответа (значения условные):

```json
{
  "items": [],
  "meta": {
    "total_items": 0,
    "total_pages": 0,
    "current_page": 1,
    "limit": 12
  }
}
```

### JWT и корзина

В Swagger выполните `POST /api/auth/register` или `POST /api/auth/login` с JSON:

```json
{
  "email": "customer@example.com",
  "password": "ExamplePassword123!"
}
```

Используйте собственный уникальный email и пароль. Из ответа скопируйте `access_token`, нажмите **Authorize** в Swagger или передайте заголовок `Authorization: Bearer <token>`.

Пример добавления товара (подставьте фактический UUID из каталога):

```json
{
  "product_id": "PRODUCT_UUID",
  "quantity": 2
}
```

Для `PATCH /api/cart/items/:id` используется ID позиции корзины, а не ID товара. Тело запроса: `{"quantity": 3}`.

Промокод: `POST /api/cart/apply-promo`, тело `{"code": "SAVE10"}`. Сервер возвращает `subtotal`, `discount_amount`, `discount_percentage`, `total`; скидка рассчитывается сервером, с округлением денежных значений. Например, при сумме 100 скидка составляет 10, итог — 90.

Страница `/checkout` отображает сводку корзины. Модель заказа, отправка заказа и платёжная интеграция не входят в реализованный сценарий и не заявляются как готовые функции.

## Кэширование

`CatalogCacheService` использует Redis. Ключ начинается с `products:` и строится из отсортированных параметров запроса. TTL равен 120 секундам. При cache miss результат формируется в PostgreSQL и записывается в Redis; при cache hit возвращается сохранённый JSON. Создание, обновление и удаление товара очищают ключи каталога через SCAN и DEL.

Если Redis недоступен, каталог продолжает работать без кэша. Поэтому ответ HTTP 200 сам по себе не доказывает работу Redis.

Локальная проверка из `backend`:

```bash
curl -fsS 'http://localhost:3000/api/products?page=1&limit=12' > /dev/null
docker compose exec redis redis-cli --scan --pattern 'products:*'
```

Для облачной проверки откройте Upstash Data Browser, вызовите каталог и найдите ключ `products:*` до истечения TTL. Повторите запрос с теми же параметрами. Затем под администратором измените тестовый товар и проверьте удаление ключей до следующего запроса каталога.

## Облачная инфраструктура

### Neon — PostgreSQL

Создайте проект с PostgreSQL 15+; в Connect скопируйте direct connection string (Connection pooling выключен). В Render задайте `DATABASE_URL` и `DB_SSL=true`. Миграции выполняются при старте production, начальные данные создаются BootstrapService. Для проверки используйте Neon Tables или SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```

### Upstash — Redis

Создайте Redis Database, получите TCP/TLS URL формата `rediss://default:PASSWORD@HOST:6379`. Вставьте в `REDIS_URL` без кавычек, команды `redis-cli` и пробелов. Выбирайте регион рядом с Neon/Render, если доступен. Проверьте отсутствие предупреждения `Redis недоступен` и наличие ключей кэша.

### Cloudinary — изображения

Задайте `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` из своего аккаунта. В начальном каталоге хранятся готовые публичные URL из облака `q9jdrfuj`, по три фотографии для каждого из шести товаров. Эти ссылки могут использоваться независимо от аккаунта, настроенного для загрузки новых изображений, пока исходные файлы доступны.

Маршрут `POST /api/products/upload` принимает multipart/form-data с полем `images` (3–10 файлов) и данными товара. Загрузка доступна администратору. Для проверки собственного хранилища загрузите тестовый товар и убедитесь, что новые URL принадлежат вашему Cloudinary cloud. Скрипты проекта: `npm run audit:cloudinary`, `npm run upload:cloudinary` (из `backend`, с настроенными ключами; второй изменяет облачные данные).

### Render — деплой Docker

1. Подключите GitHub и создайте Web Service из репозитория Stroyka.
2. Выберите Docker, ветку `dev`, Root Directory `backend`.
3. Dockerfile Path — `Dockerfile`, Build Context — `.` (относительно `backend`). Не дублируйте автоматически показанный префикс `backend/`.
4. Health Check Path — `/health`. Docker Command и Pre-Deploy Command оставьте пустыми.
5. Включите Auto-Deploy On Commit при необходимости.
6. Добавьте переменные окружения в Environment. Пример (замените заглушки реальными значениями, не публикуйте полученный файл):

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=YOUR_NEON_URL
DB_SSL=true
DB_LOGGING=false
REDIS_URL=YOUR_UPSTASH_TLS_URL
JWT_SECRET=YOUR_RANDOM_SECRET
JWT_EXPIRATION=86400s
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
ADMIN_EMAIL=admin@stroyka.com
ADMIN_PASSWORD=YOUR_STRONG_PASSWORD
```

JWT-секрет можно сгенерировать командой `openssl rand -hex 32`. Не используйте демонстрационные пароли в облаке.

7. Запустите Deploy Web Service. В логах ожидаются запуск NestJS, подключение TypeORM и `GET /health 200`. Проверяйте Redis отдельно.
8. Укажите URL Render в корневом `.env` фронтенда и перезапустите Vite.

Dockerfile содержит стадии `deps`, `build`, `development`, `production`. Финальная стадия устанавливает только runtime-зависимости, копирует `dist` и запускает `node dist/main.js` от непривилегированного пользователя `node`. Compose использует development-стадию, PostgreSQL 15, Redis 7, health checks и именованные volumes.

## Проверка проекта

| Проверка | Ожидаемый результат |
| --- | --- |
| `/health` | HTTP 200, `status: ok` (не проверяет Redis отдельно) |
| `/api/products` | Каталог, массив `items`, объект `meta` |
| Поиск, фильтры, сортировка | Подходящие товары в нужном порядке |
| Карточка товара | Описание и минимум три изображения для демонстрационных товаров |
| Регистрация и вход | JWT, роль покупателя |
| Корзина | Добавление, изменение количества, удаление, сохранение между запросами |
| SAVE10 | Скидка 10% и пересчитанный итог |
| Запрос без JWT к корзине | 401 |
| Удаление товара покупателем | 403 |
| Изменение каталога администратором | Изменение в БД и сброс Redis-кэша |
| Network → Fetch/XHR → Headers | Request URL начинается с `https://stroyka-backend.onrender.com` в облачном режиме |

Эта таблица — сценарии проверки, а не отчёт о прохождении всех тестов. На демонстрации можно одновременно открыть Swagger, Network, Render Logs, Neon Tables и Upstash Data Browser.

### Типичные ошибки

| Симптом | Решение |
| --- | --- |
| `Cannot GET /` | Используйте `/health`, `/api/products` или `/api-docs` |
| `property utm_source should not exist` | Удалите лишний query-параметр; строгая DTO-валидация работает штатно |
| `Redis недоступен`, `ENOENT` | Проверьте формат TLS URL без кавычек; при раскрытии секрета замените его |
| CORS error | Добавьте точный origin клиента в `CORS_ORIGIN`, перезапустите сервис |
| 401 после смены API | Получите новый JWT; при необходимости очистите локальную сессию |
| Нет фотографий | Проверьте `images` в API и HTTP-доступность URL Cloudinary |
| Нет товаров | Проверьте подключение к нужной БД, миграции и BootstrapService |

## Git Flow

Стабильная ветка — `main` (или `master`); текущая ветка разработки — `dev`, выполняющая роль develop. Для новых задач создаются `feature/*`, затем Pull Request в `dev`; готовые изменения переносятся в стабильную ветку по принятому в команде процессу.

```bash
git switch dev
git pull --ff-only origin dev
git switch -c feature/docs-readme
# Изменить README.md
git add README.md
git commit -m "docs: update project setup and deployment guide"
git push -u origin feature/docs-readme
```

Conventional Commits: `feat:` — функция, `fix:` — исправление, `chore:` — инфраструктура, `refactor:` — переработка, `docs:` — документация. Не добавляйте пароли, JWT-секреты, токены и облачные строки подключения в репозиторий.
