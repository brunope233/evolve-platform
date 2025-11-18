import { useState, useEffect } from 'react';
import api from '../../lib/api';
import JourneyCard from '../../components/JourneyCard';
import styles from '../../styles/Profile.module.css';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Avatar from '../../components/Avatar';
import FollowButton from '../../components/FollowButton';

export default function ProfilePage({ userProfile: initialProfile }) {
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [journeys, setJourneys] = useState([]);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const { user: loggedInUser, isLoggedIn } = useAuth();

  useEffect(() => {
    setUserProfile(initialProfile);
    if (initialProfile) {
        setLoadingJourneys(true);
        api.get(`/journeys?author=${initialProfile.username}&limit=100`)
            .then(res => setJourneys(res.data.items))
            .catch(err => {
                console.error("Erro ao buscar jornadas do perfil:", err);
                setJourneys([]);
            })
            .finally(() => setLoadingJourneys(false));
    }
  }, [initialProfile]);

  if (!userProfile) {
    return <div>Usuário não encontrado.</div>;
  }

  const isOwner = isLoggedIn && loggedInUser?.username === userProfile.username;
  // Correção lógica: Se eu já sigo, não deve aparecer a opção de seguir apenas se a lógica de UI pedir
  // Mas aqui assumimos que o FollowButton trata o estado "Following/Follow"
  const canFollow = isLoggedIn && !isOwner;

  const handleFollowUpdate = (isNowFollowing) => {
    setUserProfile(prevProfile => ({
      ...prevProfile,
      followerCount: isNowFollowing 
        ? (prevProfile.followerCount || 0) + 1 
        : (prevProfile.followerCount || 1) - 1,
      isFollowing: isNowFollowing,
    }));
  };

  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <Avatar user={userProfile} size={150} />
        <h1 className={styles.username}>{userProfile.username}</h1>
        
        <div className={styles.statsContainer}>
          <span><strong>{loadingJourneys ? '...' : journeys.length}</strong> Jornadas</span>
          <span><strong>{userProfile.followerCount || 0}</strong> Seguidores</span>
          <span><strong>{userProfile.followingCount || 0}</strong> Seguindo</span>
        </div>

        <p className={styles.bio}>{userProfile.bio || 'Este usuário ainda não adicionou uma bio.'}</p>
        
        {isOwner && (
          <Link href="/profile/edit" className={styles.editButton}>
            Editar Perfil
          </Link>
        )}
        
        {/* Só renderiza o botão se não for o dono */}
        {!isOwner && isLoggedIn && (
          <FollowButton 
            username={userProfile.username} 
            initialState={userProfile.isFollowing}
            onUpdate={handleFollowUpdate}
          />
        )}
      </header>
      
      <hr className={styles.divider} />

      <h2 className={styles.journeysTitle}>Jornadas de {userProfile.username}</h2>
      <div className={styles.journeysGrid}>
        {loadingJourneys ? <p>Carregando jornadas...</p> : (
          journeys.length > 0 ? (
            journeys.map((journey) => (
              <JourneyCard key={journey.id} journey={journey} />
            ))
          ) : (
            <p>{userProfile.username} ainda não iniciou nenhuma jornada.</p>
          )
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const { username } = context.params;
    const { req } = context;
    const token = req.cookies.token; // Certifique-se que o cookie se chama 'token'

    // [DEBUG LOG] - Verifique isso no LOG do Cloud Run (Frontend)
    console.log(`[SSR] Buscando perfil: ${username}`);
    console.log(`[SSR] Token presente? ${!!token}`);
    
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    // Certifique-se que a URL base da API está correta no ambiente SSR
    // Em produção, deve ser a URL interna ou a URL pública completa
    const profileRes = await api.get(`/users/profile/${username}`, config);
    
    // [DEBUG LOG]
    console.log(`[SSR] isFollowing retornado do backend: ${profileRes.data.isFollowing}`);

    return { 
        props: { 
            userProfile: profileRes.data,
        } 
    };
  } catch (error) {
    console.error(`[SSR] Falha ao buscar perfil para ${context.params.username}:`, error.message);
    if (error.response) {
        console.error(`[SSR] Status: ${error.response.status}`);
    }
    return { props: { userProfile: null } };
  }
}