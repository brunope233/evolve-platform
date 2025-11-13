import Link from 'next/link';
import Avatar from './Avatar';
import styles from '../styles/Notifications.module.css';

const NotificationItem = ({ notification }) => {
  const { sender, type, journeyId, proofId } = notification;

  let message = '';
  let href = `/profile/${sender.username}`;

  switch (type) {
    case 'NEW_FOLLOWER':
      message = 'começou a te seguir.';
      break;
    case 'NEW_COMMENT':
      message = 'comentou na sua prova.';
      href = `/journey/${journeyId}`; // Link para a jornada
      break;
    case 'NEW_SUPPORT':
      message = 'apoiou sua prova.';
      href = `/journey/${journeyId}`;
      break;
    case 'BEST_ASSIST': // MUDANÇA: Novo tipo de notificação
      message = 'marcou sua resposta como a melhor!';
      href = `/journey/${journeyId}`;
      break;
    default:
      message = 'interagiu com você.';
  }

  return (
    <Link href={href} className={styles.notificationItem}>
      <Avatar user={sender} size={40} />
      <div className={styles.notificationContent}>
        <strong>{sender.username}</strong> {message}
      </div>
    </Link>
  );
};

export default NotificationItem;