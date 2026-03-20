import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// The service worker is handled by vite-plugin-pwa automatically.
// We can remove the manual registration to avoid conflicts.

const rootElement = document.getElementById('root');
console.log('Main.tsx: Root element found:', !!rootElement);

if (rootElement) {
  try {
    console.log('Main.tsx: Starting render...');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('Main.tsx: Render called successfully');
  } catch (error) {
    console.error('Erro ao renderizar App:', error);
    if (typeof (window as any).onerror === 'function') {
      (window as any).onerror('Erro ao renderizar App: ' + (error as any).message, 'main.tsx', 0, 0, error);
    }
  }
} else {
  console.error('Root element not found');
}

