import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import styles from './styles.module.css';
import { LogIn, LogOut, Clock, Power, MapPin } from 'lucide-react';
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
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastRegister, setLastRegister] = useState<string>('--:--');
  const [historico, setHistorico] = useState<Ponto[]>([]);
  const [showErrorOverlay, setShowErrorOverlay] = useState(false);

  // Função para formatar hora garantindo o fuso horário de Brasília
  const formatarHoraLocal = (dataIso: string) => {
    return new Date(dataIso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
  };

  const fetchHistorico = useCallback(async (id: string) => {
    try {
      const response = await api.get<Ponto[]>(`/pontos/all?usuarioId=${id}`);
      const pontosValidos = response.data.filter((p) => p.valido);
      setHistorico(pontosValidos);

      if (pontosValidos.length > 0) {
        // CORREÇÃO: Pegando a hora formatada corretamente
        setLastRegister(formatarHoraLocal(pontosValidos[0].dataHora));
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('@App:token');
    if (token) {
      try {
        const decoded = jwtDecode<TokenPayload>(token);
        setUserName(decoded.nome);
        setUserId(decoded.sub);
        fetchHistorico(decoded.sub);
      } catch (err) {
        console.error('Token inválido:', err);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate, fetchHistorico]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => {
          console.error('Erro GPS:', err);
          // Alerta útil para debug no celular
          if (err.code === 1) alert("Por favor, autorize a localização no seu navegador/celular.");
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0 
        }
      );
    }

    return () => {
      clearInterval(timer);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('@App:token');
    navigate('/');
  };

  const handleRegisterPonto = async () => {
    if (!location) {
      alert('Aguardando sinal estável do GPS. Certifique-se de estar usando HTTPS.');
      return;
    }

    try {
      const response = await api.post('/pontos', {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
      });

      if (response.data.valido) {
        alert('Ponto registrado com sucesso!');
        fetchHistorico(userId);
      } else {
        triggerError();
      }
    } catch (error) {
      triggerError();
    }
  };

  const triggerError = () => {
    setShowErrorOverlay(true);
    setTimeout(() => setShowErrorOverlay(false), 3000);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.appIcon} />
          <h1>Elohim - Sistema de Ponto Eletrônico</h1>
        </div>
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <strong>{userName}</strong>
            <span>{currentTime.toLocaleDateString('pt-BR')}</span>
          </div>
          <button className={styles.btnLogout} onClick={handleLogout} title="Sair do Sistema">
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
            <h3>
              <Clock size={18} /> Histórico (Pontos Válidos)
            </h3>
            <ul>
              {historico.length > 0 ? (
                historico.slice(0, 8).map((ponto, index) => (
                  <li key={index}>
                    <span>
                      {new Date(ponto.dataHora).toLocaleDateString('pt-BR').slice(0, 5)} -{' '}
                      {formatarHoraLocal(ponto.dataHora)}
                    </span>
                    <span className={styles.statusIn}>Registrado</span>
                  </li>
                ))
              ) : (
                <li className={styles.emptyHistory}>Nenhum registro hoje</li>
              )}
            </ul>
          </aside>

          <section className={styles.mapWrapper}>
            {location ? (
              <MapContainer
                center={[location.latitude, location.longitude]}
                zoom={16}
                className={styles.leafletContainer}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[location.latitude, location.longitude]} />
                <RecenterMap lat={location.latitude} lng={location.longitude} />
                {showErrorOverlay && (
                  <div className={styles.errorOverlay}>
                    <p>Não foi possível registrar o ponto, o local está longe da empresa</p>
                  </div>
                )}
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
    </div>
  );
};

export default Dashboard;