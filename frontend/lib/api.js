import axios from 'axios';

// Esta função determina se o código está rodando no servidor ou no navegador.
const isServer = () => typeof window === 'undefined';

const getApiUrl = () => {
  return isServer()
    ? process.env.API_URL_INTERNAL // Nome novo e correto
    : process.env.NEXT_PUBLIC_API_URL;
};

// Criamos uma instância do Axios pré-configurada
const api = axios.create({
  baseURL: getApiUrl(),
});

// Função para definir o token de autorização globalmente
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;