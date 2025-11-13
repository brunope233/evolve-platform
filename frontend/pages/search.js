import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import JourneyCard from '../components/JourneyCard';
import styles from '../styles/Search.module.css'; // Criaremos este arquivo

export default function SearchPage() {
  const router = useRouter();
  const { q } = router.query; // Pega o termo de busca da URL
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Roda a busca sempre que o termo 'q' na URL mudar
    if (q) {
      setLoading(true);
      api.get(`/search/journeys?q=${q}`)
        .then(res => {
          setResults(res.data);
        })
        .catch(err => {
          console.error("Erro ao buscar:", err);
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [q]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Resultados da Busca por: "{q}"</h1>
      
      {loading ? (
        <p>Buscando...</p>
      ) : (
        <div className={styles.grid}>
          {results.length > 0 ? (
            results.map(journey => (
              <JourneyCard key={journey.id} journey={journey} />
            ))
          ) : (
            <p>Nenhum resultado encontrado para "{q}".</p>
          )}
        </div>
      )}
    </div>
  );
}