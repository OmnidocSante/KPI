import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { 
  fetchClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  fetchVilles,
  fetchClientContacts,
  addClientContact,
  updateClientContact,
  deleteClientContact
} from '../services/api';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, minWidth: 320, background: type === 'success' ? '#4caf50' : '#f44336', color: 'white', padding: '1rem 1.5rem', borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
    <span>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: 18, cursor: 'pointer', marginLeft: 16, lineHeight: 1 }}>×</button>
  </div>
  );
};

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [clientFullName, setClientFullName] = useState('');
  const [email, setEmail] = useState('');
  const [villeId, setVilleId] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [primaryContactPhone, setPrimaryContactPhone] = useState('');
  const [primaryContactFunction, setPrimaryContactFunction] = useState('');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");

  // Calculer les clients filtrés
  const filteredClients = clients.filter(client =>
    (client.clientFullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (client.primaryContactName || '').toLowerCase().includes(search.toLowerCase())
  );
  
  // États pour la gestion des contacts
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactFunction: '',
    isPrimary: false
  });

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await fetchClients();
      setClients(res.data);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des clients", type: 'error' });
    }
    setLoading(false);
  };

  const loadVilles = async () => {
    try {
      const res = await fetchVilles();
      setVilles(res.data);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des villes", type: 'error' });
    }
  };

  useEffect(() => {
    loadClients();
    loadVilles();
  }, []);

  const openAddModal = () => {
    setEditClient(null);
    setClientFullName('');
    setEmail('');
    setVilleId('');
    setPrimaryContactName('');
    setPrimaryContactEmail('');
    setPrimaryContactPhone('');
    setPrimaryContactFunction('');
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditClient(client);
    setClientFullName(client.clientFullName);
    setEmail(client.email);
    setVilleId(client.villeId || '');
    setPrimaryContactName(client.primaryContactName || '');
    setPrimaryContactEmail(client.primaryContactEmail || '');
    setPrimaryContactPhone(client.primaryContactPhone || '');
    setPrimaryContactFunction(client.primaryContactFunction || '');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const villeToSend = villeId === '' ? null : villeId;
      const clientData = {
        clientFullName,
        email,
        villeId: villeToSend,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
        primaryContactFunction
      };
      
      if (editClient) {
        await updateClient(editClient.id, clientData);
        setNotification({ message: 'Client modifié avec succès', type: 'success' });
      } else {
        await createClient(clientData);
        setNotification({ message: 'Client ajouté avec succès', type: 'success' });
      }
      setShowModal(false);
      loadClients();
    } catch (e) {
      setNotification({ message: e?.response?.data?.message || "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteClient(id);
      setNotification({ message: 'Client supprimé', type: 'success' });
      setDeleteId(null);
      loadClients();
    } catch (e) {
      setNotification({ message: "Erreur lors de la suppression", type: 'error' });
    }
  };

  // Fonctions pour la gestion des contacts
  const openContactsModal = async (client) => {
    console.log('🔍 Ouverture de la modale des contacts pour:', client);
    setSelectedClient(client);
    setShowContactsModal(true);
    try {
      console.log('📡 Appel de fetchClientContacts pour client ID:', client.id);
      const res = await fetchClientContacts(client.id);
      console.log('✅ Réponse de fetchClientContacts:', res);
      console.log('📋 Contacts reçus:', res.data);
      
      // Créer un contact principal à partir des données du client
      let allContacts = [...res.data];
      
      // Si le client a un contact principal, l'ajouter à la liste
      if (client.primaryContactName) {
        const primaryContact = {
          id: `primary_${client.id}`,
          clientId: client.id,
          contactName: client.primaryContactName,
          contactEmail: client.primaryContactEmail,
          contactPhone: client.primaryContactPhone,
          contactFunction: client.primaryContactFunction,
          isPrimary: true,
          isPrimaryContact: true, // Marqueur pour identifier le contact principal
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        };
        
        // Ajouter le contact principal en premier
        allContacts.unshift(primaryContact);
        console.log('👑 Contact principal ajouté à la liste:', primaryContact);
      }
      
      console.log('📋 Tous les contacts (avec principal):', allContacts);
      setContacts(allContacts);
    } catch (e) {
      console.error('❌ Erreur lors du chargement des contacts:', e);
      console.error('❌ Détails de l\'erreur:', e.response?.data);
      setNotification({ message: "Erreur lors du chargement des contacts", type: 'error' });
    }
  };

  const openAddContactModal = () => {
    setEditContact(null);
    setContactForm({
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      contactFunction: '',
      isPrimary: false
    });
    setShowAddContactModal(true);
  };

  const openEditContactModal = (contact) => {
    setEditContact(contact);
    setContactForm({
      contactName: contact.contactName,
      contactEmail: contact.contactEmail,
      contactPhone: contact.contactPhone,
      contactFunction: contact.contactFunction,
      isPrimary: contact.isPrimary
    });
    setShowAddContactModal(true);
  };

  const handleContactSave = async (e) => {
    e.preventDefault();
    try {
      console.log('🔍 handleContactSave - selectedClient:', selectedClient);
      console.log('🔍 handleContactSave - selectedClient.id:', selectedClient?.id);
      console.log('🔍 handleContactSave - contactForm:', contactForm);
      
      if (editContact) {
        await updateClientContact(editContact.id, contactForm);
        setNotification({ message: 'Contact modifié avec succès', type: 'success' });
      } else {
        // Créer un objet avec le clientId inclus
        const contactData = {
          ...contactForm,
          clientId: selectedClient.id
        };
        
        console.log('📡 Appel de addClientContact avec:', selectedClient.id, contactData);
        await addClientContact(selectedClient.id, contactData);
        setNotification({ message: 'Contact ajouté avec succès', type: 'success' });
      }
      setShowAddContactModal(false);
      // Recharger les contacts
      const res = await fetchClientContacts(selectedClient.id);
      setContacts(res.data);
    } catch (e) {
      console.error('❌ Erreur dans handleContactSave:', e);
      setNotification({ message: e?.response?.data?.message || "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const handleContactDelete = async (contactId) => {
    try {
      await deleteClientContact(contactId);
      setNotification({ message: 'Contact supprimé avec succès', type: 'success' });
      // Recharger les contacts
      const res = await fetchClientContacts(selectedClient.id);
      setContacts(res.data);
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
                <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>👥 Liste des clients</h2>
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
                  Total: {filteredClients.length} {filteredClients.length <= 1 ? 'client' : 'clients'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
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
                  Ajouter un client
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
                      <th>Nom complet</th>
                      <th>Email</th>
                      <th>Ville</th>
                      <th>Contact principal</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length === 0 ? (
                      <tr><td colSpan="6">Aucun client trouvé.</td></tr>
                    ) : filteredClients.map(client => (
                      <tr key={client.id}>
                        <td>{client.id}</td>
                        <td>{client.clientFullName}</td>
                        <td>{client.email}</td>
                        <td>{client.villeName || ''}</td>
                        <td>
                          {client.primaryContactName ? (
                            <div>
                              <div><strong>{client.primaryContactName}</strong></div>
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                {client.primaryContactFunction} • {client.primaryContactPhone} • {client.primaryContactEmail}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>Aucun contact</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                            <button
                              onClick={() => openEditModal(client)}
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
                              onClick={() => openContactsModal(client)}
                              title="Contacts"
                              style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                minHeight: 32,
                                boxSizing: 'border-box',
                                lineHeight: '32px',
                                padding: 0,
                                borderRadius: '50%',
                                background: '#e9f7ef',
                                color: '#1b8f3a',
                                border: '1.5px solid #a7e3bd',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '16px', fontWeight: 600
                              }}
                            >👥</button>
                            <button
                              onClick={() => setDeleteId(client.id)}
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

        {/* Modale ajout/modif client */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '900px',
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
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  {editClient ? '✏️ Modifier le client' : '➕ Ajouter un nouveau client'}
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#718096', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}>
                  {editClient ? 'Modifiez les informations du client et son contact principal' : 'Créez un nouveau client avec ses informations de base'}
                </p>
              </div>

              <form onSubmit={handleSave}>
                {/* Layout responsive en deux colonnes */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '2rem',
                  '@media (max-width: 768px)': {
                    gridTemplateColumns: '1fr',
                    gap: '1.5rem'
                  }
                }}>
                  
                  {/* Colonne gauche - Informations du client */}
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    '@media (max-width: 768px)': {
                      padding: '1rem'
                    }
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '20px',
                      background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '20px',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      '@media (max-width: 480px)': {
                        position: 'relative',
                        top: 'auto',
                        left: 'auto',
                        marginBottom: '1rem',
                        display: 'inline-block'
                      }
                    }}>
                      🏢 Informations du client
                    </div>
                    
                    <div style={{ 
                      marginTop: '1rem',
                      '@media (max-width: 480px)': {
                        marginTop: '0.5rem'
                      }
                    }}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Nom complet *
                        </label>
                        <input 
                          type="text" 
                          value={clientFullName} 
                          onChange={e => setClientFullName(e.target.value)} 
                          required 
                          style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Email
                        </label>
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Ville
                        </label>
                        <select 
                          value={villeId} 
                          onChange={e => setVilleId(e.target.value)} 
                          style={{ 
                            width: '100%', 
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)', 
                            borderRadius: '8px', 
                            border: '2px solid #e2e8f0', 
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        >
                          <option value="">-- Sélectionnez une ville --</option>
                          {villes.map(ville => (
                            <option key={ville.id} value={ville.id}>{ville.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Colonne droite - Contact principal */}
                  <div style={{ 
                    padding: '1.5rem', 
                    background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', 
                    borderRadius: '12px', 
                    border: '1px solid #e2e8f0',
                    position: 'relative',
                    '@media (max-width: 768px)': {
                      padding: '1rem'
                    }
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '20px',
                      background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                      color: 'white',
                      padding: '0.25rem 1rem',
                      borderRadius: '20px',
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      fontWeight: '600',
                      '@media (max-width: 480px)': {
                        position: 'relative',
                        top: 'auto',
                        left: 'auto',
                        marginBottom: '1rem',
                        display: 'inline-block'
                      }
                    }}>
                      👤 Contact principal
                    </div>
                    
                    <div style={{ 
                      marginTop: '1rem',
                      '@media (max-width: 480px)': {
                        marginTop: '0.5rem'
                      }
                    }}>
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Nom du contact
                        </label>
                        <input 
                          type="text" 
                          value={primaryContactName} 
                          onChange={e => setPrimaryContactName(e.target.value)} 
                          placeholder="Ex: Ahmed Ben Ali"
                          style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Fonction
                        </label>
                        <input 
                          type="text" 
                          value={primaryContactFunction} 
                          onChange={e => setPrimaryContactFunction(e.target.value)} 
                          placeholder="Ex: Directeur commercial, Responsable achats..."
                          style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Téléphone
                        </label>
                        <input 
                          type="tel" 
                          value={primaryContactPhone} 
                          onChange={e => setPrimaryContactPhone(e.target.value)} 
                          placeholder="Ex: 0123456789"
                          style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          display: 'block', 
                          marginBottom: '0.5rem', 
                          fontWeight: '600', 
                          color: '#2d3748',
                          fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                        }}>
                          Email
                        </label>
                        <input 
                          type="email" 
                          value={primaryContactEmail} 
                          onChange={e => setPrimaryContactEmail(e.target.value)} 
                          placeholder="Ex: contact@entreprise.com"
                          style={{
                            width: '100%',
                            padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.8rem, 2.5vw, 1rem)',
                            borderRadius: '8px',
                            border: '2px solid #e2e8f0',
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                          onFocus={e => e.target.style.borderColor = '#3182ce'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                      </div>
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
                      padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(1.2rem, 3vw, 1.5rem)',
                      borderRadius: '8px',
                      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      '@media (max-width: 480px)': {
                        minWidth: 'auto'
                      }
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
                      padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(1.2rem, 3vw, 1.5rem)',
                      borderRadius: '8px',
                      fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      boxShadow: '0 4px 12px rgba(49, 130, 206, 0.3)',
                      '@media (max-width: 480px)': {
                        minWidth: 'auto'
                      }
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {editClient ? '💾 Enregistrer' : '➕ Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale de gestion des contacts */}
        {showContactsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ 
              background: 'white', 
              padding: '2rem', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '1400px',
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
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  📋 Gestion des contacts
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#718096', fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)' }}>
                  Gérez tous les contacts de <strong>{selectedClient?.clientFullName}</strong>
                </p>
              </div>

              {/* Bouton d'ajout de contact */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                  onClick={openAddContactModal}
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #20c997)',
                    color: 'white',
                    border: 'none',
                    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 3vw, 2rem)',
                    borderRadius: '12px',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                    transition: 'all 0.2s ease',
                    minWidth: '200px',
                    justifyContent: 'center'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ fontSize: '1.2rem' }}>➕</span>
                  Ajouter un contact
                </button>
              </div>

              {/* Tableau des contacts */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)' }}>
                        <th style={{ 
                          padding: 'clamp(0.8rem, 2vw, 1rem)', 
                          textAlign: 'left', 
                          borderBottom: '2px solid #dee2e6', 
                          color: '#495057', 
                          fontWeight: '600', 
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                          '@media (max-width: 768px)': {
                            padding: '0.6rem 0.4rem',
                            fontSize: '0.8rem'
                          }
                        }}>👤 Nom</th>
                        <th style={{ 
                          padding: 'clamp(0.8rem, 2vw, 1rem)', 
                          textAlign: 'left', 
                          borderBottom: '2px solid #dee2e6', 
                          color: '#495057', 
                          fontWeight: '600', 
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                          '@media (max-width: 768px)': {
                            padding: '0.6rem 0.4rem',
                            fontSize: '0.8rem'
                          }
                        }}>💼 Fonction</th>
                        <th style={{ 
                          padding: 'clamp(0.8rem, 2vw, 1rem)', 
                          textAlign: 'left', 
                          borderBottom: '2px solid #dee2e6', 
                          color: '#495057', 
                          fontWeight: '600', 
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                          '@media (max-width: 768px)': {
                            padding: '0.6rem 0.4rem',
                            fontSize: '0.8rem'
                          }
                        }}>📞 Téléphone</th>
                        <th style={{ 
                          padding: 'clamp(0.8rem, 2vw, 1rem)', 
                          textAlign: 'left', 
                          borderBottom: '2px solid #dee2e6', 
                          color: '#495057', 
                          fontWeight: '600', 
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                          '@media (max-width: 768px)': {
                            padding: '0.6rem 0.4rem',
                            fontSize: '0.8rem'
                          }
                        }}>📧 Email</th>
                        <th style={{ 
                          padding: 'clamp(0.8rem, 2vw, 1rem)', 
                          textAlign: 'center', 
                          borderBottom: '2px solid #dee2e6', 
                          color: '#495057', 
                          fontWeight: '600', 
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                          '@media (max-width: 768px)': {
                            padding: '0.6rem 0.4rem',
                            fontSize: '0.8rem'
                          }
                        }}>⭐ Statut</th>
                        <th style={{ 
                          padding: 'clamp(0.8rem, 2vw, 1rem)', 
                          textAlign: 'center', 
                          borderBottom: '2px solid #dee2e6', 
                          color: '#495057', 
                          fontWeight: '600', 
                          fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                          '@media (max-width: 768px)': {
                            padding: '0.6rem 0.4rem',
                            fontSize: '0.8rem'
                          }
                        }}>⚙️ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ 
                            padding: '3rem 1rem', 
                            textAlign: 'center', 
                            color: '#6c757d', 
                            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                            background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '2rem' }}>📭</span>
                              <span>Aucun contact trouvé</span>
                              <span style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: '#adb5bd' }}>Commencez par ajouter un contact</span>
                            </div>
                          </td>
                        </tr>
                      ) : contacts.map(contact => (
                        <tr key={contact.id} style={{ 
                          borderBottom: '1px solid #f1f3f4',
                          background: contact.isPrimaryContact ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : 'white',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = contact.isPrimaryContact ? 'linear-gradient(135deg, #e0f2fe, #b3e5fc)' : '#f8f9fa'}
                        onMouseOut={e => e.currentTarget.style.background = contact.isPrimaryContact ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' : 'white'}
                        >
                          <td style={{ 
                            padding: 'clamp(0.8rem, 2vw, 1rem)',
                            '@media (max-width: 768px)': {
                              padding: '0.6rem 0.4rem'
                            }
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>
                                {contact.isPrimaryContact ? '👑' : '👤'}
                              </span>
                              <span style={{ 
                                fontWeight: '600', 
                                color: '#2d3748',
                                fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)'
                              }}>
                                {contact.contactName}
                              </span>
                              {contact.isPrimaryContact && (
                                <span style={{ 
                                  background: 'linear-gradient(135deg, #007bff, #0056b3)',
                                  color: 'white',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '20px',
                                  fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  Principal
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ 
                            padding: 'clamp(0.8rem, 2vw, 1rem)',
                            '@media (max-width: 768px)': {
                              padding: '0.6rem 0.4rem'
                            }
                          }}>
                            <span style={{ 
                              color: '#4a5568', 
                              fontWeight: '500',
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)'
                            }}>
                              {contact.contactFunction}
                            </span>
                          </td>
                          <td style={{ 
                            padding: 'clamp(0.8rem, 2vw, 1rem)',
                            '@media (max-width: 768px)': {
                              padding: '0.6rem 0.4rem'
                            }
                          }}>
                            <span style={{ 
                              color: '#4a5568',
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                              fontFamily: 'monospace'
                            }}>
                              {contact.contactPhone || '-'}
                            </span>
                          </td>
                          <td style={{ 
                            padding: 'clamp(0.8rem, 2vw, 1rem)',
                            '@media (max-width: 768px)': {
                              padding: '0.6rem 0.4rem'
                            }
                          }}>
                            <span style={{ 
                              color: '#4a5568',
                              fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                              wordBreak: 'break-word'
                            }}>
                              {contact.contactEmail || '-'}
                            </span>
                          </td>
                          <td style={{ 
                            padding: 'clamp(0.8rem, 2vw, 1rem)', 
                            textAlign: 'center',
                            '@media (max-width: 768px)': {
                              padding: '0.6rem 0.4rem'
                            }
                          }}>
                            {contact.isPrimary ? (
                              <span style={{ 
                                background: 'linear-gradient(135deg, #28a745, #20c997)',
                                color: 'white', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '20px', 
                                fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                                fontWeight: '600',
                                boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
                                whiteSpace: 'nowrap'
                              }}>
                                ⭐ Principal
                              </span>
                            ) : (
                              <span style={{ 
                                color: '#6c757d',
                                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                                fontStyle: 'italic'
                              }}>
                                -
                              </span>
                            )}
                          </td>
                          <td style={{ 
                            padding: 'clamp(0.8rem, 2vw, 1rem)', 
                            textAlign: 'center',
                            '@media (max-width: 768px)': {
                              padding: '0.6rem 0.4rem'
                            }
                          }}>
                            {contact.isPrimaryContact ? (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                gap: '0.5rem',
                                color: '#6c757d',
                                fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
                                fontStyle: 'italic',
                                flexWrap: 'wrap'
                              }}>
                                <span>🔧</span>
                                <span>Géré dans "Modifier client"</span>
                              </div>
                            ) : (
                              <div style={{ 
                                display: 'flex', 
                                gap: '0.5rem', 
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                              }}>
                                <button
                                  onClick={() => openEditContactModal(contact)}
                                  style={{
                                    background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.8rem, 2vw, 1rem)',
                                    cursor: 'pointer',
                                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(49, 130, 206, 0.3)',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                  ✏️ Modifier
                                </button>
                                <button
                                  onClick={() => handleContactDelete(contact.id)}
                                  style={{
                                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.8rem, 2vw, 1rem)',
                                    cursor: 'pointer',
                                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)',
                                    whiteSpace: 'nowrap'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bouton de fermeture */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowContactsModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #6c757d, #495057)',
                    color: 'white',
                    border: 'none',
                    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(2rem, 4vw, 3rem)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(108, 117, 125, 0.3)',
                    minWidth: '150px'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ✋ Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale ajout/modif contact */}
        {showAddContactModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', minWidth: '500px', maxWidth: '600px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              
              {/* En-tête de la modale */}
              <div style={{ marginBottom: '2rem', textAlign: 'center', borderBottom: '2px solid #f1f3f4', paddingBottom: '1rem' }}>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.8rem', 
                  color: '#1a202c',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  {editContact ? '✏️ Modifier le contact' : '➕ Ajouter un nouveau contact'}
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#718096', fontSize: '0.95rem' }}>
                  {editContact ? 'Modifiez les informations du contact' : 'Ajoutez un nouveau contact pour ce client'}
                </p>
              </div>

              <form onSubmit={handleContactSave}>
                {/* Nom du contact */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    color: '#2d3748',
                    fontSize: '0.95rem'
                  }}>
                    👤 Nom du contact *
                  </label>
                  <input 
                    type="text" 
                    value={contactForm.contactName} 
                    onChange={e => setContactForm({...contactForm, contactName: e.target.value})} 
                    required 
                    placeholder="Ex: Ahmed Ben Ali"
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
                
                {/* Fonction */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '600', 
                    color: '#2d3748',
                    fontSize: '0.95rem'
                  }}>
                    💼 Fonction *
                  </label>
                  <input 
                    type="text" 
                    value={contactForm.contactFunction} 
                    onChange={e => setContactForm({...contactForm, contactFunction: e.target.value})} 
                    required 
                    placeholder="Ex: Directeur commercial, Responsable achats..."
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
                
                {/* Téléphone et Email en grille */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
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
                      value={contactForm.contactPhone} 
                      onChange={e => setContactForm({...contactForm, contactPhone: e.target.value})} 
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
                  
                  <div className="form-group">
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
                      value={contactForm.contactEmail} 
                      onChange={e => setContactForm({...contactForm, contactEmail: e.target.value})} 
                      placeholder="Ex: contact@entreprise.com"
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
                
                {/* Checkbox Contact principal */}
                <div className="form-group" style={{ 
                  marginBottom: '2rem',
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#2d3748',
                    fontSize: '1rem'
                  }}>
                    <input
                      type="checkbox"
                      checked={contactForm.isPrimary}
                      onChange={e => setContactForm({...contactForm, isPrimary: e.target.checked})}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>⭐ Définir comme contact principal</span>
                  </label>
                  <p style={{ 
                    margin: '0.5rem 0 0 2.5rem', 
                    color: '#718096', 
                    fontSize: '0.9rem',
                    fontStyle: 'italic'
                  }}>
                    Si coché, ce contact sera marqué comme principal et les autres contacts seront automatiquement décochés
                  </p>
                </div>
                
                {/* Boutons d'action */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddContactModal(false)}
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
                      background: 'linear-gradient(135deg, #28a745, #20c997)',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '120px',
                      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {editContact ? '💾 Enregistrer' : '➕ Ajouter'}
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
              <p>Voulez-vous vraiment supprimer ce client ?</p>
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

export default Clients;
