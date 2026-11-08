#!/bin/bash

echo "=== Тестирование Stroyka Backend API ==="
echo

# Создаем минимальный .env файл для тестирования
cat > .env.test << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=stroyka_test
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=test_secret_key
JWT_EXPIRATION=86400s
CLOUDINARY_CLOUD_NAME=test
CLOUDINARY_API_KEY=test
CLOUDINARY_API_SECRET=test
PORT=3000
NODE_ENV=test
CORS_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@stroyka.com
ADMIN_PASSWORD=Admin123!
EOF

echo "1. Проверка структуры проекта..."
if [ -f "package.json" ]; then
    echo "✅ package.json найден"
else
    echo "❌ package.json не найден"
    exit 1
fi

if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml найден"
else
    echo "❌ docker-compose.yml не найден"
    exit 1
fi

if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile найден"
else
    echo "❌ Dockerfile не найден"
    exit 1
fi

echo
echo "2. Проверка TypeScript компиляции..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript компиляция успешна"
else
    echo "❌ Ошибка TypeScript компиляции"
    exit 1
fi

echo
echo "3. Проверка основных файлов..."
if [ -f "src/main.ts" ]; then
    echo "✅ main.ts найден"
fi

if [ -f "src/app.module.ts" ]; then
    echo "✅ app.module.ts найден"
fi

if [ -f "src/auth/auth.module.ts" ]; then
    echo "✅ auth.module.ts найден"
fi

if [ -f "src/products/products.module.ts" ]; then
    echo "✅ products.module.ts найден"
fi

if [ -f "src/cart/cart.module.ts" ]; then
    echo "✅ cart.module.ts найден"
fi

echo
echo "4. Проверка Docker сборки..."
echo "Сборка образа Docker..."
docker build -t stroyka-backend-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker сборка успешна"
else
    echo "❌ Ошибка Docker сборки"
    exit 1
fi

echo
echo "=== Все основные проверки пройдены успешно! ==="
echo
echo "Для запуска проекта выполните:"
echo "  docker-compose up --build"
echo
echo "После запуска API будет доступно по адресам:"
echo "  - http://localhost:3000"
echo "  - Swagger Docs: http://localhost:3000/api-docs"
echo
echo "Для выполнения миграций:"
echo "  docker-compose exec app npm run migration:run"