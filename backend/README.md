# Stroyka Backend API

Backend магазина стройматериалов: NestJS, PostgreSQL 15, Redis, JWT, Cloudinary.

Схема БД в режиме `development` создаётся автоматически при старте (`synchronize`). Отдельно миграции запускать не нужно. Если Docker установлен, достаточно `docker compose up --build`. Если нет — ниже есть запуск на локальных PostgreSQL и Redis.

## Что нужно заранее

- Docker Desktop (запущен)
- Файл `.env` рядом с `docker-compose.yml`

```bash
cd backend
copy .env.example .env
```

В `.env.example` уже стоят локальные значения Postgres и Redis. Для `docker compose` хосты `DB_HOST` и `REDIS_HOST` из файла переопределяются на имена сервисов `postgres` и `redis`. Cloudinary для просмотра каталога не вызывается: можно оставить плейсхолдеры из примера и подставить свои ключи, когда понадобится загрузка картинок.

## Запуск через Docker

Нужен установленный и запущенный Docker Desktop.

```bash
cd backend
docker compose up --build
```

Первая сборка скачивает образы и ставит npm-зависимости, это несколько минут. Сервер готов, когда в логах `app` есть строка `Application is running`.

Образ `app` собирается из `Dockerfile`: стадия `development` запускает `npm run start:dev` от пользователя `node`. Стадия `production` — это минимальный runtime с `node dist/main.js`, её использует Render.

## Запуск без Docker

Нужны Node.js 20+, PostgreSQL 15+ и Redis на `localhost:6379`.

1. Скопируйте окружение, если `.env` ещё нет: `copy .env.example .env`
2. Создайте базу (пароль из `.env`, по умолчанию `postgres`):

```bash
psql -h localhost -U postgres -c "CREATE DATABASE stroyka;"
```

Если база уже есть, команда ответит ошибкой — это нормально, идите дальше.

3. Запустите Redis на порту 6379 и оставьте этот процесс открытым:

```bash
set REDISMS_PORT=6379
npx --yes redis-memory-server
```

В логе должна появиться строка `Redis server running at: 127.0.0.1:6379`. Если Redis уже установлен как служба, этот шаг не нужен.

4. Установите зависимости и запустите API:

```bash
cd backend
npm ci
npm run start:dev
```

Схема таблиц создаётся сама, потому что в `.env` стоит `NODE_ENV=development`.

| Сервис                    | Адрес                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| API                             | http://localhost:3000                                                                       |
| Swagger                         | http://localhost:3000/api-docs                                                              |
| Проверка живости | http://localhost:3000/health                                                                |
| PostgreSQL                      | внутри Docker: `postgres:5432`, база `stroyka`, user/password `postgres` (порт на хост не проброшен, чтобы не конфликтовать с локальным Postgres) |
| Redis                           | localhost:6379                                                                              |

Остановка:

```bash
docker compose down
```

Вместе с данными БД и Redis:

```bash
docker compose down -v
```

## Что создаётся при первом старте

- Администратор: `admin@stroyka.com` / `Admin123!` (берутся из `ADMIN_EMAIL` и `ADMIN_PASSWORD`)
- Промокод `SAVE10` со скидкой 10%
- Каталог из шести товаров с изображениями из Cloudinary, если таблица товаров пустая

Регистрация через API всегда создаёт пользователя с ролью `customer`.

## Переменные окружения

| Переменная      | Назначение                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Строка подключения Neon. Если задана, отдельные `DB_*` не обязательны |
| `DB_SSL`                | `true` для Neon и Render. Локальный Docker: `false` |
| `DB_HOST`               | Хост PostgreSQL. Локально в Docker подменяется на `postgres`. Для Neon — хост из панели Neon |
| `DB_PORT`               | Порт PostgreSQL, обычно `5432`                                                                                               |
| `DB_USERNAME`           | Пользователь БД                                                                                                            |
| `DB_PASSWORD`           | Пароль БД                                                                                                                        |
| `DB_NAME`               | Имя базы                                                                                                                          |
| `REDIS_URL`             | Строка Redis Cloud или Upstash. Если задана, `REDIS_HOST` не используется |
| `REDIS_HOST`            | Хост Redis. В Docker подменяется на `redis`                                                                          |
| `REDIS_PORT`            | Порт Redis, обычно `6379`                                                                                                    |
| `REDIS_PASSWORD`        | Пароль Redis. Пусто, если пароля нет                                                                             |
| `JWT_SECRET`            | Секрет подписи JWT                                                                                                          |
| `JWT_EXPIRATION`        | Срок токена, например `86400s`                                                                                       |
| `CLOUDINARY_CLOUD_NAME` | Cloud name из Cloudinary                                                                                                               |
| `CLOUDINARY_API_KEY`    | API key Cloudinary                                                                                                                       |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary                                                                                                                    |
| `PORT`                  | Порт приложения, `3000`                                                                                                  |
| `NODE_ENV`              | `development` или `production`                                                                                                    |
| `CORS_ORIGIN`           | Origin фронтенда, по умолчанию `http://localhost:5173`                                                             |
| `ADMIN_EMAIL`           | Email администратора, который создаётся при старте                                                |
| `ADMIN_PASSWORD`        | Пароль администратора, не короче 8 символов                                                          |

