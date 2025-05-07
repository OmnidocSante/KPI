import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      console.log('Tentative de connexion...');
      const result = await login(formData.email, formData.password);
      console.log('Résultat de la connexion:', result);
      
      if (result.success) {
        console.log('Connexion réussie, token reçu:', result.token);
        localStorage.setItem('token', result.token);
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
    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    await logout();
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Connexion</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
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
          <button type="submit" disabled={loading}>
            {loading ? 'Chargement...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 
