// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx'; // Asegúrate que la ruta sea correcta
import './assets/css/main.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider> {/* AuthProvider debe envolver a App */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);