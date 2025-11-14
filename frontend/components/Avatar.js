import Image from 'next/image';
import styles from '../styles/Avatar.module.css';

// O nome do bucket é público e não precisa ser uma variável de ambiente.
const BUCKET_BASE_URL = 'https://storage.googleapis.com/evolve-platform-uploads-bruno';

const Avatar = ({ user, size = 40 }) => {
  const hasAvatar = user && user.avatarUrl;
  
  // Constrói a URL completa diretamente.
  // O 'user.avatarUrl' já vem como 'avatars/...' do nosso backend.
  const avatarUrl = hasAvatar
    ? `${BUCKET_BASE_URL}/${user.avatarUrl}`
    : `/default-avatar.png`;

  return (
    <div className={styles.avatarContainer} style={{ width: size, height: size }}>
      <Image
        src={avatarUrl}
        alt={user?.username || 'Avatar'}
        fill
        sizes={`${size}px`}
        className={styles.avatarImage}
        onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png' }}
        unoptimized={!hasAvatar}
      />
    </div>
  );
};

export default Avatar;