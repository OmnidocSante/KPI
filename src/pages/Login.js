import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        console.log('Tentative de connexion...');
        const result = await login(formData.email, formData.password);
        console.log('Résultat de la connexion:', result);
        
        if (result.success) {
          console.log('Connexion réussie, token reçu:', result.token);
          // Stocker le token dans le localStorage
          localStorage.setItem('token', result.token);
          // Vérifier que le token a bien été stocké
          const storedToken = localStorage.getItem('token');
          console.log('Token stocké dans localStorage:', storedToken);
          
          if (!storedToken) {
            setError('Erreur lors du stockage du token');
            return;
          }
          
          navigate('/dashboard');
        } else {
          setError(result.error);
        }
      } else {
        // Création de compte
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return;
        }

        const response = await api.post('/users', {
          name: formData.name,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password
        });

        if (response.data) {
          // Connexion automatique après création de compte
          const loginResult = await login(formData.email, formData.password);
          if (loginResult.success) {
            console.log('Connexion après création de compte réussie, token reçu:', loginResult.token);
            localStorage.setItem('token', loginResult.token);
            const storedToken = localStorage.getItem('token');
            console.log('Token stocké dans localStorage:', storedToken);
            
            if (!storedToken) {
              setError('Erreur lors du stockage du token');
              return;
            }
            
            navigate('/dashboard');
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Supprimer le token du localStorage lors de la déconnexion
    localStorage.removeItem('token');
    await logout();
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>{isLogin ? 'Connexion' : 'Création de compte'}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Nom</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="prenom">Prénom</label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <br/>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <button type="submit" disabled={loading}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>
        <br/>
        <div className="switch-form">
          <button
            type="button"
            className="switch-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({
                name: '',
                prenom: '',
                email: '',
                password: '',
                confirmPassword: ''
              });
            }}
          >
            {isLogin ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
          </button>
        </div>
      
      </div>
    </div>
  );
};

export default Login; 