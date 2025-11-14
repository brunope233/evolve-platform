import Image from 'next/image';
import styles from '../styles/Avatar.module.css';

const Avatar = ({ user, size = 40 }) => {
  // A URL base do bucket do Google Cloud Storage
  const BUCKET_BASE_URL = `https://storage.googleapis.com/${process.env.NEXT_PUBLIC_GCS_BUCKET_NAME}`;

  const hasAvatar = user && user.avatarUrl;
  
  // Constrói a URL completa.
  // user.avatarUrl agora virá do backend como 'avatars/SEU_ARQUIVO.png'
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