import '../styles/globals.css';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast'; // MUDANÇA 1: Importar

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <>
        {/* MUDANÇA 2: Adicionar o componente Toaster */}
        <Toaster 
          position="top-right" // Posição das notificações
          toastOptions={{
            duration: 5000, // Duração de 5 segundos
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <Navbar />
        <main>
          <Component {...pageProps} />
        </main>
      </>
    </AuthProvider>
  );
}

export default MyApp;