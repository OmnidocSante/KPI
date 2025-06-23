import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour vérifier si le token est valide
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      setUser(null);
      setLoading(false);
      return false;
    }

    try {
      // Vérifier d'abord si le token est expiré
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convertir en millisecondes
      
      if (Date.now() >= expirationTime) {
        // Token expiré
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
        return false;
      }

      // Si le token est valide, configurer l'API et vérifier avec le serveur
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Vérifier si le token est valide côté serveur
      const response = await api.get('/users/me');
      if (response.data && response.data.user) {
        setUser(JSON.parse(userData));
        setLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Erreur de vérification du token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
    }
    return false;
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const initializeAuth = async () => {
      if (!isMounted) return;
      
      try {
        const isAuth = await checkAuth();
        if (!isAuth && isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Vérifier l'authentification immédiatement
    initializeAuth();

    // Configurer une vérification périodique (toutes les 5 minutes)
    timeoutId = setInterval(() => {
      if (isMounted) {
        initializeAuth();
      }
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearInterval(timeoutId);
      }
    };
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Début de la tentative de connexion...');
      const response = await api.post('/users/login', { email, password });
      console.log('Réponse du serveur:', response.data);
      
      const { token, user } = response.data;
      
      if (!token) {
        console.error('Pas de token reçu du serveur');
        return {
          success: false,
          error: 'Erreur de connexion: pas de token reçu'
        };
      }
      
      // Stocker les données
      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Vérifier que le token a bien été stocké
        const storedToken = localStorage.getItem('token');
        console.log('Token stocké dans localStorage:', storedToken);
        
        if (!storedToken) {
          throw new Error('Le token n\'a pas été stocké correctement');
        }
        
        // Configurer le token dans l'API
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser(user);
        return { success: true, token };
      } catch (storageError) {
        console.error('Erreur lors du stockage:', storageError);
        return {
          success: false,
          error: 'Erreur lors du stockage des données de connexion'
        };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuth // Exposer la fonction checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}; 