import Link from 'next/link';
import styles from '../styles/Tag.module.css';

const Tag = ({ tag }) => {
  return (
    <Link href={`/search?q=${tag}`} className={styles.tag}>
      #{tag}
    </Link>
  );
};

export default Tag;