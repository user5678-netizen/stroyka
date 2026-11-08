# Stroyka Backend API

Backend API for construction materials store built with NestJS, PostgreSQL, Redis, and Docker.

## Tech Stack

- **Node.js** (LTS 20+)
- **NestJS** (v11)
- **PostgreSQL 15+** (Neon.tech Serverless)
- **TypeORM**
- **Redis** (Caching)
- **Docker & Docker Compose**
- **Cloudinary** (Media storage)
- **JWT Authentication**
- **RBAC** (Role-Based Access Control)

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Cloudinary account (for media storage)

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:

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
JWT_EXPIRATION=86400s  # 24 hours

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Application
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Admin user (initial admin credentials for seeding)
ADMIN_EMAIL=admin@stroyka.com
ADMIN_PASSWORD=Admin123!
```

## Local Development with Docker

1. Clone the repository:

```bash
git clone <repository-url>
cd backend
```

2. Create `.env` file with your configuration.

3. Start the services:

```bash
docker-compose up --build
```

The application will be available at:
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

4. To stop the services:

```bash
docker-compose down
```

5. To stop and remove volumes:

```bash
docker-compose down -v
```

## Local Development without Docker

1. Install dependencies:

```bash
npm ci
```

2. Set up PostgreSQL and Redis locally or use Docker for them:

```bash
# Start only database and cache
docker-compose up postgres redis
```

3. Create `.env` file with localhost configuration.

4. Run migrations (if using TypeORM migrations):

```bash
npm run migration:run
```

5. Start the application:

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Interactive API documentation is available at `/api-docs` endpoint when the server is running.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Products (Public)

- `GET /api/products` - Get all products with filtering, sorting, pagination
- `GET /api/products/:id` - Get single product by ID

### Products (Admin only)

- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart (Authenticated users only)

- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PATCH /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `POST /api/cart/apply-promo` - Apply promo code (SAVE10 for 10% discount)
- `DELETE /api/cart/remove-promo` - Remove promo code
- `DELETE /api/cart/clear` - Clear entire cart

## Filtering & Sorting (Products)

The `GET /api/products` endpoint supports the following query parameters:

- `page` (default: 1) - Page number
- `limit` (default: 12) - Items per page
- `search` - Search in title/description (case-insensitive)
- `min_price`, `max_price` - Price range filtering
- `min_rating` - Minimum rating filtering
- `sort_by` (price/title) - Field to sort by
- `order` (asc/desc) - Sort direction

Example:
```
GET /api/products?page=1&limit=12&min_price=10&max_price=100&min_rating=4&sort_by=price&order=desc
```

## Caching Strategy

- Product listing queries are cached for **120 seconds** using Redis
- Cache keys are based on query parameters
- Cache is invalidated on product creation, update, or deletion
- Redis is also used for session storage and rate limiting

## Database Schema

### User
- `id` (UUID, primary key)
- `email` (string, unique)
- `password_hash` (string)
- `role` (enum: customer/admin)
- `created_at` (timestamp)

### Product
- `id` (UUID, primary key)
- `title` (string)
- `description` (text)
- `price` (decimal)
- `rating` (float)
- `images` (string array, Cloudinary URLs)
- `stock_quantity` (integer)
- `created_at` (timestamp)

### Cart
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `promo_code` (string, nullable)
- `discount_amount` (decimal)
- `created_at`, `updated_at` (timestamps)

### CartItem
- `id` (UUID, primary key)
- `cart_id` (UUID, foreign key)
- `product_id` (UUID, foreign key)
- `quantity` (integer)

### PromoCode
- `id` (UUID, primary key)
- `code` (string, unique, e.g., SAVE10)
- `discount_percentage` (decimal)
- `is_active` (boolean)

## Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select Docker as the environment
4. Add environment variables from `.env.example`
5. For database, use Neon.tech PostgreSQL (serverless)
6. For Redis, use Redis Cloud or similar
7. For media storage, configure Cloudinary

## Admin User

On first startup, an admin user is automatically created with:
- Email: `admin@stroyka.com` (configurable via ADMIN_EMAIL)
- Password: `Admin123!` (configurable via ADMIN_PASSWORD)

## Promo Codes

The system includes a default promo code:
- `SAVE10` - 10% discount (active by default)

## Testing

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Git Flow

This project follows Git Flow methodology:
- `main` - Production ready code
- `develop` - Development branch
- Feature branches: `feature/*`
- Release branches: `release/*`
- Hotfix branches: `hotfix/*`

## Commit Convention

This project uses Conventional Commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `test:` - Test related changes

## License

Private - All rights reserved