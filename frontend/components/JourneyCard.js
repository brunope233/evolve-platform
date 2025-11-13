import Link from 'next/link';
import styles from '../styles/JourneyCard.module.css';
import { useState, useEffect } from 'react';
import Avatar from './Avatar';

const JourneyCard = ({ journey }) => {
  const { id, title, description, user, createdAt } = journey;
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (createdAt) {
      setFormattedDate(new Date(createdAt).toLocaleDateString());
    }
  }, [createdAt]);

  if (!user) {
    return null;
  }

  return (
    // MUDANÇA 1: A div agora é o elemento principal, com position-relative
    <div className={styles.card}>
      <div className={styles.cardContent}>
        <Link 
          href={`/profile/${user.username}`} 
          className={styles.userInfo} 
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar user={user} size={30} />
          <span className={styles.username}>{user.username}</span>
        </Link>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description ? description.substring(0, 100) : ''}...</p>
        <div className={styles.footer}>
            <small>{formattedDate}</small>
        </div>
      </div>
      {/* MUDANÇA 2: O Link agora é um overlay invisível */}
      <Link href={`/journey/${id}`} className={styles.cardOverlayLink} />
    </div>
  );
};

export default JourneyCard;