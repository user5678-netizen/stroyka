@echo off
echo Use NestJS backend in folder backend\
cd /d "%~dp0backend"
if not exist ".env" copy .env.example .env >nul
docker compose up --build
