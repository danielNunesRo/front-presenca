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

  useEffect(() => {
    const token = localStorage.getItem('@App:token');
    if (token) {
      api.defaults.headers.Authorization = `Bearer ${token}`;
      navigate('/dashboard');
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post<LoginResponse>('/auth/login', { email, senha });
      const { accessToken } = response.data;

      // 1. Salva no LocalStorage
      localStorage.setItem('@App:token', accessToken);
      
      const decoded = jwtDecode<DecodedToken>(accessToken);
      localStorage.setItem('@App:userNome', decoded.nome);

      // 2. Configura a API para usar o token imediatamente
      api.defaults.headers.Authorization = `Bearer ${accessToken}`;

      // 3. Redirecionar
      navigate('/dashboard', { replace: true });
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2>Acessar Painel</h2>
        <p>Insira suas credenciais abaixo</p>

        <form onSubmit={handleSubmit}>
          {error && <div className={styles.errorBadge}>{error}</div>}

          <div className={styles.field}>
            <label>E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.mainBtn} disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}