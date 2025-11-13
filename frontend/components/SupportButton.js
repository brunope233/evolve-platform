import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/SupportButton.module.css';
import toast from 'react-hot-toast';
import io from 'socket.io-client'; // Importar

const SupportButton = ({ proof }) => {
  const { user, isLoggedIn } = useAuth();
  const [supportCount, setSupportCount] = useState(proof.supports?.length || 0);
  const [isSupported, setIsSupported] = useState(false);

  // Efeito para verificar o estado inicial
  useEffect(() => {
    if (isLoggedIn && proof.supports) {
      const userHasSupported = proof.supports.some(support => support.userId === user.sub);
      setIsSupported(userHasSupported);
    } else {
      setIsSupported(false);
    }
  }, [isLoggedIn, user, proof.supports]);
  
  // MUDANÇA: Novo useEffect para o WebSocket
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', ''));
    const eventName = `proof:${proof.id}:support_updated`;

    // Ouve por atualizações na contagem de apoios
    socket.on(eventName, ({ newSupportCount }) => {
        // Atualiza a contagem com o valor recebido do servidor
        setSupportCount(newSupportCount);
    });

    return () => {
        socket.off(eventName);
        socket.disconnect();
    };
  }, [proof.id]);

  const handleSupportClick = async () => {
    if (!isLoggedIn) {
      toast.error("Você precisa estar logado para apoiar uma prova.");
      return;
    }

    // UI Otimista (apenas para o clique inicial do próprio usuário)
    const originalSupportState = isSupported;
    setIsSupported(prevState => !prevState);
    // Não precisamos mais da UI otimista para a contagem,
    // pois o evento do socket se tornará a "fonte da verdade".
    
    try {
      await api.post(`/proofs/${proof.id}/support`);
      // A atualização da contagem agora vem do evento do socket para todos,
      // incluindo o usuário que clicou.
    } catch (error) {
      console.error("Falha ao atualizar o apoio:", error);
      toast.error("Ocorreu um erro. Tente novamente.");
      // Se falhar, reverte apenas o estado do botão
      setIsSupported(originalSupportState);
    }
  };

  return (
    <button 
      className={`${styles.supportButton} ${isSupported ? styles.supported : ''}`}
      onClick={handleSupportClick}
    >
      ❤️ <span className={styles.count}>{supportCount}</span>
    </button>
  );
};

export default SupportButton;