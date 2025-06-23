import axios from 'axios';

const API_URL = 'https://kpi.omnidoc.ma:4300'

// Configuration d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Vérifier si le token existe avant de le supprimer
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Ne rediriger que si nous ne sommes pas déjà sur la page de login
        if (!window.location.hash.includes('/login')) {
          window.location.hash = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
// Fonction utilitaire pour récupérer le nom d'un élément
const getNom = (array, id, field) => {
  const item = array.find(item => String(item.id) === String(id));
  return item ? item[field] : id;
};

export { getNom };

export default api; 