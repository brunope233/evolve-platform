import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Navbar.module.css';
import SearchBar from './SearchBar';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';
import { useState, useEffect } from 'react';
import api from '../lib/api';

const Navbar = () => {
  const { isLoggedIn, user, logout } = useAuth();
  const [fullUser, setFullUser] = useState(null);

  useEffect(() => {
    if (isLoggedIn && user && user.username) {
      const fetchFullUser = async () => {
        try {
          const res = await api.get(`/users/profile/${user.username}`);
          setFullUser(res.data);
        } catch (error) {
          console.error("Falha ao buscar usuário completo para a navbar:", error);
        }
      };
      fetchFullUser();
    } else {
      setFullUser(null);
    }
  }, [isLoggedIn, user]);

  // MUDANÇA: O logo agora aponta para o feed se logado, ou para explorar se não.
  const logoHref = isLoggedIn ? '/feed' : '/explorar';

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.leftNav}>
          <Link href={logoHref} className={styles.logo}> Evolve </Link>
          {/* MUDANÇA: Adicionar link "Explorar" */}
          <Link href="/explorar" className={styles.navLinkItem}>Explorar</Link>
        </div>
        
        <div className={styles.centerNav}>
          <SearchBar />
        </div>

        <div className={styles.navLinks}>
          {isLoggedIn ? (
            <>
              <Link href="/feed" className={styles.navLinkItem}>Feed</Link>
              <Link href="/journey/create" className={styles.navLinkItem}>Criar Jornada</Link>
              <NotificationBell />
              {fullUser ? (
                <Link href={`/profile/${user.username}`} className={styles.navLinkItem}>
                  <Avatar user={fullUser} size={32} />
                </Link> 
              ) : (
                <div className={styles.avatarPlaceholder} />
              )}
              <button onClick={logout} className={styles.logoutButton}>Sair</button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.navLinkItem}>Login</Link>
              <Link href="/register" className={styles.navLinkItem}>Registrar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;