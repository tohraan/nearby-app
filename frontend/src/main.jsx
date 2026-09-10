import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import Landing from './screens/Landing.jsx';
import 'leaflet/dist/leaflet.css';
import './styles/global.css';
import './styles/components.css';


// Register service worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}

const path = window.location.pathname;
const isAppRoute = path.startsWith('/app');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAppRoute ? <App /> : <Landing />}
  </React.StrictMode>,
);
