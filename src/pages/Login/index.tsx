import { useState, FormEvent, useEffect } from 'react'; // Importado useEffect
import { useNavigate } from 'react-router-dom'; // 1. Importar o hook de navegação
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
  groups: string;
}

export function Login() {
  const navigate = useNavigate(); // 2. Inicializar o hook
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 3. Opcional: Se já estiver logado, pula a tela de login
  useEffect(() => {
    const token = localStorage.getItem('@App:token');
    if (token) {
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

      // Salva o token
      localStorage.setItem('@App:token', accessToken);

      // Decodifica e salva o nome (opcional, já que o dashboard decodifica também)
      const decoded = jwtDecode<DecodedToken>(accessToken);
      localStorage.setItem('@App:userNome', decoded.nome);

      // 4. Redirecionar para o dashboard após o sucesso
      navigate('/dashboard');
      
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