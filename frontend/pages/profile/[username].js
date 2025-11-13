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
  const { user: loggedInUser, isLoggedIn } = useAuth();

  useEffect(() => {
    setUserProfile(initialProfile);
  }, [initialProfile]);

  if (!userProfile) {
    return <div>Usuário não encontrado.</div>;
  }

  const isOwner = isLoggedIn && loggedInUser?.username === userProfile.username;
  const canFollow = isLoggedIn && !isOwner;

  const handleFollowUpdate = (isNowFollowing) => {
    setUserProfile(prevProfile => ({
      ...prevProfile,
      followerCount: isNowFollowing 
        ? prevProfile.followerCount + 1 
        : prevProfile.followerCount - 1,
      isFollowing: isNowFollowing,
    }));
  };

  return (
    <div className={styles.profileContainer}>
      <header className={styles.profileHeader}>
        <Avatar user={userProfile} size={150} />
        <h1 className={styles.username}>{userProfile.username}</h1>
        
        <div className={styles.statsContainer}>
          <span><strong>{userProfile.journeys?.length || 0}</strong> Jornadas</span>
          <span><strong>{userProfile.followerCount}</strong> Seguidores</span>
          <span><strong>{userProfile.followingCount}</strong> Seguindo</span>
        </div>

        <p className={styles.bio}>{userProfile.bio || 'Este usuário ainda não adicionou uma bio.'}</p>
        
        {isOwner && (
          <Link href="/profile/edit" className={styles.editButton}>
            Editar Perfil
          </Link>
        )}
        {canFollow && (
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
        {userProfile.journeys && userProfile.journeys.length > 0 ? (
          userProfile.journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))
        ) : (
          <p>{userProfile.username} ainda não iniciou nenhuma jornada.</p>
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const { username } = context.params;
    const { req } = context; // Pega o objeto de requisição do servidor

    // Pega o token JWT dos cookies que foram enviados pelo navegador
    const token = req.cookies.token; 

    // Monta a configuração da requisição
    const config = {};
    if (token) {
      // Se o token existir, o adiciona ao cabeçalho de Autorização
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    // Faz a chamada para a API, enviando a configuração com o token
    const res = await api.get(`/users/profile/${username}`, config);
    
    return {
      props: { userProfile: res.data },
    };
  } catch (error) {
    console.error(`Failed to fetch profile for ${context.params.username}:`, error.message);
    return { props: { userProfile: null } };
  }
}