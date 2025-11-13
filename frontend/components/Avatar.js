import Image from 'next/image';
import styles from '../styles/Avatar.module.css';

const Avatar = ({ user, size = 40 }) => {
  // Usamos a URL pública sempre
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '');

  const hasAvatar = user && user.avatarUrl;
  const avatarUrl = hasAvatar
    ? `${baseUrl}/${user.avatarUrl}`
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
        // MUDANÇA: Se não for um avatar de usuário, não otimize.
        unoptimized={!hasAvatar}
      />
    </div>
  );
};

export default Avatar;