import Link from 'next/link';
import Avatar from './Avatar';
import styles from '../styles/Notifications.module.css';

const NotificationItem = ({ notification }) => {
  const { sender, type, journeyId, proofId, suggestedTags } = notification;

  let message = '';
  let href = sender ? `/profile/${sender.username}` : '#';
  let isTagSuggestion = false;

  switch (type) {
    case 'NEW_FOLLOWER':
      message = 'começou a te seguir.';
      break;
    case 'NEW_COMMENT':
      message = 'comentou na sua prova.';
      href = `/journey/${journeyId}`;
      break;
    case 'NEW_SUPPORT':
      message = 'apoiou sua prova.';
      href = `/journey/${journeyId}`;
      break;
    case 'BEST_ASSIST':
      message = 'marcou sua resposta como a melhor!';
      href = `/journey/${journeyId}`;
      break;
    case 'TAG_SUGGESTION': // MUDANÇA: Novo tipo
      isTagSuggestion = true;
      message = 'Sugerimos estas tags para sua nova prova:';
      href = `/journey/${journeyId}`; // Link para a jornada onde está a prova
      break;
    default:
      message = 'interagiu com você.';
  }

  return (
    <Link href={href} className={styles.notificationItem}>
      {/* Para notificações do sistema, podemos usar um ícone diferente */}
      {sender ? (
        <Avatar user={sender} size={40} />
      ) : (
        <div className={styles.systemIcon}>🤖</div>
      )}
      <div className={styles.notificationContent}>
        {sender && <strong>{sender.username}</strong>} {message}
        
        {/* MUDANÇA: Renderiza as tags sugeridas */}
        {isTagSuggestion && suggestedTags && (
            <div className={styles.suggestedTags}>
                {suggestedTags.map(tag => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                ))}
            </div>
        )}
      </div>
    </Link>
  );
};

export default NotificationItem;