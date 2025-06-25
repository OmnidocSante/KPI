import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchMedecins, createMedecin, updateMedecin, deleteMedecin } from '../services/api';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, minWidth: 320, background: type === 'success' ? '#4caf50' : '#f44336', color: 'white', padding: '1rem 1.5rem', borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.13)' }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
    </div>
  );
};

const Medecins = () => {
  const [medecins, setMedecins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMedecin, setEditMedecin] = useState(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  const loadMedecins = async () => {
    setLoading(true);
    try {
      const res = await fetchMedecins();
      setMedecins(res.data);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des médecins", type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMedecins();
  }, []);

  const openAddModal = () => {
    setEditMedecin(null);
    setName('');
    setSpecialty('');
    setShowModal(true);
  };

  const openEditModal = (medecin) => {
    setEditMedecin(medecin);
    setName(medecin.name || '');
    setSpecialty(medecin.specialty || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMedecin) {
        await updateMedecin(editMedecin.id, { name, specialty });
        setNotification({ message: 'Médecin modifié avec succès', type: 'success' });
      } else {
        await createMedecin({ name, specialty });
        setNotification({ message: 'Médecin ajouté avec succès', type: 'success' });
      }
      setShowModal(false);
      loadMedecins();
    } catch (e) {
      setNotification({ message: e?.response?.data?.message || "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMedecin(id);
      setNotification({ message: 'Médecin supprimé', type: 'success' });
      setDeleteId(null);
      loadMedecins();
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
                <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>🩺 Liste des médecins</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un médecin..."
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
                  Ajouter un médecin
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
                      <th>Nom</th>
                      <th>Spécialité</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medecins.filter(medecin =>
                      (medecin.name || '').toLowerCase().includes(search.toLowerCase()) ||
                      (medecin.specialty || '').toLowerCase().includes(search.toLowerCase())
                    ).length === 0 ? (
                      <tr><td colSpan="4">Aucun médecin trouvé.</td></tr>
                    ) : medecins.filter(medecin =>
                      (medecin.name || '').toLowerCase().includes(search.toLowerCase()) ||
                      (medecin.specialty || '').toLowerCase().includes(search.toLowerCase())
                    ).map(medecin => (
                      <tr key={medecin.id}>
                        <td>{medecin.id}</td>
                        <td>{medecin.name || ''}</td>
                        <td>{medecin.specialty || ''}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditModal(medecin)}
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
                              onClick={() => setDeleteId(medecin.id)}
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
              <h3 style={{ marginBottom: 24 }}>{editMedecin ? 'Modifier' : 'Ajouter'} un médecin</h3>
              <div className="form-group">
                <label>Nom</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Spécialité</label>
                <input type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} />
              </div>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="submit-btn" style={{ background: '#dc2626', color: 'white'}} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="submit-btn">{editMedecin ? 'Enregistrer' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        )}
        {/* Confirmation suppression */}
        {deleteId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
              <h3>Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer ce médecin ?</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="submit-btn" style={{ background: '#1976d2', color: 'white'}} onClick={() => setDeleteId(null)}>Annuler</button>
                <button onClick={() => handleDelete(deleteId)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Supprimer</button>
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

export default Medecins;
