@echo off
echo Запуск Stroyka Backend API...
cd /d "%~dp0"
echo.
echo Установка зависимостей (если нужно)...
npm install express cors --no-save 2>nul
echo.
echo Запуск сервера на порту 3001...
echo.
echo После запуска будут доступны:
echo http://localhost:3001/health
echo http://localhost:3001/products
echo http://localhost:3001/products/1
echo.
echo Открываю health check...
start http://localhost:3001/health
echo.
node -e "const e=require('express');const c=require('cors');const a=e();a.use(c());a.use(e.json());a.get('/health',(r,s)=>{s.json({status:'OK',message:'Stroyka API работает',timestamp:new Date().toISOString()})});const p=[{id:1,name:'Цемент',price:450},{id:2,name:'Кирпич',price:25},{id:3,name:'Доска',price:850}];a.get('/products',(r,s)=>{s.json({count:p.length,products:p})});a.get('/products/:id',(r,s)=>{const i=parseInt(r.params.id);const f=p.find(x=>x.id===i)||{id:i,name:'Товар '+i,price:i*100};s.json(f)});a.listen(3001,()=>{console.log('✅ Backend запущен на порту 3001');console.log('🔗 Health: http://localhost:3001/health');console.log('📦 API: http://localhost:3001/products')})"
pause