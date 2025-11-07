import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchAmbulances, createAmbulance, updateAmbulance, deleteAmbulance, fetchVilles } from '../services/api';

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
  const [number, setNumber] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [type, setType] = useState('MAD');
  const [dateAcquisition, setDateAcquisition] = useState('');
  const [montantAchat, setMontantAchat] = useState('');
  const [materielIntegre, setMaterielIntegre] = useState('');
  const [villeActivite, setVilleActivite] = useState('');
  const [kilometrage, setKilometrage] = useState('');
  const [photosVehicule, setPhotosVehicule] = useState([]);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [villes, setVilles] = useState([]);

  // Calculer les ambulances filtrées
  const filteredAmbulances = ambulances.filter(amb => amb.numberPlate.toLowerCase().includes(search.toLowerCase()));

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
    fetchVilles().then(res => setVilles(res.data)).catch(() => setVilles([]));
  }, []);

  const openAddModal = () => {
    setEditAmbulance(null);
    setNumber('');
    setNumberPlate('');
    setType('MAD');
    setDateAcquisition('');
    setMontantAchat('');
    setMaterielIntegre('');
    setVilleActivite('');
    setKilometrage('');
    setPhotosVehicule([]);
    setShowModal(true);
  };

  const openEditModal = (amb) => {
    setEditAmbulance(amb);
    setNumber(amb.number || '');
    setNumberPlate(amb.numberPlate);
    setType(amb.type || 'MAD');
    
    // Formater la date pour l'input de type "date"
    setDateAcquisition(formatDateForInput(amb.dateAcquisition));
    
    setMontantAchat(amb.montantAchat || '');
    setMaterielIntegre(amb.materielIntegre || '');
    setVilleActivite(amb.villeActivite || '');
    setKilometrage(amb.kilometrage || '');
    
    // Convertir les photos stockées en base64 en tableau
    if (amb.photosVehicule) {
      const photosArray = amb.photosVehicule.split('|||').filter(photo => photo.trim());
      setPhotosVehicule(photosArray);
    } else {
      setPhotosVehicule([]);
    }
    
    setShowModal(true);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculer les nouvelles dimensions (max 800x600)
        let { width, height } = img;
        const maxWidth = 800;
        const maxHeight = 600;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir en base64 avec qualité réduite
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB max par image avant compression
    
    if (files.length === 0) return;
    
    setCompressing(true);
    
    try {
      for (const file of files) {
        if (file.size > maxSize) {
          setNotification({ 
            message: `L'image ${file.name} est trop volumineuse (max 10MB)`, 
            type: 'error' 
          });
          continue;
        }
        
        // Compresser l'image
        const compressedImage = await compressImage(file);
        setPhotosVehicule(prev => [...prev, compressedImage]);
      }
      
      setNotification({ 
        message: `${files.length} image(s) compressée(s) et ajoutée(s)`, 
        type: 'success' 
      });
    } catch (error) {
      setNotification({ 
        message: `Erreur lors du traitement des images`, 
        type: 'error' 
      });
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index) => {
    setPhotosVehicule(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Joindre toutes les images avec un séparateur spécial
      const photosString = photosVehicule.join('|||');
      
      const ambulanceData = {
        number,
        numberPlate,
        type,
        dateAcquisition,
        montantAchat,
        materielIntegre,
        villeActivite,
        kilometrage,
        photosVehicule: photosString
      };

      if (editAmbulance) {
        await updateAmbulance(editAmbulance.id, ambulanceData);
        setNotification({ message: 'Ambulance modifiée avec succès', type: 'success' });
      } else {
        await createAmbulance(ambulanceData);
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

  const showImages = (ambulance) => {
    if (!ambulance.photosVehicule) {
      setNotification({ message: 'Aucune photo disponible', type: 'info' });
      return;
    }
    
    const photosArray = ambulance.photosVehicule.split('|||').filter(photo => photo.trim());
    setSelectedImages(photosArray);
    setShowImageModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR');
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatMontant = (montant) => {
    if (!montant) return '-';
    return `${parseFloat(montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD`;
  };

  const formatKilometrage = (km) => {
    if (!km) return '-';
    return `${parseInt(km).toLocaleString('fr-FR')} km`;
  };

  const getImageCount = (photosString) => {
    if (!photosString) return 0;
    return photosString.split('|||').filter(photo => photo.trim()).length;
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>🚑 Liste des ambulances</h2>
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
                  Total: {filteredAmbulances.length} {filteredAmbulances.length <= 1 ? 'ambulance' : 'ambulances'}
                </span>
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
                      <th>Numéro</th>
                      <th>Immatriculation</th>
                      <th>Type</th>
                      <th>Date d'acquisition</th>
                      <th>Montant d'achat</th>
                      <th>Matériel intégré</th>
                      <th>Ville d'activité</th>
                      <th>Kilométrage</th>
                      <th>Photos</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAmbulances.length === 0 ? (
                      <tr><td colSpan="11">Aucune ambulance trouvée.</td></tr>
                    ) : filteredAmbulances.map(amb => (
                      <tr key={amb.id}>
                        <td>{amb.id}</td>
                        <td>{amb.number || '-'}</td>
                        <td style={{ fontWeight: '600', color: '#1976d2' }}>{amb.numberPlate}</td>
                        <td>
                          <span style={{
                            background: amb.type === 'MAD' ? '#e3f2fd' : '#fff3e0',
                            color: amb.type === 'MAD' ? '#1976d2' : '#f57c00',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600'
                          }}>
                            {amb.type || 'MAD'}
                          </span>
                        </td>
                        <td>{formatDate(amb.dateAcquisition)}</td>
                        <td style={{ fontWeight: '600', color: '#2e7d32' }}>{formatMontant(amb.montantAchat)}</td>
                        <td>
                          {amb.materielIntegre ? (
                            <span style={{ fontSize: '0.9rem' }} title={amb.materielIntegre}>
                              {amb.materielIntegre.length > 30 ? amb.materielIntegre.substring(0, 30) + '...' : amb.materielIntegre}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{amb.villeActivite || '-'}</td>
                        <td style={{ fontWeight: '600', color: '#666' }}>{formatKilometrage(amb.kilometrage)}</td>
                        <td>
                          {amb.photosVehicule ? (
                            <button
                              onClick={() => showImages(amb)}
                              style={{
                                background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                                color: '#1976d2',
                                border: '2px solid #1976d2',
                                borderRadius: '8px',
                                padding: '0.5rem 0.8rem',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.15)',
                                minWidth: '120px',
                                justifyContent: 'center'
                              }}
                              onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(25, 118, 210, 0.25)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #bbdefb, #90caf9)';
                              }}
                              onMouseOut={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(25, 118, 210, 0.15)';
                                e.currentTarget.style.background = 'linear-gradient(135deg, #e3f2fd, #bbdefb)';
                              }}
                            >
                              <span style={{ fontSize: '1.1rem' }}>📸</span>
                              <span>{getImageCount(amb.photosVehicule)} photo{getImageCount(amb.photosVehicule) > 1 ? 's' : ''}</span>
                            </button>
                          ) : (
                            <span style={{ 
                              color: '#9ca3af', 
                              fontStyle: 'italic',
                              fontSize: '0.9rem'
                            }}>
                              Aucune photo
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <button
                              onClick={() => openEditModal(amb)}
                              title="Modifier"
                              style={{
                                width: 32,
                                height: 32,
                                background: '#e8f1fe',
                                color: '#0b63c5',
                                border: '1.5px solid #1976d2',
                                borderRadius: '50%',
                                padding: 0,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >✏️</button>
                            <button
                              onClick={() => setDeleteId(amb.id)}
                              title="Supprimer"
                              style={{
                                width: 32,
                                height: 32,
                                background: '#fff5f5',
                                color: '#dc2626',
                                border: '1.5px solid #dc2626',
                                borderRadius: '50%',
                                padding: 0,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
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
        
        {/* Modale ajout/modif */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <form onSubmit={handleSave} style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 600, maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ marginBottom: 24, color: '#2c3e50' }}>{editAmbulance ? 'Modifier' : 'Ajouter'} une ambulance</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>🔢 Numéro (interne)</label>
                  <input
                    type="text"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    placeholder="Numérotation interne"
                  />
                </div>
                <div className="form-group">
                  <label>🚗 Numéro d'immatriculation *</label>
                  <input 
                    type="text" 
                    value={numberPlate} 
                    onChange={e => setNumberPlate(e.target.value)} 
                    required 
                    placeholder="Ex: AB-123-CD"
                  />
                </div>
                
                <div className="form-group">
                  <label>🚑 Type d'ambulance *</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)} 
                    required
                  >
                    <option value="MAD">MAD</option>
                    <option value="A l'acte">A l'acte</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>📅 Date d'acquisition</label>
                  <input 
                    type="date" 
                    value={dateAcquisition} 
                    onChange={e => setDateAcquisition(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>💰 Montant d'achat (MAD)</label>
                  <input 
                    type="number" 
                    value={montantAchat} 
                    onChange={e => setMontantAchat(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>🏥 Ville d'activité</label>
                  <select
                    value={villeActivite}
                    onChange={e => setVilleActivite(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionner une ville --</option>
                    {villes.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>🛣️ Kilométrage (km)</label>
                  <input 
                    type="number" 
                    value={kilometrage} 
                    onChange={e => setKilometrage(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>🔧 Matériel intégré</label>
                  <textarea 
                    value={materielIntegre} 
                    onChange={e => setMaterielIntegre(e.target.value)}
                    placeholder="Décrivez le matériel intégré dans l'ambulance..."
                    rows="3"
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#2d3748',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ 
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                      borderRadius: '50%',
                      color: 'white'
                    }}>
                      📸
                    </span>
                    Photos du véhicule
                  </label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={compressing}
                    style={{ 
                      border: '2px dashed #e3e6f0',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: compressing ? '#f0f0f0' : '#f8fafc',
                      cursor: compressing ? 'not-allowed' : 'pointer',
                      opacity: compressing ? 0.6 : 1
                    }}
                  />
                  {compressing && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      color: '#1976d2', 
                      fontSize: '0.9rem',
                      marginTop: '0.5rem'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #e3e6f0',
                        borderTop: '2px solid #1976d2',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Compression des images en cours...
                    </div>
                  )}
                  <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                    Formats acceptés : JPG, PNG, GIF. Taille max : 10MB par image (sera automatiquement compressée)
                  </small>
                  
                  {/* Aperçu des images sélectionnées */}
                  {photosVehicule.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                        Images sélectionnées ({photosVehicule.length})
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {photosVehicule.map((photo, index) => (
                          <div key={index} style={{ position: 'relative' }}>
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`}
                              style={{ 
                                width: '60px', 
                                height: '60px', 
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '2px solid #e3e6f0'
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  type="button" 
                  className="submit-btn" 
                  style={{ background: '#dc2626', color: 'white'}} 
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </button>
                <button type="submit" className="submit-btn">
                  {editAmbulance ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modale d'affichage des images */}
        {showImageModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '1400px',
              maxHeight: '90vh', 
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              {/* En-tête de la modale avec titre amélioré */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '2rem',
                borderBottom: '2px solid #f1f3f4',
                paddingBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ 
                    fontSize: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                    borderRadius: '50%',
                    color: 'white'
                  }}>
                    📸
                  </span>
                  <div>
                    <h2 style={{ 
                      margin: 0, 
                      fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', 
                      color: '#1a202c',
                      fontWeight: '700',
                      lineHeight: '1.2'
                    }}>
                      Photos du véhicule
                    </h2>
                    <p style={{ 
                      margin: '0.25rem 0 0 0', 
                      color: '#718096', 
                      fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                      fontWeight: '500'
                    }}>
                      Visualisation des images du véhicule
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowImageModal(false)}
                  style={{
                    background: '#f1f3f4',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.color = '#374151';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#f1f3f4';
                    e.currentTarget.style.color = '#666';
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Grille des photos améliorée avec plus de largeur */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '2rem',
                '@media (max-width: 1200px)': {
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: '1.5rem'
                },
                '@media (max-width: 768px)': {
                  gridTemplateColumns: '1fr',
                  gap: '1.5rem'
                }
              }}>
                {selectedImages.map((image, index) => (
                  <div key={index} style={{ 
                    textAlign: 'center',
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = '#3182ce';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  >
                    <img 
                      src={image} 
                      alt={`Photo ${index + 1}`}
                      style={{ 
                        width: '100%', 
                        maxWidth: '500px',
                        height: 'auto',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                        objectFit: 'contain',
                        minHeight: '300px',
                        background: '#fafbfc'
                      }}
                    />
                    <div style={{ 
                      marginTop: '1.5rem',
                      padding: '1rem 1.5rem',
                      background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Photo {index + 1}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message si aucune photo */}
              {selectedImages.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '4rem 2rem',
                  color: '#718096',
                  background: '#f8fafc',
                  borderRadius: '16px',
                  border: '2px dashed #e2e8f0'
                }}>
                  <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>📷</span>
                  <p style={{ fontSize: '1.3rem', margin: '0.5rem 0', fontWeight: '600' }}>Aucune photo disponible</p>
                  <p style={{ fontSize: '1rem', margin: 0, opacity: '0.8' }}>Les photos du véhicule apparaîtront ici</p>
                </div>
              )}
            </div>
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
