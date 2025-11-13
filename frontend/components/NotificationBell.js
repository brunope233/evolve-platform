import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationItem from './NotificationItem';
import styles from '../styles/Notifications.module.css';

const NotificationBell = () => {
  // Pega os dados diretamente do AuthContext
  const { notifications, unreadCount, markNotificationsAsRead } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) { // Se está abrindo o menu
      markNotificationsAsRead();
    }
  };

  return (
    <div className={styles.notificationContainer}>
      <button onClick={handleBellClick} className={styles.bellButton}>
        🔔
        {unreadCount > 0 && <div className={styles.unreadIndicator}></div>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notificações</h3>
          </div>
          <div className={styles.dropdownBody}>
            {notifications.length > 0 ? (
              notifications.map(n => <NotificationItem key={n.id} notification={n} />)
            ) : (
              <p className={styles.noNotifications}>Nenhuma notificação ainda.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;