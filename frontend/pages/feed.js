import { useState, useEffect } from 'react';
import api from '../lib/api';
import withAuth from '../components/withAuth';
import ProofCard from '../components/ProofCard';
import { useInView } from 'react-intersection-observer';
import styles from '../styles/Feed.module.css';

function FeedPage() {
  const [proofs, setProofs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const { ref, inView } = useInView(); // Hook para detectar a visibilidade

  // Função para buscar mais provas
  const loadMoreProofs = async () => {
    if (!hasMore) return;
    
    const res = await api.get(`/feed?page=${page}`);
    const newProofs = res.data;

    if (newProofs.length === 0) {
      setHasMore(false);
    } else {
      setProofs((prevProofs) => [...prevProofs, ...newProofs]);
      setPage((prevPage) => prevPage + 1);
    }
  };
  
  // Carrega as provas iniciais
  useEffect(() => {
    setLoading(true);
    api.get('/feed?page=1').then(res => {
        setProofs(res.data);
        setPage(2);
        if (res.data.length < 10) setHasMore(false);
        setLoading(false);
    });
  }, []);

  // Carrega mais provas quando o elemento 'ref' se torna visível
  useEffect(() => {
    if (inView) {
      loadMoreProofs();
    }
  }, [inView]);

  return (
    <div className={styles.feedContainer}>
      <h1 className={styles.title}>Seu Feed</h1>
      {loading && proofs.length === 0 ? (
        <p>Carregando feed...</p>
      ) : proofs.length > 0 ? (
        <div className={styles.proofsList}>
          {proofs.map(proof => (
            <ProofCard key={proof.id} proof={proof} />
          ))}
          {hasMore && <div ref={ref}>Carregando mais...</div>}
        </div>
      ) : (
        <div className={styles.emptyFeed}>
            <h2>Seu feed está vazio!</h2>
            <p>Siga outros usuários para ver as provas deles aqui.</p>
        </div>
      )}
    </div>
  );
}

export default withAuth(FeedPage); // Protege a página