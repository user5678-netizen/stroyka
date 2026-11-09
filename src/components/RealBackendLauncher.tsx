import { useState, useEffect } from 'react';
import styles from './BackendLauncher.module.css';

export function RealBackendLauncher() {
  const [backendStatus, setBackendStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:3001');
  const [output, setOutput] = useState<string>('');
  
  const BACKEND_PORT = 3001;
  
  const checkBackendStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setBackendStatus('running');
        setOutput(`✅ Backend работает: ${data.message}`);
      } else {
        setBackendStatus('stopped');
      }
    } catch (error) {
      setBackendStatus('stopped');
    }
  };
  
  const startBackend = async () => {
    setBackendStatus('starting');
    setOutput('🚀 Запускаю backend сервер...');
    
    try {
      // Создаем ссылку на скачивание bat файла
      const batContent = `@echo off
echo Запуск Stroyka Backend API...
cd /d "%~dp0"
npm list express >nul 2>nul || npm install express cors
node -e "const express=require('express');const cors=require('cors');const app=express();const PORT=3001;app.use(cors());app.use(express.json());const products=[{id:1,name:'Цемент М500',price:450,category:'Стройматериалы'},{id:2,name:'Кирпич красный',price:25,category:'Стройматериалы'},{id:3,name:'Доска обрезная',price:850,category:'Пиломатериалы'}];app.get('/health',(req,res)=>{res.json({status:'OK',message:'Stroyka Backend API работает',timestamp:new Date().toISOString()})});app.get('/products',(req,res)=>{res.json({count:products.length,products:products})});app.get('/products/:id',(req,res)=>{const id=parseInt(req.params.id);const product=products.find(p=>p.id===id)||{id:id,name:'Товар '+id,price:100*id,category:'Категория'};res.json(product)});app.listen(PORT,()=>{console.log('🚀 Backend запущен на порту '+PORT);console.log('🔗 http://localhost:'+PORT+'/health');console.log('📦 http://localhost:'+PORT+'/products')});"`;
      
      // Создаем blob для скачивания
      const blob = new Blob([batContent], { type: 'application/bat' });
      const url = URL.createObjectURL(blob);
      
      // Создаем временную ссылку для скачивания
      const a = document.createElement('a');
      a.href = url;
      a.download = 'start-backend.bat';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setOutput('📥 Файл start-backend.bat скачан! Запустите его двойным кликом.');
      
      // Открываем инструкцию
      setTimeout(() => {
        window.open('', '_blank')?.document.write(`
          <html><head><title>Инструкция</title><style>
            body{font-family:Arial;padding:20px;background:#f5f5f5}
            .container{max-width:600px;margin:0 auto;background:white;padding:30px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
            h1{color:#667eea;margin-top:0}
            .step{background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;border-left:4px solid #667eea}
            .button{background:#667eea;color:white;border:none;padding:12px 24px;border-radius:6px;font-size:16px;cursor:pointer;margin:10px 0;display:inline-block;text-decoration:none}
          </style></head>
          <body>
            <div class="container">
              <h1>🚀 Инструкция по запуску</h1>
              <div class="step">
                <h3>Шаг 1: Запустите скачанный файл</h3>
                <p>Найдите файл <strong>start-backend.bat</strong> и запустите его двойным кликом</p>
              </div>
              <div class="step">
                <h3>Шаг 2: Дождитесь запуска</h3>
                <p>Сервер запустится в новом окне на порту 3001</p>
              </div>
              <div class="step">
                <h3>Шаг 3: Проверьте работу</h3>
                <p>Вернитесь на эту страницу и нажмите "Проверить статус"</p>
              </div>
              <p><strong>Ссылки после запуска:</strong></p>
              <p><a href="http://localhost:3001/health" target="_blank">http://localhost:3001/health</a></p>
              <p><a href="http://localhost:3001/products" target="_blank">http://localhost:3001/products</a></p>
            </div>
          </body></html>
        `);
      }, 500);
      
      // Ждем и проверяем статус
      setTimeout(() => {
        checkBackendStatus();
      }, 3000);
      
    } catch (error) {
      setBackendStatus('error');
      setOutput(`❌ Ошибка: ${error}`);
    }
  };
  
  const openBackendApi = () => {
    window.open(`${backendUrl}/products`, '_blank');
  };
  
  const openHealthCheck = () => {
    window.open(`${backendUrl}/health`, '_blank');
  };
  
  // Проверяем статус при загрузке
  useEffect(() => {
    checkBackendStatus();
    
    // Проверяем каждые 5 секунд
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, [backendUrl]);
  
  return (
    <div className={styles.backendLauncher}>
      <div className={styles.statusIndicator}>
        <div className={`${styles.statusDot} ${styles[backendStatus]}`} />
        <span className={styles.statusText}>
          {backendStatus === 'stopped' && 'Backend не запущен'}
          {backendStatus === 'starting' && 'Запускается...'}
          {backendStatus === 'running' && '✅ Backend работает'}
          {backendStatus === 'error' && '❌ Ошибка'}
        </span>
      </div>
      
      {output && (
        <div className={styles.output}>
          {output}
        </div>
      )}
      
      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.startButton}`}
          onClick={startBackend}
          disabled={backendStatus === 'starting'}
          title="Запустить backend сервер"
        >
          {backendStatus === 'running' ? '✅ Запущен' : '🚀 Запустить Backend'}
        </button>
        
        <button
          className={`${styles.button} ${styles.checkButton}`}
          onClick={checkBackendStatus}
          title="Проверить статус backend"
        >
          🔄 Проверить статус
        </button>
        
        {backendStatus === 'running' && (
          <>
            <button
              className={`${styles.button} ${styles.apiButton}`}
              onClick={openBackendApi}
              title="Открыть API товаров"
            >
              📦 API Товаров
            </button>
            
            <button
              className={`${styles.button} ${styles.healthButton}`}
              onClick={openHealthCheck}
              title="Проверить здоровье сервера"
            >
              🩺 Health Check
            </button>
          </>
        )}
      </div>
      
      {backendStatus === 'running' && (
        <div className={styles.links}>
          <strong>Быстрые ссылки:</strong>
          <a href={`${backendUrl}/health`} target="_blank" rel="noopener noreferrer">
            Health Check
          </a>
          <a href={`${backendUrl}/products`} target="_blank" rel="noopener noreferrer">
            Все товары
          </a>
          <a href={`${backendUrl}/products/1`} target="_blank" rel="noopener noreferrer">
            Товар #1
          </a>
          <a href={`${backendUrl}/products/2`} target="_blank" rel="noopener noreferrer">
            Товар #2
          </a>
        </div>
      )}
    </div>
  );
}