import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import ErrorBoundary from './ErrorBoundary.jsx';
import { StorageBanner } from './shared.jsx';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* Kabuğun dışında: mobil, masaüstü ve ilk kurulum ekranlarının hepsinde görünür. */}
      <StorageBanner />
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
