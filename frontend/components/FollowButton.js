import { useState, useEffect } from 'react';
import api from '../lib/api';
import styles from '../styles/FollowButton.module.css'; // Verifique se o caminho do CSS está certo para você
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function FollowButton({ username, initialState, onUpdate }) {
  const [isFollowing, setIsFollowing] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  // --- A CORREÇÃO MÁGICA ---
  // Isso garante que se o perfil carregar depois dizendo "Já segue",
  // o botão atualiza visualmente.
  useEffect(() => {
    setIsFollowing(initialState);
  }, [initialState]);

  const handleFollow = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    setLoading(true);
    // Otimismo: Troca o estado visual antes de o servidor responder (pra ficar rápido)
    const previousState = isFollowing;
    setIsFollowing(!previousState);

    try {
      const res = await api.post(`/users/profile/${username}/follow`);
      
      // O backend retorna { following: true/false }
      const newState = res.data.following;
      
      setIsFollowing(newState);
      
      if (onUpdate) {
        onUpdate(newState);
      }

      if (newState) {
        toast.success(`Você está seguindo ${username}`);
      } else {
        toast('Deixou de seguir', { icon: '👋' });
      }

    } catch (error) {
      console.error("Erro ao seguir:", error);
      // Se der erro, desfaz a mudança visual
      setIsFollowing(previousState);
      toast.error('Erro ao realizar ação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
      onClick={handleFollow}
      disabled={loading}
    >
      {loading ? '...' : (isFollowing ? 'Seguindo' : 'Seguir')}
    </button>
  );
}