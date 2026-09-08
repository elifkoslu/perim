import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import ErrorBoundary from './ErrorBoundary.jsx';
import { StorageBanner } from './shared.jsx';
import App from './App.jsx';
import { kaliciDepolamaIste } from './persist-storage';

/* Veriyi tarayıcının kendiliğinden silmemesi için kalıcılık iste.
   Açılışta bir kez; sonucu beklemeye gerek yok, uygulama bu istekten
   bağımsız çalışır. */
kaliciDepolamaIste();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {/* Kabuğun dışında: mobil, masaüstü ve ilk kurulum ekranlarının hepsinde görünür. */}
      <StorageBanner />
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
