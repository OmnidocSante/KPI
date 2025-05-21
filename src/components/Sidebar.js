import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
   // { path: '/data', label: 'Données', icon: '📈' },
    { path: '/ambulances', label: 'Ambulances', icon: '🚑' },
    { path: '/clients', label: 'Clients', icon: '👥' },
    { path: '/medecins', label: 'Médecins', icon: '🩺' },
    { path: '/produits', label: 'Produits', icon: '📦' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fermer la sidebar mobile quand on clique sur un lien
  const handleNav = (path) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  // Affichage du bouton hamburger sur mobile
  return (
    <>
      <button className="sidebar-hamburger" onClick={() => setIsMobileOpen(true)}>
        <span />
        <span />
        <span />
      </button>
      {(isMobileOpen || window.innerWidth > 768) && (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h1 className="logo">Omni<span style={{ color: '#00d8ff' }}>D</span>oc</h1>
            <div className="sidebar-actions">
              <button 
                className="collapse-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Déplier' : 'Réduire'}
              >
                {isCollapsed ? '→' : '←'}
              </button>
              <button className="close-btn" onClick={() => setIsMobileOpen(false)} title="Fermer">
                ✕
              </button>
            </div>
          </div>

          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.[0]?.toUpperCase()}{user?.prenom?.[0]?.toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="user-details">
                <span className="user-name">{user?.name} {user?.prenom}</span>
                <span className="user-role">Administrateur</span>
              </div>
            )}
   {!isCollapsed && (
              <a href="#" style={{textDecoration: 'none', color: 'inherit'}} className="logout-inline" onClick={handleLogout} title="Déconnexion">
                <span className="nav-icon">⏻</span>
              </a>
            )}
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNav(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      )}
      {/* Overlay pour mobile */}
      {isMobileOpen && <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)}></div>}
    </>
  );
};

export default Sidebar; 
