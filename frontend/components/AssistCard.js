import Link from 'next/link';
import Avatar from './Avatar';
import styles from '../styles/AssistCard.module.css'; // Criaremos este arquivo

const AssistCard = ({ assist, isBest, onMarkAsBest, isOwner }) => {
  return (
    <div className={`${styles.assistCard} ${isBest ? styles.bestAssist : ''}`}>
      <div className={styles.header}>
        <Link href={`/profile/${assist.user.username}`} className={styles.userInfo}>
          <Avatar user={assist.user} size={30} />
          <span>{assist.user.username}</span>
        </Link>
        {isBest && <span className={styles.bestBadge}>👑 Melhor Resposta</span>}
      </div>
      <p className={styles.description}>{assist.description || 'Veja este vídeo de ajuda.'}</p>
      <video
        className={styles.videoPlayer}
        controls
        poster={assist.thumbnailUrl ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')}/${assist.thumbnailUrl}` : ''}
        src={`${process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')}/${assist.originalVideoUrl}`}
      >
        Seu navegador não suporta vídeos.
      </video>
      {isOwner && !isBest && (
        <button className={styles.markBestButton} onClick={() => onMarkAsBest(assist.id)}>
          Marcar como Melhor
        </button>
      )}
    </div>
  );
};

export default AssistCard;