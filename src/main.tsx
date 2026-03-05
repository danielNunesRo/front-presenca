import { createRoot } from 'react-dom/client' 
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Login } from './pages/Login/index.tsx'
import  Dashboard  from './pages/Dashboard/index.tsx'
import 'leaflet/dist/leaflet.css';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { StrictMode } from 'react';
import { ChangePassword } from './pages/ChangePassword/index.tsx';
import RelatorioPonto from './pages/RelatorioPonto/index.tsx';

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('@App:token');


  return token ? children : <Navigate to="/" />;
};


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
        <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
        <Route path="/relatorios" element={<PrivateRoute><RelatorioPonto /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)