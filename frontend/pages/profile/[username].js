import { useState, useEffect } from 'react';
import api from '../../lib/api';
import JourneyCard from '../../components/JourneyCard';
import styles from '../../styles/Profile.module.css';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Avatar from '../../components/Avatar';
import FollowButton from '../../components/FollowButton';
import { useRouter } from 'next/router';

export default function ProfilePage({ userProfile: initialProfile }) {
  const router = useRouter();
  const { username } = router.query;
  
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [journeys, setJourneys] = useState([]);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const { user: loggedInUser, isLoggedIn } = useAuth();

  // --- EFEITO 1: Sincroniza dados iniciais ---
  useEffect(() => {
    if (initialProfile) {
        setUserProfile(initialProfile);
    }
  }, [initialProfile]);

  // --- EFEITO 2: A Mágica do Client-Side (Corrige o botão) ---
  useEffect(() => {
    if (!username) return;

    // 1. Busca as Jornadas
    setLoadingJourneys(true);
    api.get(`/journeys?author=${username}&limit=100`)
        .then(res => setJourneys(res.data.items))
        .catch(err => {
            console.error("Erro ao buscar jornadas:", err);
            setJourneys([]);
        })
        .finally(() => setLoadingJourneys(false));

    // 2. RE-BUSCA O PERFIL (Isso corrige o status 'isFollowing')
    // O navegador tem o token, então essa chamada vai autenticada!
    if (isLoggedIn) {
        api.get(`/users/profile/${username}`)
           .then(res => {
               console.log("Perfil atualizado pelo cliente:", res.data);
               // Atualiza o estado com os dados reais (incluindo isFollowing: true)
               setUserProfile(res.data); 
           })
           .catch(err => console.error("Erro ao atualizar perfil:", err));
    }

  }, [username, isLoggedIn]); // Executa quando muda o usuário ou o login

  if (!userProfile) {
    return <div style={{padding: '2rem', textAlign: 'center'}}>Carregando perfil...</div>;
  }

  const isOwner = isLoggedIn && loggedInUser?.username === userProfile.username;
  // Mostra o botão se estiver logado e não for o dono
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
        
        {/* Renderiza o botão com o estado atualizado do userProfile */}
        {canFollow && (
          <FollowButton 
            username={userProfile.username} 
            initialState={userProfile.isFollowing} // Aqui virá 'true' após o useEffect rodar
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

// O SSR continua existindo para SEO, mas não dependemos dele para auth
export async function getServerSideProps(context) {
  try {
    const { username } = context.params;
    // Busca pública (sem token) apenas para garantir que a página exista e tenha dados básicos
    const profileRes = await api.get(`/users/profile/${username}`);
    
    return { 
        props: { 
            userProfile: profileRes.data,
        } 
    };
  } catch (error) {
    return { props: { userProfile: null } };
  }
}