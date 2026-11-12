@echo off
echo The Express stub is outdated.
echo Starting NestJS backend (variant 2: NestJS + PostgreSQL + Redis)...
cd /d "%~dp0backend"
if not exist ".env" copy .env.example .env >nul
docker compose up --build
