import Image from 'next/image';
import styles from '../styles/Avatar.module.css';

const Avatar = ({ user, size = 40 }) => {
  // A URL base para nossos arquivos públicos no Google Cloud Storage
  // Esta variável de ambiente deve ser configurada na plataforma de deploy (Vercel/Firebase)
  const baseUrl = process.env.NEXT_PUBLIC_GCS_URL;

  const hasAvatar = user && user.avatarUrl;
  
  // Constrói a URL completa apenas se for um avatar do GCS, caso contrário usa o fallback local
  const avatarUrl = (hasAvatar && baseUrl)
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
        unoptimized={!hasAvatar} // Não otimiza a imagem de fallback local
      />
    </div>
  );
};

export default Avatar;