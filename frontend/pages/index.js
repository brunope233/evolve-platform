import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

// Esta página agora serve apenas como um ponto de entrada para redirecionamento.
export default function IndexPage() {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Espera o AuthContext terminar de carregar para saber se o usuário está logado.
    if (!loading) {
      if (isLoggedIn) {
        // Se estiver logado, redireciona para o feed.
        router.replace('/feed');
      } else {
        // Se não estiver logado, redireciona para a página de exploração.
        router.replace('/explorar');
      }
    }
  }, [isLoggedIn, loading, router]);

  // Enquanto o AuthContext carrega, exibe uma tela de carregamento centralizada.
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Spinner />
    </div>
  );
}