import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchAmbulances, createAmbulance, updateAmbulance, deleteAmbulance } from '../services/api';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, minWidth: 320, background: type === 'success' ? '#4caf50' : '#f44336', color: 'white', padding: '1rem 1.5rem', borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.13)'
    }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
    </div>
  );
};

const Ambulances = () => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAmbulance, setEditAmbulance] = useState(null);
  const [numberPlate, setNumberPlate] = useState('');
  const [type, setType] = useState('MAD');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  const loadAmbulances = async () => {
    setLoading(true);
    try {
      const res = await fetchAmbulances();
      setAmbulances(res.data);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des ambulances", type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAmbulances();
  }, []);

  const openAddModal = () => {
    setEditAmbulance(null);
    setNumberPlate('');
    setType('MAD');
    setShowModal(true);
  };

  const openEditModal = (amb) => {
    setEditAmbulance(amb);
    setNumberPlate(amb.numberPlate);
    setType(amb.type || 'MAD');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editAmbulance) {
        await updateAmbulance(editAmbulance.id, { numberPlate, type });
        setNotification({ message: 'Ambulance modifiée avec succès', type: 'success' });
      } else {
        await createAmbulance({ numberPlate, type });
        setNotification({ message: 'Ambulance ajoutée avec succès', type: 'success' });
      }
      setShowModal(false);
      loadAmbulances();
    } catch (e) {
      setNotification({ message: "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAmbulance(id);
      setNotification({ message: 'Ambulance supprimée', type: 'success' });
      setDeleteId(null);
      loadAmbulances();
    } catch (e) {
      setNotification({ message: "Erreur lors de la suppression", type: 'error' });
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>🚑 Liste des ambulances</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Rechercher une ambulance..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      padding: '0.7rem 1rem',
                      paddingLeft: '2.5rem',
                      borderRadius: '8px',
                      border: '1.5px solid #e3e6f0',
                      fontSize: '0.95rem',
                      width: '300px',
                      background: '#f8fafc'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    left: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '1.1rem'
                  }}>🔍</span>
                </div>
                <button 
                  onClick={openAddModal}
                  style={{
                    background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                    color: 'white',
                    border: 'none',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(25, 118, 210, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span>
                  Ajouter une ambulance
                </button>
              </div>
            </div>
            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Numéro d'immatriculation</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambulances.filter(amb => amb.numberPlate.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                      <tr><td colSpan="4">Aucune ambulance trouvée.</td></tr>
                    ) : ambulances.filter(amb => amb.numberPlate.toLowerCase().includes(search.toLowerCase())).map(amb => (
                      <tr key={amb.id}>
                        <td>{amb.id}</td>
                        <td>{amb.numberPlate}</td>
                        <td>{amb.type || 'MAD'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditModal(amb)}
                              style={{
                                background: '#f8fafc',
                                color: '#1976d2',
                                border: '1.5px solid #1976d2',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.background = '#1976d2';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.background = '#f8fafc';
                                e.currentTarget.style.color = '#1976d2';
                              }}
                            >Modifier</button>
                            <button
                              onClick={() => setDeleteId(amb.id)}
                              style={{
                                background: '#fff5f5',
                                color: '#dc2626',
                                border: '1.5px solid #dc2626',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.background = '#dc2626';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.background = '#fff5f5';
                                e.currentTarget.style.color = '#dc2626';
                              }}
                            >Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        {/* Modale ajout/modif */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <form onSubmit={handleSave} style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
              <h3 style={{ marginBottom: 24 }}>{editAmbulance ? 'Modifier' : 'Ajouter'} une ambulance</h3>
              <div className="form-group">
                <label>Numéro d'immatriculation</label>
                <input type="text" value={numberPlate} onChange={e => setNumberPlate(e.target.value)} required />
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Type d'ambulance</label>
                <select value={type} onChange={e => setType(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 8, border: '1.5px solid #e3e6f0', fontSize: '1rem' }}>
                  <option value="MAD">MAD</option>
                  <option value="A l'acte">A l'acte</option>
                </select>
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="submit-btn" style={{ background: '#dc2626', color: 'white'}} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="submit-btn">{editAmbulance ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        )}
        {/* Confirmation suppression */}
        {deleteId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
              <h3>Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer cette ambulance ?</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button onClick={() => setDeleteId(null)}>Annuler</button>
                <button onClick={() => handleDelete(deleteId)} style={{ color: '#d32f2f' }}>Supprimer</button>
              </div>
            </div>
          </div>
        )}
        {/* Notification */}
        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
      </main>
    </div>
  );
};

export default Ambulances;
