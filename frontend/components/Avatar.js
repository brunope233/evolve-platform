import Image from 'next/image';
import styles from '../styles/Avatar.module.css';

// URL base do bucket do Google Cloud Storage
const BUCKET_BASE_URL = 'https://storage.googleapis.com/evolve-platform-uploads-bruno';

const Avatar = ({ user, size = 40 }) => {
  const hasAvatar = user && user.avatarUrl;
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