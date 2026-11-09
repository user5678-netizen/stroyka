import { useState, useEffect } from 'react';
import styles from './BackendLauncher.module.css';

export function SimpleBackendButton() {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Не проверено');
  
  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsRunning(true);
        setStatus(`✅ ${data.message}`);
      } else {
        setIsRunning(false);
        setStatus('❌ Сервер не отвечает');
      }
    } catch {
      setIsRunning(false);
      setStatus('❌ Сервер не запущен');
    }
  };
  
  const startBackend = () => {
    // Просто открываем bat файл
    window.open('./backend-start.bat', '_blank');
    setStatus('🚀 Запускается...');
    
    // Проверяем через 3 секунды
    setTimeout(() => {
      checkBackend();
    }, 3000);
  };
  
  const openHealth = () => {
    window.open('http://localhost:3001/health', '_blank');
  };
  
  const openProducts = () => {
    window.open('http://localhost:3001/products', '_blank');
  };
  
  // Проверяем при загрузке
  useEffect(() => {
    checkBackend();
  }, []);
  
  return (
    <div className={styles.backendLauncher}>
      <div className={styles.statusIndicator}>
        <div className={`${styles.statusDot} ${isRunning ? styles.running : styles.stopped}`} />
        <span className={styles.statusText}>
          {isRunning ? 'Backend работает' : 'Backend остановлен'}
        </span>
      </div>
      
      <div className={styles.output}>{status}</div>
      
      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.startButton}`}
          onClick={startBackend}
          title="Запустить backend сервер"
        >
          🚀 Запустить Backend
        </button>
        
        <button
          className={`${styles.button} ${styles.checkButton}`}
          onClick={checkBackend}
          title="Проверить статус"
        >
          🔄 Проверить
        </button>
        
        {isRunning && (
          <>
            <button
              className={`${styles.button} ${styles.healthButton}`}
              onClick={openHealth}
              title="Открыть health check"
            >
              🩺 Health
            </button>
            
            <button
              className={`${styles.button} ${styles.apiButton}`}
              onClick={openProducts}
              title="Открыть API товаров"
            >
              📦 API
            </button>
          </>
        )}
      </div>
      
      {isRunning && (
        <div className={styles.links}>
          <strong>Ссылки:</strong>
          <a href="http://localhost:3001/health" target="_blank" rel="noopener noreferrer">
            Health Check
          </a>
          <a href="http://localhost:3001/products" target="_blank" rel="noopener noreferrer">
            Все товары
          </a>
          <a href="http://localhost:3001/products/1" target="_blank" rel="noopener noreferrer">
            Товар #1
          </a>
        </div>
      )}
    </div>
  );
}