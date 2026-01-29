import { useState, useEffect } from 'react'; 
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { api } from '../../services/api';
import { jwtDecode } from 'jwt-decode';
import styles from './styles.module.css';

interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

interface DecodedToken {
  nome: string;
  email: string;
  sub: string;
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Se já houver um token, configura a API e pula para o Dashboard
  useEffect(() => {
    const token = localStorage.getItem('@App:token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, senha });
      const { accessToken } = response.data;

      // 1. Salva o token puro no LocalStorage
      localStorage.setItem('@App:token', accessToken);
      
      const decoded = jwtDecode<DecodedToken>(accessToken);
      localStorage.setItem('@App:userNome', decoded.nome);

      // 2. CONFIGURAÇÃO IMEDIATA: Injeta o token diretamente na instância da API
      // Isso evita o erro "Bearer access token is not available" no primeiro load do Dashboard
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // 3. Redirecionar usando replace para limpar o histórico de navegação
      navigate('/dashboard', { replace: true });
      
    } catch (err: any) {
      console.error('Erro no login:', err);
      setError(err.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.logoPlaceholder}>ELOHIM</div>
        <h2>Acessar Painel</h2>
        <p>Insira suas credenciais para registrar o ponto</p>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorBadge}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email">E-mail</label>
            <input 
              id="email"
              type="email" 
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Senha</label>
            <input 
              id="password"
              type="password" 
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className={styles.mainBtn} disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}