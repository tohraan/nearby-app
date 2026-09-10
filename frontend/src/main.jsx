import React, { useState, useEffect } from 'react';
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

function Root() {
  const [route, setRoute] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const isAppRoute = route.startsWith('/app') || window.location.search.includes('app') || window.location.hash.includes('app');

  const navigateToApp = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    window.history.pushState({}, '', '/app');
    setRoute('/app');
  };

  return isAppRoute ? <App /> : <Landing onStartExploring={navigateToApp} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
