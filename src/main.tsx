import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safeguard window.fetch property assignment
(function() {
  try {
    const origFetch = window.fetch;
    let currentFetch = origFetch;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get() {
        return currentFetch || origFetch;
      },
      set(fn) {
        currentFetch = fn;
      }
    });
  } catch (e) {
    // Ignore if unconfigurable
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
