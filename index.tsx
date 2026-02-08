import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    // If not found, try waiting briefly (handles potential race conditions in some environments)
    setTimeout(initializeApp, 50);
    return;
  }

  // Registrace Service Workeru
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('SW registered: ', registration);
      }).catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
    });
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
