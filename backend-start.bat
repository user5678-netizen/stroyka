@echo off
echo Starting NestJS backend via Docker Compose...
cd /d "%~dp0backend"
if not exist ".env" copy .env.example .env >nul
docker compose up --build
