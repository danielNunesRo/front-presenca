import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' // Você já importou o createRoot aqui
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './pages/Login/index.tsx'
import  Dashboard  from './pages/Dashboard/index.tsx'
import 'leaflet/dist/leaflet.css';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem('@App:token');

  // Se não tiver token, manda de volta para o "/" (Login)
  return token ? children : <Navigate to="/" />;
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)