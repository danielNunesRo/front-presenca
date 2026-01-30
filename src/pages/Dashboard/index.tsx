import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import styles from './styles.module.css';
import { LogIn, LogOut, Clock, Power, MapPin, XCircle, Menu, X } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Ponto {
  dataHora: string;
  valido: boolean;
  motivo?: string | null;
}

interface TokenPayload {
  nome: string;
  sub: string;
  groups?: string; 
}

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const watchIdRef = useRef<number | null>(null);

  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false); 
  const [menuOpen, setMenuOpen] = useState(false); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRegister, setLastRegister] = useState<string>('--:--');
  const [historico, setHistorico] = useState<Ponto[]>([]);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);

  const formatarHoraLocal = (dataIso: string) => {
    return new Date(dataIso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const fetchHistorico = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('@App:token');
      const response = await api.get<Ponto[]>(`/pontos/all?usuarioId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pontosValidos = response.data.filter((p) => p.valido);
      setHistorico(pontosValidos);

      if (pontosValidos.length > 0) {
        setLastRegister(formatarHoraLocal(pontosValidos[0].dataHora));
      }
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      if (error.response?.status === 401) handleLogout();
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('@App:token');
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setUserName(decoded.nome);
        setUserId(decoded.sub);
        setIsAdmin(decoded.groups === "ADMIN"); 
        fetchHistorico(decoded.sub);
      } catch (err) {
        handleLogout();
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate, fetchHistorico]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => console.error('Erro GPS:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }

    return () => {
      clearInterval(timer);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleLogout = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    localStorage.clear();
    delete api.defaults.headers.common['Authorization'];
    navigate('/', { replace: true });
  };

  const handleRegisterPonto = async () => {
    if (!location) {
      alert('Aguardando sinal estável do GPS...');
      return;
    }

    try {
      const token = localStorage.getItem('@App:token');
      const response = await api.post('/pontos', {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (response.data.valido) {
        alert('Ponto registrado com sucesso!');
        fetchHistorico(userId);
        navigate('https://front-presenca.vercel.app/', { replace: true });
      } else {
        triggerError();
        setShowErrorOverlay(true);
        setTimeout(() => {
            alert("Não é possível bater o ponto: você está fora do perímetro da escola.");
        }, 100);
        setTimeout(() => setShowErrorOverlay(false), 5000);
      }
    } catch (error) {
      triggerError();
    }
  };

  const triggerError = () => {
    setShowErrorOverlay(true);
    setTimeout(() => setShowErrorOverlay(false), 4000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          {isAdmin && (
            <div className={styles.adminMenuContainer}>
              <button 
                className={styles.btnHamburger} 
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
              
              {menuOpen && (
                <div className={styles.adminDropdown}>
                  <div className={styles.dropdownHeader}>PAINEL ADMIN</div>
                  <Link to="/relatorios" onClick={() => setMenuOpen(false)}>RELATÓRIOS</Link>
                  <Link to="/outro-a-definir" onClick={() => setMenuOpen(false)}>OUTRO A DEFINIR</Link>
                </div>
              )}
            </div>
          )}
          <div className={styles.appIcon} />
          <h1>Elohim - Sistema de Ponto Eletrônico</h1>
        </div>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <strong>{userName}</strong>
            <div className={styles.userLinks}>
              <span>{currentTime.toLocaleDateString('pt-BR')}</span>
              <span className={styles.separator}>|</span>
              <Link to="/change-password" className={styles.changePasswordLink}>
                Altere sua senha
              </Link>
            </div>
          </div>
          <button className={styles.btnLogout} onClick={handleLogout}>
            <Power size={20} />
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        
        <section className={styles.topCards}>
          <div className={styles.card}>
            <label>Horário Atual</label>
            <div className={styles.cardValue}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div className={styles.card}>
            <label>Último Registro</label>
            <div className={styles.cardValue}>{lastRegister}</div>
          </div>
          <div className={`${styles.card} ${styles.logoCard}`}>
            <div className={styles.companyLogoPlaceholder}>COLÉGIO CRISTÃO ELOHIM</div>
          </div>
        </section>

        <section className={styles.actions}>
          <button className={styles.btnIn} onClick={handleRegisterPonto}>
            <LogIn size={20} /> REGISTRAR ENTRADA
          </button>
          <button className={styles.btnOut} onClick={handleRegisterPonto}>
            <LogOut size={20} /> REGISTRAR SAÍDA
          </button>
        </section>

        <div className={styles.bottomGrid}>
          <aside className={styles.historyCard}>
            <h3><Clock size={18} /> Histórico de Pontos</h3>
            <ul>
              {historico.slice(0, 8).map((ponto, index) => (
                <li key={index}>
                  <span>
                    {new Date(ponto.dataHora).toLocaleDateString('pt-BR').slice(0, 5)} - {formatarHoraLocal(ponto.dataHora)}
                  </span>
                  <span className={styles.statusIn}>Registrado</span>
                </li>
              ))}
              {historico.length === 0 && <li className={styles.emptyHistory}>Nenhum registro hoje</li>}
            </ul>
          </aside>

          <section className={styles.mapWrapper}>
            {location ? (
              <MapContainer center={[location.latitude, location.longitude]} zoom={16} className={styles.leafletContainer} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.latitude, location.longitude]} />
                <RecenterMap lat={location.latitude} lng={location.longitude} />
              </MapContainer>
            ) : (
              <div className={styles.mapLoading}>
                <MapPin className={styles.spin} />
                <span>Localizando via GPS...</span>
              </div>
            )}
          </section>
        </div>
      </main>

      {showErrorOverlay && (
        <div className={styles.errorOverlay}>
          <div className={styles.errorContent}>
            <XCircle size={40} color="#fff" />
            <div className={styles.errorText}>
              <strong>Registro não permitido</strong>
              <p>Não é possível bater o ponto: você está fora do perímetro da escola.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;