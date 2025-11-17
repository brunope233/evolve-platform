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
  const [activeTab, setActiveTab] = useState('following');

  const { ref, inView } = useInView({ threshold: 0 });

  const fetchProofs = async (tab, currentPage, currentProofs = []) => {
    setLoading(true);
    try {
      const endpoint = tab === 'following' ? '/feed' : '/feed/for-you';
      const res = await api.get(`${endpoint}?page=${currentPage}`);
      const newProofs = res.data;

      if (newProofs.length === 0) {
        setHasMore(false);
      } else {
        setProofs([...currentProofs, ...newProofs]);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error(`Erro ao buscar feed '${tab}':`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProofs([]);
    setPage(1);
    setHasMore(true);
    fetchProofs(activeTab, 1);
  }, [activeTab]);

  useEffect(() => {
    if (inView && !loading && hasMore) {
      fetchProofs(activeTab, page, proofs);
    }
  }, [inView, loading, hasMore]);

  const renderContent = () => {
    if (loading && proofs.length === 0) {
      return <p>Carregando feed...</p>;
    }
    if (proofs.length > 0) {
      return (
        <div className={styles.proofsList}>
          {proofs.map(proof => (
            <ProofCard key={`${activeTab}-${proof.id}`} proof={proof} />
          ))}
          {hasMore && <div ref={ref}>Carregando mais...</div>}
        </div>
      );
    }
    if (activeTab === 'following') {
      return (
        <div className={styles.emptyFeed}>
          <h2>Seu feed "Seguindo" está vazio!</h2>
          <p>Siga outros usuários para ver as provas deles aqui.</p>
        </div>
      );
    } else {
      return (
        <div className={styles.emptyFeed}>
          <h2>Seu feed "Para Você" está vazio!</h2>
          <p>Apoie (❤️) provas de outros usuários para que possamos aprender seus interesses e recomendar conteúdo.</p>
        </div>
      );
    }
  };

  return (
    <div className={styles.feedContainer}>
      {/* ESTA É A SEÇÃO QUE ESTAVA FALTANDO */}
      <div className={styles.tabContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'following' ? styles.active : ''}`}
          onClick={() => setActiveTab('following')}
        >
          Seguindo
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'for-you' ? styles.active : ''}`}
          onClick={() => setActiveTab('for-you')}
        >
          Para Você
        </button>
      </div>
      
      {renderContent()}
    </div>
  );
}

export default withAuth(FeedPage);