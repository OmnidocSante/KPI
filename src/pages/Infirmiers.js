import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchInfirmiers, createInfirmier, updateInfirmier, deleteInfirmier } from '../services/api';

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

const Infirmiers = () => {
  const [infirmiers, setInfirmiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editInfirmier, setEditInfirmier] = useState(null);
  const [nom, setNom] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [ville, setVille] = useState('');
  const [email, setEmail] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  // Calculer les infirmiers filtrés
  const filteredInfirmiers = infirmiers.filter(infirmier =>
    (infirmier.nom || '').toLowerCase().includes(search.toLowerCase()) ||
    (infirmier.specialty || '').toLowerCase().includes(search.toLowerCase()) ||
    (infirmier.ville || '').toLowerCase().includes(search.toLowerCase())
  );

  const loadInfirmiers = async () => {
    setLoading(true);
    try {
      const res = await fetchInfirmiers();
      setInfirmiers(res.data);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des infirmiers", type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInfirmiers();
  }, []);

  const openAddModal = () => {
    setEditInfirmier(null);
    setNom('');
    setSpecialty('');
    setPhone('');
    setContact('');
    setVille('');
    setEmail('');
    setShowModal(true);
  };

  const openEditModal = (infirmier) => {
    setEditInfirmier(infirmier);
    setNom(infirmier.nom || '');
    setSpecialty(infirmier.specialty || '');
    setPhone(infirmier.phone || '');
    setContact(infirmier.contact || '');
    setVille(infirmier.ville || '');
    setEmail(infirmier.email || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const infirmierData = { nom, specialty, phone, contact, ville, email };
      if (editInfirmier) {
        await updateInfirmier(editInfirmier.id, infirmierData);
        setNotification({ message: 'Infirmier modifié avec succès', type: 'success' });
      } else {
        await createInfirmier(infirmierData);
        setNotification({ message: 'Infirmier ajouté avec succès', type: 'success' });
      }
      setShowModal(false);
      loadInfirmiers();
    } catch (e) {
      setNotification({ message: e?.response?.data?.message || "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInfirmier(id);
      setNotification({ message: 'Infirmier supprimé', type: 'success' });
      setDeleteId(null);
      loadInfirmiers();
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>💉 Liste des infirmiers</h2>
                <span style={{
                  background: 'linear-gradient(135deg, #1976d2, #2196f3)',
                  color: 'white',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  Total: {filteredInfirmiers.length} {filteredInfirmiers.length <= 1 ? 'infirmier' : 'infirmiers'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un infirmier..."
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
                  Ajouter un infirmier
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
                      <th>Téléphone</th>
                      <th>Contact</th>
                      <th>Ville</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInfirmiers.length === 0 ? (
                      <tr><td colSpan="8">Aucun infirmier trouvé.</td></tr>
                    ) : filteredInfirmiers.map(infirmier => (
                      <tr key={infirmier.id}>
                        <td>{infirmier.id}</td>
                        <td>{infirmier.nom || ''}</td>
                        <td>{infirmier.specialty || ''}</td>
                        <td>{infirmier.phone || '-'}</td>
                        <td>{infirmier.contact || '-'}</td>
                        <td>{infirmier.ville || '-'}</td>
                        <td>{infirmier.email || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                            <button
                              onClick={() => openEditModal(infirmier)}
                              title="Modifier"
                              style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                minHeight: 32,
                                boxSizing: 'border-box',
                                lineHeight: '32px',
                                padding: 0,
                                borderRadius: '50%',
                                background: '#e8f1fe',
                                color: '#0b63c5',
                                border: '1.5px solid #90caf9',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '16px', fontWeight: 600
                              }}
                            >✏️</button>
                            <button
                              onClick={() => setDeleteId(infirmier.id)}
                              title="Supprimer"
                              style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                minHeight: 32,
                                boxSizing: 'border-box',
                                lineHeight: '32px',
                                padding: 0,
                                borderRadius: '50%',
                                background: '#fdecec',
                                color: '#c62828',
                                border: '1.5px solid #f4b4b4',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '16px', fontWeight: 600
                              }}
                            >🗑️</button>
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

        {/* Modale ajout/modif avec design moderne */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh', 
              overflowY: 'auto', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              '@media (max-width: 768px)': {
                padding: '1rem',
                margin: '0.5rem'
              }
            }}>
              
              {/* En-tête de la modale */}
              <div style={{ marginBottom: '2rem', textAlign: 'center', borderBottom: '2px solid #f1f3f4', paddingBottom: '1rem' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', 
                  color: '#1a202c',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  {editInfirmier ? '✏️ Modifier l\'infirmier' : '➕ Ajouter un nouvel infirmier'}
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#718096', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}>
                  {editInfirmier ? 'Modifiez les informations de l\'infirmier' : 'Ajoutez un nouvel infirmier à la base de données'}
                </p>
              </div>

              <form onSubmit={handleSave}>
                {/* Layout en deux colonnes */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '1.5rem',
                  '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr',
                    gap: '1rem'
                  }
                }}>
                  
                  {/* Colonne gauche */}
                  <div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#2d3748',
                        fontSize: '0.95rem'
                      }}>
                        👤 Nom complet *
                      </label>
                      <input 
                        type="text" 
                        value={nom} 
                        onChange={e => setNom(e.target.value)} 
                        required
                        placeholder="Ex: Fatima Zahra"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3182ce'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#2d3748',
                        fontSize: '0.95rem'
                      }}>
                        🏥 Spécialité *
                      </label>
                      <input 
                        type="text" 
                        value={specialty} 
                        onChange={e => setSpecialty(e.target.value)} 
                        required
                        placeholder="Ex: Soins intensifs, Pédiatrie..."
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3182ce'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#2d3748',
                        fontSize: '0.95rem'
                      }}>
                        📞 Téléphone
                      </label>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="Ex: 0123456789"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3182ce'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                  </div>

                  {/* Colonne droite */}
                  <div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#2d3748',
                        fontSize: '0.95rem'
                      }}>
                        👥 Contact
                      </label>
                      <input 
                        type="text" 
                        value={contact} 
                        onChange={e => setContact(e.target.value)} 
                        placeholder="Ex: Chef de service, Responsable..."
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3182ce'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#2d3748',
                        fontSize: '0.95rem'
                      }}>
                        🏙️ Ville
                      </label>
                      <input 
                        type="text" 
                        value={ville} 
                        onChange={e => setVille(e.target.value)} 
                        placeholder="Ex: Casablanca, Rabat..."
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3182ce'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600', 
                        color: '#2d3748',
                        fontSize: '0.95rem'
                      }}>
                        📧 Email
                      </label>
                      <input 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="Ex: infirmier@hopital.com"
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          border: '2px solid #e2e8f0',
                          fontSize: '1rem',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box'
                        }}
                        onFocus={e => e.target.style.borderColor = '#3182ce'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Boutons d'action */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '1rem',
                  paddingTop: '2rem',
                  marginTop: '2rem',
                  borderTop: '2px solid #e2e8f0',
                  flexWrap: 'wrap',
                  '@media (max-width: 480px)': {
                    flexDirection: 'column',
                    alignItems: 'stretch'
                  }
                }}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    style={{
                      background: '#e2e8f0',
                      color: '#4a5568',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '120px'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#cbd5e0'}
                    onMouseOut={e => e.currentTarget.style.background = '#e2e8f0'}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      boxShadow: '0 4px 12px rgba(49, 130, 206, 0.3)'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {editInfirmier ? '💾 Enregistrer' : '➕ Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation suppression */}
        {deleteId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
              <h3>Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer cet infirmier ?</p>
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

export default Infirmiers;