## Как проверить API

Каталог открыт без токена:

```bash
curl "http://localhost:3000/api/products?search=цемент&sort_by=price&order=asc"
```

Вход администратора:

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@stroyka.com\",\"password\":\"Admin123!\"}"
```

Дальше заголовок `Authorization: Bearer <access_token>`.

Регистрация покупателя: `POST /api/auth/register` с полями `email` и `password`.

Корзина (нужен токен покупателя или администратора):

- `GET /api/cart`
- `POST /api/cart/items` — тело `{ "product_id": "<uuid>", "quantity": 1 }`
- `PATCH /api/cart/items/:id` — тело `{ "quantity": 2 }`
- `DELETE /api/cart/items/:id`
- `POST /api/cart/apply-promo` — тело `{ "code": "SAVE10" }`

Товар (только роль `admin`):

- `POST /api/products` — `title`, `description`, `price`, `stock_quantity`, `images` (массив минимум из 3 URL, лучше Cloudinary)
- `POST /api/products/upload` — multipart: те же поля + минимум 3 файла `images`; загрузка в Cloudinary, в БД сохраняются URL
- `PUT /api/products/:id`
- `DELETE /api/products/:id` — товар удаляется и из корзин, кэш каталога сбрасывается

Каталог `GET /api/products` принимает `page` (по умолчанию 1), `limit` (по умолчанию 12), `search`, `min_price`, `max_price`, `min_rating`, `sort_by` (`price` или `title`), `order` (`asc` или `desc`). Ответ:

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

Одинаковые query-параметры кэшируются в Redis на 120 секунд. Создание, изменение и удаление товара очищают эти ключи.

Полный список схем и кнопка «Try it out» — в Swagger: http://localhost:3000/api-docs

## Деплой

- **База:** проект в [Neon](https://neon.tech). В Render кладётся `DATABASE_URL` целиком и `DB_SSL=true`. Отдельные `DB_HOST` / `DB_PASSWORD` нужны только если строки нет.
- **Кэш:** [Upstash](https://upstash.com) или Redis Cloud, строка `rediss://...` в `REDIS_URL`.
- **Медиа:** изображения товаров — URL из [Cloudinary](https://cloudinary.com). Ключи — три переменные `CLOUDINARY_*`. Загрузка файла админом: `POST /api/products/upload`.
- **Приложение:** Web Service на [Render](https://render.com) из `Dockerfile` (финальная стадия `production`, процесс от пользователя `node`), ветка `dev`. Порт берётся из переменной `PORT`, которую Render задаёт сам.
- **Фронтенд:** `CORS_ORIGIN` равен origin клиентского приложения.
- **Swagger на публичном API:** `https://<ваш-сервис>.onrender.com/api-docs`

В `production` автоматическое создание таблиц выключено. При старте контейнера приложение само применяет миграции из `src/migrations`, затем создаёт администратора, промокод `SAVE10` и каталог, если товары ещё не загружены.

## Изображения и служебные скрипты

Изображения товаров лежат в Cloudinary по папкам `stroyka/products/<slug>/`.
Порядок файлов задаётся префиксом `1-`, `2-`, `3-` — его использует слайдер.

| Скрипт | Назначение |
| --- | --- |
| `npm run audit:cloudinary` | список папок, групп и товаров, где меньше трёх изображений |
| `npm run upload:cloudinary -- --product=<slug> --urls=<url1>,<url2>` | загрузка фото по URL в папку товара |
| `node scripts/cloudinary-organize.js --apply` | разовая раскладка изображений по папкам товаров |

`audit:cloudinary` понимает флаги `--strategy=time`, `--json=report.json`,
`--csv=report.csv` и `--api=http://localhost:3000` (сверка с базой).

## Если не стартует

- Порт 3000 занят: остановите другой сервис или поменяйте проброс app в `docker-compose.yml` (`"3001:3000"`).
- Нужен `psql` с хоста: раскомментируйте `ports` у сервиса `postgres` в `docker-compose.yml` на свободный порт.
- Docker пишет, что daemon не запущен: откройте Docker Desktop и повторите `docker compose up --build`.
- После смены сущностей осталась старая схема: `docker compose down -v` и снова `docker compose up --build`.
