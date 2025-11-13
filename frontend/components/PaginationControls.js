import Link from 'next/link';
import styles from '../styles/Pagination.module.css';

const PaginationControls = ({ currentPage, totalPages, basePath = '/' }) => {
  const page = Number(currentPage);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className={styles.paginationContainer}>
      {hasPrevPage ? (
        <Link href={`${basePath}?page=${page - 1}`} className={styles.button}>
          &larr; Página Anterior
        </Link>
      ) : (
        // CÓDIGO CORRIGIDO AQUI
        <div className={`${styles.button} ${styles.disabled}`}>
          &larr; Página Anterior
        </div>
      )}

      <span>
        Página {page} de {totalPages}
      </span>

      {hasNextPage ? (
        <Link href={`${basePath}?page=${page + 1}`} className={styles.button}>
          Próxima Página &rarr;
        </Link>
      ) : (
        // CÓDIGO CORRIGIDO AQUI
        <div className={`${styles.button} ${styles.disabled}`}>
          Próxima Página &rarr;
        </div>
      )}
    </div>
  );
};

export default PaginationControls;