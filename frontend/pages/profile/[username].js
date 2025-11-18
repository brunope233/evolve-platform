import { useState, useEffect } from 'react';
import api from '../../lib/api';
import JourneyCard from '../../components/JourneyCard';
import styles from '../../styles/Profile.module.css';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import Avatar from '../../components/Avatar';
import FollowButton from '../../components/FollowButton';

export default function ProfilePage({ userProfile: initialProfile, journeys: initialJourneys }) {
  const [userProfile, setUserProfile] = useState(initialProfile);
  const [journeys, setJourneys] = useState(initialJourneys);
  const { user: loggedInUser, isLoggedIn } = useAuth();

  useEffect(() => {
    setUserProfile(initialProfile);
    setJourneys(initialJourneys);
  }, [initialProfile, initialJourneys]);

  if (!userProfile) {
    return <div>Usuário não encontrado.</div>;
  }

  const isOwner = isLoggedIn && loggedInUser?.username.toLowerCase() === userProfile.username.toLowerCase();
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
          <span><strong>{journeys?.length || 0}</strong> Jornadas</span>
          <span><strong>{userProfile.followerCount}</strong> Seguidores</span>
          <span><strong>{user.followingCount}</strong> Seguindo</span>
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
        {journeys && journeys.length > 0 ? (
          journeys.map((journey) => (
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
    const { req } = context;
    const token = req.cookies.token;
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    
    // Faz as duas chamadas em paralelo para mais performance
    const [profileRes, journeysRes] = await Promise.all([
        api.get(`/users/profile/${username}`, config),
        api.get(`/journeys?author=${username}`)
    ]);
    
    return { props: { userProfile: profileRes.data, journeys: journeysRes.data.items } };
  } catch (error) {
    console.error(`Failed to fetch profile page data for ${context.params.username}:`, error.message);
    return { props: { userProfile: null, journeys: [] } };
  }
}