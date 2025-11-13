import { useState } from 'react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import styles from '../styles/Profile.module.css'; // Vamos reutilizar os estilos

const FollowButton = ({ username, initialState, onUpdate }) => {
  const [isFollowing, setIsFollowing] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    // UI Otimista
    const originalState = isFollowing;
    setIsFollowing(prevState => !prevState);
    onUpdate(!originalState); // Notifica o componente pai da mudança

    try {
      await api.post(`/users/profile/${username}/follow`);
    } catch (error) {
      console.error("Falha ao seguir/deixar de seguir:", error);
      toast.error("Ocorreu um erro.");
      // Reverte a UI em caso de erro
      setIsFollowing(originalState);
      onUpdate(originalState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleFollow}
      disabled={isLoading}
      className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
    >
      {isLoading ? '...' : (isFollowing ? 'Seguindo' : 'Seguir')}
    </button>
  );
};

export default FollowButton;