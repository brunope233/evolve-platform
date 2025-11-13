import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css'; // Reutilizaremos o estilo da Navbar

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${query.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={styles.searchForm}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar jornadas..."
        className={styles.searchInput}
      />
      <button type="submit" className={styles.searchButton}>🔍</button>
    </form>
  );
};

export default SearchBar;