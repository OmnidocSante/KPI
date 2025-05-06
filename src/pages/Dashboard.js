import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import api from '../services/api';

function toMySQLDatetime(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  // Décale en local pour éviter le décalage UTC
  const pad = n => n < 10 ? '0' + n : n;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDateFr(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to check if the business unit type is B2C
const isB2C = (buId, businessUnits) => {
  const bu = businessUnits.find(bu => String(bu.id) === String(buId));
  return bu && bu.businessUnitType === 'b2c';
};

// Add helper function isMedecinRequired after the isB2C function
const isMedecinRequired = (produitId, produits) => {
  const produit = produits.find(p => String(p.id) === String(produitId));
  return produit && ['acte medecin', 'acte avion sanitaire', 'tam'].includes(produit.name.toLowerCase());
};

// Add helper function isAmbulanceRequired after the isMedecinRequired function
const isAmbulanceRequired = (produitId, produits) => {
  const produit = produits.find(p => String(p.id) === String(produitId));
  return produit && ['tas', 'tam', 'vsl', 'pf', 'mad'].includes(produit.name.toLowerCase());
};

const EditForm = React.memo(({ 
  editFormData, 
  onEditChange, 
  onSubmit, 
  onCancel, 
  formErrors, 
  apiError,
  businessUnits,
  clients,
  produits,
  medciens,
  ambulances,
  villes 
}) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{color:'#1976d2', fontWeight:'bold', fontSize:'1.5rem', marginBottom:'1.5rem'}}>
          Modifier l'enregistrement
        </h3>
        <form onSubmit={onSubmit} className="data-form" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
          {/* Colonne 1 */}
          <div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="business">🏢</span> Business Unit Type</label>
              <select name="businessUnitType" value={editFormData.businessUnitType} onChange={onEditChange} required style={{borderColor: formErrors.businessUnitType ? '#d32f2f' : undefined}}>
                <option value="">Sélectionnez un type</option>
                {businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.businessUnitType}</option>)}
              </select>
              {formErrors.businessUnitType && <span style={{color:'#d32f2f', fontSize:'0.9em'}}><span role="img" aria-label="error">❗</span> {formErrors.businessUnitType}</span>}
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="pill">💊</span> Produit</label>
              <select name="produit" value={editFormData.produit} onChange={onEditChange}>
                <option value="">Sélectionnez un produit</option>
                {produits.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="doctor">🧑‍⚕️</span> Médecin</label>
              <select name="medecin" value={isMedecinRequired(editFormData.produit, produits) ? editFormData.medecin : ''} onChange={onEditChange} disabled={!isMedecinRequired(editFormData.produit, produits)}>
                <option value="">Sélectionnez un médecin</option>
                {medciens.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="city">📍</span> Ville</label>
              <select name="ville" value={editFormData.ville} onChange={onEditChange}>
                <option value="">Sélectionnez une ville</option>
                {villes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="payment">💳</span> État de Paiement</label>
              <select name="etatPaiement" value={editFormData.etatPaiement} onChange={onEditChange}>
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="money">💶</span> CA TTC</label>
              <input type="number" name="caTTC" value={editFormData.caTTC} onChange={onEditChange} min="0" />
            </div>
          </div>
          {/* Colonne 2 */}
          <div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="client">👤</span> Client</label>
              <select name="client" value={isB2C(editFormData.businessUnitType, businessUnits) ? '' : editFormData.client} onChange={onEditChange} disabled={isB2C(editFormData.businessUnitType, businessUnits)}>
                <option value="">Sélectionnez un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.clientFullName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="id">🆔</span> Nom - Prénom</label>
              <input type="text" name="nomPrenom" value={editFormData.nomPrenom} onChange={onEditChange} placeholder="Votre nom et prénom ici" />
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="ambulance">🚑</span> Ambulance</label>
              <select name="ambulance" value={isAmbulanceRequired(editFormData.produit, produits) ? editFormData.ambulance : ''} onChange={onEditChange} disabled={!isAmbulanceRequired(editFormData.produit, produits)}>
                <option value="">Sélectionnez une ambulance</option>
                {ambulances.map(a => <option key={a.id} value={a.id}>{a.numberPlate}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="ref">#</span> Référence</label>
              <input type="text" name="reference" value={editFormData.reference} onChange={onEditChange} placeholder="Référence" />
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="calendar">📅</span> Date d'intervention</label>
              <input type="date" name="dateIntervention" value={editFormData.dateIntervention} onChange={onEditChange} placeholder="jj/mm/aaaa" />
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="phone">📞</span> Numéro</label>
              <input type="text" name="numero" value={editFormData.numero} onChange={onEditChange} placeholder="Numéro" />
            </div>
          </div>
          <div className="edit-modal-buttons" style={{display:'flex', justifyContent:'flex-end', gap:'1rem',flexDirection:'row', marginLeft:'200%'}}>
            <button type="button" onClick={onCancel}>Annuler</button>
            <button type="submit" className="save-btn">Enregistrer</button>
          </div>
        </form>
        {apiError && <div style={{color:'#d32f2f', background:'#ffebee', borderRadius:6, padding:'0.7em 1em', marginTop:'1em'}}>{apiError}</div>}
      </div>
    </div>
  );
});

// Add DeleteConfirmationModal component after EditForm component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemId }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h3 style={{color:'#d32f2f', fontWeight:'bold', fontSize:'1.5rem', marginBottom:'1rem'}}>
          <span role="img" aria-label="warning">⚠️</span> Confirmation de suppression
        </h3>
        <p style={{marginBottom:'1.5rem', fontSize:'1.1rem'}}>
          Êtes-vous sûr de vouloir supprimer cet enregistrement ?
        </p>
        <div style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
          <button 
            onClick={onClose}
            style={{
              padding:'0.5rem 1.5rem',
              background:'#666',
              color:'white',
              border:'none',
              borderRadius:'4px',
              cursor:'pointer',
              fontSize:'1rem'
            }}
          >
            Annuler
          </button>
          <button 
            onClick={() => onConfirm(itemId)}
            style={{
              padding:'0.5rem 1.5rem',
              background:'#d32f2f',
              color:'white',
              border:'none',
              borderRadius:'4px',
              cursor:'pointer',
              fontSize:'1rem'
            }}
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [formData, setFormData] = useState({
    businessUnitType: '',
    client: '',
    produit: '',
    nomPrenom: '',
    medecin: '',
    ambulance: '',
    ville: '',
    reference: '',
    etatPaiement: 'Non',
    dateIntervention: '',
    caTTC: '0',
    numero: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const [donnees, setDonnees] = useState([]);
  const [filtres, setFiltres] = useState({
    recherche: '',
    tri: 'nom'
  });

  const [apiError, setApiError] = useState('');

  const [villes, setVilles] = useState([]);
  const [clients, setClients] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [medciens, setMedciens] = useState([]);
  const [produits, setProduits] = useState([]);
  const [globales, setGlobales] = useState([]);
  const [editingGlobale, setEditingGlobale] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const modalRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [filterClient, setFilterClient] = useState('');
  const [filterAmbulance, setFilterAmbulance] = useState('');
  const [filterRef, setFilterRef] = useState('');
  const [filterBU, setFilterBU] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    // Charger toutes les listes dynamiques
    const fetchData = async () => {
      try {
        const [villesRes, clientsRes, ambulancesRes, businessUnitsRes, medecinsRes, produitsRes] = await Promise.all([
          api.get('/villes'),
          api.get('/clients'),
          api.get('/ambulances'),
          api.get('/business-units'),
          api.get('/medecins'),
          api.get('/produits'),
        ]);
        setVilles(villesRes.data);
        setClients(clientsRes.data);
        setAmbulances(ambulancesRes.data);
        setBusinessUnits(businessUnitsRes.data);
        setMedciens(medecinsRes.data);
        setProduits(produitsRes.data);
      } catch (err) {
        // Optionnel : afficher une erreur
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGlobales = async () => {
      try {
        const res = await api.get('/globales');
        setGlobales(res.data);
      } catch (err) {}
    };
    fetchGlobales();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    if (name === 'businessUnitType' && isB2C(value, businessUnits)) {
      newFormData.client = '';
    }
    if (name === 'produit') {
      if (!isMedecinRequired(value, produits)) {
        newFormData.medecin = '';
      }
      if (!isAmbulanceRequired(value, produits)) {
        newFormData.ambulance = '';
      }
    }
    setFormData(newFormData);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.businessUnitType) {
      errors.businessUnitType = 'Business Unit Type is required.';
    }
    // Ajoutez d'autres validations si besoin
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setApiError('');
    try {
      const dataToSend = {
        villeId: formData.ville,
        clientId: isB2C(formData.businessUnitType, businessUnits) ? null : formData.client,
        aumbulanceId: isAmbulanceRequired(formData.produit, produits) ? formData.ambulance : null,
        businessUnitId: formData.businessUnitType,
        produitId: formData.produit,
        medcienId: isMedecinRequired(formData.produit, produits) ? formData.medecin : null,
        dateCreation: toMySQLDatetime(formData.dateIntervention),
        Ref: formData.reference,
        caHT: Number((Number(formData.caTTC) / 1.2).toFixed(2)),
        caTTC: Number(formData.caTTC),
        fullName: formData.nomPrenom,
        businessUnitType: formData.businessUnitType,
        etatdePaiment: formData.etatPaiement,
        numTelephone: formData.numero
      };
      console.log('[POST /globales] dataToSend:', dataToSend);
      await api.post('/globales', dataToSend);
      // Recharger les globales
      const res = await api.get('/globales');
      setGlobales(res.data);
      setFormData({
        businessUnitType: '',
        client: '',
        produit: '',
        nomPrenom: '',
        medecin: '',
        ambulance: '',
        ville: '',
        reference: '',
        etatPaiement: 'Non',
        dateIntervention: '', 
        caTTC: '0',
        numero: ''
      });
      setFormErrors({});
    } catch (error) {
      console.error('[POST /globales] error:', error);
      if (error.response) {
        console.error('[POST /globales] error.response:', error.response);
      }
      setApiError(error.response?.data?.message || 'Erreur lors de l\'envoi des données');
    }
  };

  const handleFiltreChange = (e) => {
    setFiltres({
      ...filtres,
      [e.target.name]: e.target.value
    });
  };

  const globalesFiltered = globales.filter(item => {
    // Client
    if (filterClient && String(item.clientId) !== String(filterClient)) return false;
    // Ambulance
    if (filterAmbulance && String(item.aumbulanceId) !== String(filterAmbulance)) return false;
    // Référence
    if (filterRef && !item.Ref?.toLowerCase().includes(filterRef.toLowerCase())) return false;
    // Business Unit
    if (filterBU && String(item.businessUnitId) !== String(filterBU)) return false;
    // Date Début
    if (filterDateStart && item.dateCreation && item.dateCreation < filterDateStart) return false;
    // Date Fin
    if (filterDateEnd && item.dateCreation && item.dateCreation > filterDateEnd) return false;
    return true;
  });

  // Helpers pour afficher les noms à partir des IDs
  const getNom = (arr, id, field = 'name') => {
    const found = arr.find(x => String(x.id) === String(id));
    return found ? found[field] : '';
  };
  const getClientName = id => getNom(clients, id, 'clientFullName');
  const getVilleName = id => getNom(villes, id, 'name');
  const getProduitName = id => getNom(produits, id, 'name');
  const getAmbulanceName = id => getNom(ambulances, id, 'numberPlate');
  const getMedecinName = id => getNom(medciens, id, 'name');
  const getBUType = id => getNom(businessUnits, id, 'businessUnitType');

  const handleEdit = (globale) => {
    setEditingGlobale(globale);
    setEditFormData({
      businessUnitType: globale.businessUnitId,
      client: globale.clientId,
      produit: globale.produitId,
      nomPrenom: globale.fullName,
      medecin: globale.medcienId,
      ambulance: globale.aumbulanceId,
      ville: globale.villeId,
      reference: globale.Ref,
      etatPaiement: globale.etatdePaiment,
      dateIntervention: globale.dateCreation ? globale.dateCreation.split(' ')[0] : '',
      caTTC: globale.caTTC.toString(),
      numero: globale.numTelephone
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let newEditFormData = { ...editFormData, [name]: value };
    if (name === 'businessUnitType' && isB2C(value, businessUnits)) {
      newEditFormData.client = '';
    }
    if (name === 'produit') {
      if (!isMedecinRequired(value, produits)) {
        newEditFormData.medecin = '';
      }
      if (!isAmbulanceRequired(value, produits)) {
        newEditFormData.ambulance = '';
      }
    }
    setEditFormData(newEditFormData);
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.businessUnitType) {
      errors.businessUnitType = 'Business Unit Type is required.';
    }
    return errors;
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validateEditForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setApiError('');
    try {
      const dataToSend = {
        villeId: editFormData.ville,
        clientId: isB2C(editFormData.businessUnitType, businessUnits) ? null : editFormData.client,
        aumbulanceId: isAmbulanceRequired(editFormData.produit, produits) ? editFormData.ambulance : null,
        businessUnitId: editFormData.businessUnitType,
        produitId: editFormData.produit,
        medcienId: isMedecinRequired(editFormData.produit, produits) ? editFormData.medecin : null,
        dateCreation: toMySQLDatetime(editFormData.dateIntervention),
        Ref: editFormData.reference,
        caHT: Number((Number(editFormData.caTTC) / 1.2).toFixed(2)),
        caTTC: Number(editFormData.caTTC),
        fullName: editFormData.nomPrenom,
        businessUnitType: editFormData.businessUnitType,
        etatdePaiment: editFormData.etatPaiement,
        numTelephone: editFormData.numero
      };
      await api.put(`/globales/${editingGlobale.id}`, dataToSend);
      const res = await api.get('/globales');
      setGlobales(res.data);
      setShowEditModal(false);
      setEditingGlobale(null);
      setEditFormData(null);
      setFormErrors({});
    } catch (error) {
      setApiError(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setEditingGlobale(null);
    setEditFormData(null);
  };

  const handleDelete = async (id) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (id) => {
    try {
      await api.delete(`/globales/${id}`);
      const res = await api.get('/globales');
      setGlobales(res.data);
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      setApiError('Erreur lors de la suppression');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          {/* Formulaire */}
          <div className="form-section">
            <h3 style={{color:'#1976d2', fontWeight:'bold', fontSize:'1.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <span role="img" aria-label="form">📄</span> Formulaire de Sélection
            </h3>
            <form onSubmit={handleSubmit} className="data-form" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem'}}>
              {/* Colonne 1 */}
              <div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="business">🏢</span> Business Unit Type</label>
                  <select name="businessUnitType" value={formData.businessUnitType} onChange={handleChange} required style={{borderColor: formErrors.businessUnitType ? '#d32f2f' : undefined}}>
                    <option value="">Sélectionnez un type</option>
                    {businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.businessUnitType}</option>)}
                  </select>
                  {formErrors.businessUnitType && <span style={{color:'#d32f2f', fontSize:'0.9em'}}><span role="img" aria-label="error">❗</span> {formErrors.businessUnitType}</span>}
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="pill">💊</span> Produit</label>
                  <select name="produit" value={formData.produit} onChange={handleChange}>
                    <option value="">Sélectionnez un produit</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="doctor">🧑‍⚕️</span> Médecin</label>
                  <select name="medecin" value={isMedecinRequired(formData.produit, produits) ? formData.medecin : ''} onChange={handleChange} disabled={!isMedecinRequired(formData.produit, produits)}>
                    <option value="">Sélectionnez un médecin</option>
                    {medciens.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="city">📍</span> Ville</label>
                  <select name="ville" value={formData.ville} onChange={handleChange}>
                    <option value="">Sélectionnez une ville</option>
                    {villes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="payment">💳</span> État de Paiement</label>
                  <select name="etatPaiement" value={formData.etatPaiement} onChange={handleChange}>
                    <option value="Non">Non</option>
                    <option value="Oui">Oui</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="money">💶</span> CA TTC</label>
                  <input type="number" name="caTTC" value={formData.caTTC} onChange={handleChange} min="0" />
                </div>
              </div>
              {/* Colonne 2 */}
              <div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="client">👤</span> Client</label>
                  <select name="client" value={isB2C(formData.businessUnitType, businessUnits) ? '' : formData.client} onChange={handleChange} disabled={isB2C(formData.businessUnitType, businessUnits)}>
                    <option value="">Sélectionnez un client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.clientFullName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="id">🆔</span> Nom - Prénom</label>
                  <input type="text" name="nomPrenom" value={formData.nomPrenom} onChange={handleChange} placeholder="Votre nom et prénom ici" />
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="ambulance">🚑</span> Ambulance</label>
                  <select name="ambulance" value={isAmbulanceRequired(formData.produit, produits) ? formData.ambulance : ''} onChange={handleChange} disabled={!isAmbulanceRequired(formData.produit, produits)}>
                    <option value="">Sélectionnez une ambulance</option>
                    {ambulances.map(a => <option key={a.id} value={a.id}>{a.numberPlate}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="ref">#</span> Référence</label>
                  <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Référence" />
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="calendar">📅</span> Date d'intervention</label>
                  <input type="date" name="dateIntervention" value={formData.dateIntervention} onChange={handleChange} placeholder="jj/mm/aaaa" />
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="phone">📞</span> Numéro</label>
                  <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Numéro" />
                </div>
              </div>
              <button type="submit" className="submit-btn" style={{gridColumn:'1/3', marginTop:'1rem'}}>Ajouter</button>
            </form>
          </div>

          {/* Tableau de données */}
          <div className="table-section">
            <div className="table-header">
              <div className="table-title">
                <span role="img" aria-label="table" style={{fontSize: '1.3em', marginRight: 8}}>📋</span>
                <span>Globale Records</span>
              </div>
              <button
                className="reset-filters-btn"
                onClick={() => {
                  setFilterClient('');
                  setFilterAmbulance('');
                  setFilterRef('');
                  setFilterBU('');
                  setFilterDateStart('');
                  setFilterDateEnd('');
                }}
              >
                <span role="img" aria-label="reset" style={{marginRight: 6}}>🔄</span>
                Reset Filters
              </button>
            </div>
            <div className="filters-row">
              <div className="filter-group">
                <label>Client</label>
                <select value={filterClient} onChange={e => setFilterClient(e.target.value)}>
                  <option value="">All Clients</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.clientFullName}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Ambulance</label>
                <select value={filterAmbulance} onChange={e => setFilterAmbulance(e.target.value)}>
                  <option value="">All Ambulances</option>
                  {ambulances.map(a => <option key={a.id} value={a.id}>{a.numberPlate}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Référence</label>
                <input
                  type="text"
                  placeholder="All Refs"
                  value={filterRef}
                  onChange={e => setFilterRef(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Business Unit</label>
                <select value={filterBU} onChange={e => setFilterBU(e.target.value)}>
                  <option value="">All Types</option>
                  {businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.businessUnitType}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Date Début</label>
                <input
                  type="date"
                  placeholder="jj/mm/aaaa"
                  value={filterDateStart}
                  onChange={e => setFilterDateStart(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Date Fin</label>
                <input
                  type="date"
                  placeholder="jj/mm/aaaa"
                  value={filterDateEnd}
                  onChange={e => setFilterDateEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ville</th>
                    <th>Produit</th>
                    <th>Ambulance</th>
                    <th>Ref</th>
                    <th>BU</th>
                    <th>Client</th>
                    <th>Medcien</th>
                    <th>CA TTC</th>
                    <th>Date d'intervention</th>
                    <th>Etat de paiement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {globalesFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="no-result-row">
                        <span className="no-result-icon">🔍</span>
                        <span>Aucun résultat trouvé</span>
                      </td>
                    </tr>
                  ) : globalesFiltered.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{getVilleName(item.villeId)}</td>
                      <td>{getProduitName(item.produitId)}</td>
                      <td>{getAmbulanceName(item.aumbulanceId)}</td>
                      <td>{item.Ref}</td>
                      <td>{getBUType(item.businessUnitId)}</td>
                      <td>{getClientName(item.clientId)}</td>
                      <td>{getMedecinName(item.medcienId)}</td>
                      <td>{item.caTTC}</td>
                      <td>{formatDateFr(item.dateCreation)}</td>
                      <td>{item.etatdePaiment}</td>
                      <td>
                        <div style={{display:'flex', gap:'0.5rem', justifyContent:'center'}}>
                          <button 
                            onClick={() => handleEdit(item)}
                            style={{
                              padding:'0.3rem 0.6rem',
                              background:'#1976d2',
                              color:'white',
                              border:'none',
                              borderRadius:'4px',
                              cursor:'pointer',
                              display:'flex',
                              alignItems:'center',
                              gap:'0.3rem'
                            }}
                          >
                            <span role="img" aria-label="edit">Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            style={{
                              padding:'0.3rem 0.6rem',
                              background:'#d32f2f',
                              color:'white',
                              border:'none',
                              borderRadius:'4px',
                              cursor:'pointer',
                              display:'flex',
                              alignItems:'center',
                              gap:'0.3rem'
                            }}
                          >
                            <span role="img" aria-label="delete">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                Showing {globalesFiltered.length === 0 ? 0 : 1} - {globalesFiltered.length} of {globales.length} records
              </span>
              <div className="pagination">
                <button>{'<'}</button>
                <button>{'>'}</button>
              </div>
            </div>
          </div>

          {apiError && <div style={{color:'#d32f2f', background:'#ffebee', borderRadius:6, padding:'0.7em 1em', marginBottom:'1em', fontWeight:500}}>{apiError}</div>}
          {showEditModal && editFormData && (
            <EditForm
              editFormData={editFormData}
              onEditChange={handleEditChange}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
              formErrors={formErrors}
              apiError={apiError}
              businessUnits={businessUnits}
              clients={clients}
              produits={produits}
              medciens={medciens}
              ambulances={ambulances}
              villes={villes}
            />
          )}

          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setItemToDelete(null);
            }}
            onConfirm={handleDeleteConfirm}
            itemId={itemToDelete}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 