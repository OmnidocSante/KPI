import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Data from './pages/Data';
import Ambulances from './pages/Ambulances';
import Clients from './pages/Clients';
import Medecins from './pages/Medecins';
import Produits from './pages/Produits';
import Infirmiers from './pages/Infirmiers';
import './App.css';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
           <Route 
          path="/ambulances" 
          element={isAuthenticated ? <Ambulances /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/clients" 
          element={isAuthenticated ? <Clients /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/medecins" 
          element={isAuthenticated ? <Medecins /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/infirmiers" 
          element={isAuthenticated ? <Infirmiers /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/produits" 
          element={isAuthenticated ? <Produits /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/data" 
          element={isAuthenticated ? <Data /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </div>
  );
}

export default App;
