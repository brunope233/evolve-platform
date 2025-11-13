import api from '../lib/api';
import JourneyCard from '../components/JourneyCard';
import styles from '../styles/Home.module.css';
import PaginationControls from '../components/PaginationControls';

export default function ExplorarPage({ data }) {
  if (!data) {
    return <p>Não foi possível carregar as jornadas.</p>
  }
  
  const { items: journeys, meta } = data;

  return (
    <div>
      <h1 className={styles.title}>Jornadas Recentes</h1>
      <div className={styles.grid}>
        {journeys.length > 0 ? (
          journeys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))
        ) : (
          <p>Nenhuma jornada foi criada ainda.</p>
        )}
      </div>
      <PaginationControls currentPage={meta.currentPage} totalPages={meta.totalPages} basePath="/explorar" />
    </div>
  );
}

export async function getServerSideProps(context) {
  try {
    const page = context.query.page || 1;
    const res = await api.get(`/journeys?page=${page}&limit=9`);
    
    return {
      props: {
        data: res.data,
      },
    };
  } catch (error) {
    console.error('Failed to fetch journeys for explore page:', error.code);
    return {
      props: {
        data: null,
      },
    };
  }
}