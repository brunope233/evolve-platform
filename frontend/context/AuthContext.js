import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import jwt_decode from 'jwt-decode';
import api, { setAuthToken } from '../lib/api';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  // --- CONFIGURAÇÃO SIMPLIFICADA DE COOKIE ---
  // Removemos 'Secure' e 'SameSite' estrito para garantir que o SSR consiga ler
  const cookieOptions = {
    expires: 7, // 7 dias
    path: '/', 
    // secure: false, // Desativado propositalmente para teste
    // sameSite: 'Lax'
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        setAuthToken(token);
        const decodedUser = jwt_decode(token);
        
        const currentTime = Date.now() / 1000;
        if (decodedUser.exp < currentTime) {
            throw new Error("Token expirado");
        }

        setUser(decodedUser);
        
        api.get('/notifications').then(res => {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.isRead).length);
        }).catch(err => console.log("Erro ao carregar notificações:", err.message));

      } catch (error) {
        console.error("Sessão inválida:", error);
        logout(); 
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = Cookies.get('token');
    if (!token) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL 
        ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
        : '';
        
    if (!socketUrl) return;

    const socket = io(socketUrl, {
        auth: { token }
    });

    const eventName = 'new_notification';

    socket.on(eventName, (newNotification) => {
      if (newNotification.recipientId === user.sub || newNotification.recipientId === user.userId) {
        toast('Você tem uma nova notificação!', { icon: '🔔' });
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      socket.off(eventName);
      socket.disconnect();
    };
  }, [user]);

  const markNotificationsAsRead = async () => {
    if (unreadCount > 0) {
        setUnreadCount(0);
        try {
            await api.post('/notifications/read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Falha ao marcar como lidas:", error);
            setUnreadCount(notifications.filter(n => !n.isRead).length);
        }
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token } = res.data;

      // Salva o Cookie
      Cookies.set('token', access_token, cookieOptions);
      
      setAuthToken(access_token);
      const decodedUser = jwt_decode(access_token);
      setUser(decodedUser);
      
      router.push('/');
      toast.success('Login bem-sucedido!');
    } catch (error) {
      console.error('Login failed', error.response?.data);
      toast.error(error.response?.data?.message || 'Falha no login.');
    }
  };

  const register = async (username, email, password) => {
    const promise = api.post('/auth/register', {
      username,
      email,
      password,
    });
    
    toast.promise(promise, {
        loading: 'Registrando...',
        success: 'Conta criada! Faça login.',
        error: (err) => err.response?.data?.message || 'Falha no registro.',
    });

    try {
        await promise;
        router.push('/login');
    } catch (error) {
        console.error('Registration failed', error.response?.data);
    }
  };

  const logout = () => {
    Cookies.remove('token', cookieOptions);
    Cookies.remove('token'); 
    
    setUser(null);
    setAuthToken(null);
    setNotifications([]);
    setUnreadCount(0);
    router.push('/login');
    toast.success('Você saiu da sua conta.');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      register, 
      loading, 
      isLoggedIn: !!user,
      notifications, 
      unreadCount, 
      markNotificationsAsRead 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;