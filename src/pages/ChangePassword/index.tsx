import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; 
import styles from './styles.module.css';

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put('/users', {
        currentPassword,
        newPassword
      });

      alert('Senha atualizada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao atualizar senha';
      alert(`Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Segurança</h2>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>
          Mantenha sua conta protegida alterando sua senha regularmente.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Senha Atual</label>
            <input 
              type="password" 
              placeholder="Digite a senha atual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label>Nova Senha</label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.btnSave} disabled={loading}>
            {loading ? 'PROCESSANDO...' : 'CONFIRMAR ALTERAÇÃO'}
          </button>
          
          <button 
            type="button" 
            className={styles.btnCancel}
            onClick={() => navigate('/dashboard')}
          >
            Voltar para o Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}