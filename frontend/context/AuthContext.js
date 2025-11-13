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

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        setAuthToken(token);
        const decodedUser = jwt_decode(token);
        setUser(decodedUser);
        api.get('/notifications').then(res => {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.isRead).length);
        });
      } catch (error) {
        console.error("Token inválido:", error);
        Cookies.remove('token');
        setAuthToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = Cookies.get('token');
    if (!token) return;

    // Conecta ao WebSocket, enviando o token para autenticação
    const socket = io(process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', ''), {
        auth: {
            token: token
        }
    });

    const eventName = 'new_notification';

socket.on(eventName, (newNotification) => {
  // O cliente recebe TODAS as notificações, mas só reage se for para ele.
  if (newNotification.recipientId === user.sub) {
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
      Cookies.set('token', access_token, { expires: 1, path: '/' });
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
        success: 'Conta criada com sucesso! Por favor, faça o login.',
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