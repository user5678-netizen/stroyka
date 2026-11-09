import { useState, useEffect } from 'react';
import styles from './BackendLauncher.module.css';

export function BackendLauncher() {
  const [backendStatus, setBackendStatus] = useState<'stopped' | 'starting' | 'running' | 'error'>('stopped');
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:3001');
  
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        setBackendStatus('running');
      } else {
        setBackendStatus('stopped');
      }
    } catch (error) {
      setBackendStatus('stopped');
    }
  };
  
  const startBackend = async () => {
    setBackendStatus('starting');
    
    try {
      // В реальном приложении здесь был бы вызов к API для запуска сервера
      // Для демонстрации просто ждем 2 секунды и проверяем статус
      setTimeout(() => {
        checkBackendStatus();
      }, 2000);
      
      // Открываем страницу health check в новом окне
      window.open(`${backendUrl}/health`, '_blank');
      
    } catch (error) {
      setBackendStatus('error');
      console.error('Ошибка запуска backend:', error);
    }
  };
  
  const openBackendApi = () => {
    window.open(`${backendUrl}/products`, '_blank');
  };
  
  const openHealthCheck = () => {
    window.open(`${backendUrl}/health`, '_blank');
  };
  
  // Проверяем статус при загрузке компонента
  useEffect(() => {
    checkBackendStatus();
    
    // Проверяем статус каждые 10 секунд
    const interval = setInterval(checkBackendStatus, 10000);
    return () => clearInterval(interval);
  }, [backendUrl]);
  
  return (
    <div className={styles.backendLauncher}>
      <div className={styles.statusIndicator}>
        <div className={`${styles.statusDot} ${styles[backendStatus]}`} />
        <span className={styles.statusText}>
          {backendStatus === 'stopped' && 'Backend остановлен'}
          {backendStatus === 'starting' && 'Запускается...'}
          {backendStatus === 'running' && 'Backend работает'}
          {backendStatus === 'error' && 'Ошибка запуска'}
        </span>
      </div>
      
      <div className={styles.controls}>
        <button
          className={`${styles.button} ${styles.startButton}`}
          onClick={startBackend}
          disabled={backendStatus === 'starting' || backendStatus === 'running'}
          title="Запустить backend сервер"
        >
          {backendStatus === 'running' ? '✅ Запущен' : '🚀 Запустить Backend'}
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
          <a href={`${backendUrl}/health`} target="_blank" rel="noopener noreferrer">
            Health Check
          </a>
          <a href={`${backendUrl}/products`} target="_blank" rel="noopener noreferrer">
            Все товары
          </a>
          <a href={`${backendUrl}/products/1`} target="_blank" rel="noopener noreferrer">
            Товар #1
          </a>
        </div>
      )}
    </div>
  );
}