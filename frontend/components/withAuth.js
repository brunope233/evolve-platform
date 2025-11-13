import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  const Wrapper = (props) => {
    const { isLoggedIn, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Se o carregamento terminou e o usuário não está logado, redireciona.
      if (!loading && !isLoggedIn) {
        router.push('/login');
      }
    }, [isLoggedIn, loading, router]);

    // Enquanto carrega, pode-se mostrar um spinner ou nada.
    if (loading || !isLoggedIn) {
      return <div>Carregando...</div>; 
    }

    // Se estiver logado, renderiza o componente da página.
    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth; 
