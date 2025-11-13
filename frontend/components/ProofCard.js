import Link from 'next/link';
import styles from '../styles/ProofCard.module.css';
import Avatar from './Avatar';
import SupportButton from './SupportButton';
import CommentsSection from './CommentsSection';
import Tag from './Tag';
import Spinner from './Spinner';

const ProofCard = ({ proof }) => {
  // CORREÇÃO: Extrai 'journey' de 'proof', e então 'user' de 'journey'.
  const { journey } = proof;
  const { user } = journey;

  // Adiciona uma verificação de segurança. Se não houver jornada ou usuário, não renderiza.
  if (!journey || !user) {
    return null;
  }

  // Componente de cabeçalho para reutilização
  const CardHeader = () => (
    <div className={styles.header}>
      <Link href={`/profile/${user.username}`} className={styles.userInfo}>
        <Avatar user={user} size={40} />
        <div className={styles.userDetails}>
          <span className={styles.username}>{user.username}</span>
          <span className={styles.timestamp}>{new Date(proof.createdAt).toLocaleDateString()}</span>
        </div>
      </Link>
      <div className={styles.journeyInfo}>
        <span>em</span>
        <Link href={`/journey/${journey.id}`} className={styles.journeyLink}>
          {journey.title}
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.proofCard}>
      <CardHeader />
      <div className={styles.videoContainer}>
        {proof.status === 'PROCESSING' && ( <div className={styles.processingOverlay}><Spinner /><p>Processando...</p></div> )}
        {proof.status === 'READY' && (
            <video
              key={proof.thumbnailUrl}
              className={styles.videoPlayer}
              controls
              poster={proof.thumbnailUrl ? `${process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')}/${proof.thumbnailUrl}` : ''}
              src={`${process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')}/${proof.originalVideoUrl}`}
            >
              Seu navegador não suporta vídeos.
            </video>
        )}
        {proof.hasRealTimeSeal && ( <div className={styles.realTimeSeal} title="Selo RealTime">✔️</div> )}
      </div>
      <div className={styles.proofInfo}>
        <div className={styles.proofHeader}>
          <h3>{proof.title || 'Prova sem título'}</h3>
          <SupportButton proof={proof} />
        </div>
        <p>{proof.description}</p>
      </div>
      <CommentsSection proof={proof} />
    </div>
  );
};

export default ProofCard;