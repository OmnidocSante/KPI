import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import '../styles/Dashboard-Responsive.css';
import api from '../services/api';
import * as XLSX from 'xlsx';

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

// Modifier la fonction isMedecinRequired pour inclure les infirmiers
const isMedecinRequired = (produitId, produits) => {
  const produit = produits.find(p => String(p.id) === String(produitId));
  const isRequired = produit && ['acte medecin', 'acte avion sanitaire', 'tam', 'acte infirmier'].includes(produit.name.toLowerCase());
  return isRequired;
};

// Add helper function isAmbulanceRequired after the isMedecinRequired function
const isAmbulanceRequired = (produitId, produits) => {
  const produit = produits.find(p => String(p.id) === String(produitId));
  return produit && ['tas', 'tam', 'vsl', 'pf', 'mad'].includes(produit.name.toLowerCase());
};

// Add helper function isInfirmierAct after the isAmbulanceRequired function
const isInfirmierAct = (produitId, produits) => {
  const produit = produits.find(p => String(p.id) === String(produitId));
  const isInfirmier = produit && produit.name.toLowerCase() === 'acte infirmier';
  return isInfirmier;
};

// Composant de notification
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        onClose();
      }
    }, 3000);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [onClose]);

  const closeButtonStyle = {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: 0,
    marginLeft: 12,
    fontSize: '1.3em',
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
    transition: 'background 0.2s, opacity 0.2s',
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      minWidth: '320px',
      maxWidth: '90vw',
      padding: '0.7rem 1.2rem',
      borderRadius: '8px',
      backgroundColor: type === 'success' ? '#4caf50' : '#f44336',
      color: 'white',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '1.08em',
      lineHeight: 1.3,
      animation: 'slideIn 0.3s ease-out',
    }}>
      <span style={{
        background: type === 'success' ? '#1ecb7b' : '#e57373',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      }}>
        <span role="img" aria-label={type === 'success' ? 'success' : 'error'} style={{fontSize: '1.3em'}}>
          {type === 'success' ? '✅' : '❌'}
        </span>
      </span>
      <span style={{flex: 1, wordBreak: 'break-word'}}>{message}</span>
      <button
        onClick={onClose}
        style={closeButtonStyle}
        onMouseOver={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.13)';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.opacity = '0.7';
        }}
        aria-label="Fermer la notification"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
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
  villes,
  infirmiers
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
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{color:'#1976d2', fontWeight:'bold', fontSize:'1.5rem', marginBottom:'1.5rem'}}>
          Modifier l'enregistrement
        </h3>
        <form onSubmit={onSubmit} className="data-form" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'1.5rem'}}>
          {/* Ligne 1 */}
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
              <label style={{fontWeight:'bold'}}>
                <span role="img" aria-label="doctor">🧑‍⚕️</span> 
                {isInfirmierAct(editFormData.produit, produits) ? 'Infirmier' : 'Médecin'}
              </label>
              <select 
                name="medecin" 
                value={isMedecinRequired(editFormData.produit, produits) ? editFormData.medecin : ''} 
                onChange={onEditChange} 
                disabled={!isMedecinRequired(editFormData.produit, produits)}
              >
                <option value="">Sélectionnez {isInfirmierAct(editFormData.produit, produits) ? 'un infirmier' : 'un médecin'}</option>
                {isInfirmierAct(editFormData.produit, produits) 
                  ? infirmiers
                      .sort((a, b) => a.nom.localeCompare(b.nom))
                      .map(i => <option key={i.id} value={i.id}>{i.nom}</option>)
                  : medciens
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                }
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="city">📍</span> Ville</label>
              <select name="ville" value={editFormData.ville} onChange={onEditChange}>
                <option value="">Sélectionnez une ville</option>
                {villes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

          {/* Ligne 2 */}
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="payment">💳</span> État de Paiement</label>
              <select name="etatPaiement" value={editFormData.etatPaiement} onChange={onEditChange}>
                <option value="Non">Non</option>
                <option value="Oui">Oui</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{fontWeight:'bold'}}><span role="img" aria-label="money">💶</span> CA TTC</label>
              <input 
                type="text" 
                name="caTTC" 
                value={editFormData.caTTC} 
                onChange={(e) => {
                  // Permettre uniquement les nombres, la virgule et le point
                  const value = e.target.value.replace(/[^0-9,.]/g, '');
                  // Remplacer la virgule par un point pour le stockage
                  const numericValue = value.replace(',', '.');
                  onEditChange({
                    target: {
                      name: 'caTTC',
                      value: numericValue
                    }
                  });
                }}
                placeholder="0.00 ou 0,00"
              />
            </div>
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

          {/* Ligne 3 */}
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

          {/* Ligne 4 */}
          <div className="form-group">
            <label style={{fontWeight:'bold'}}><span role="img" aria-label="note">📝</span> Note</label>
            <input 
              type="text" 
              name="note" 
              value={editFormData.note} 
              onChange={onEditChange} 
              placeholder="Ajoutez une note ici"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
            />
          </div>
          <div className="form-group">
            <label style={{fontWeight:'bold'}}><span role="img" aria-label="payment">💳</span> Moyen de Paiement</label>
            <select name="type" value={editFormData.type || ''} onChange={onEditChange}>
              <option value="">Non spécifié</option>
              <option value="espece">Espèce</option>
              <option value="virement">Virement</option>
              <option value="cheque">Chèque</option>
            </select>
          </div>
          <div></div>
          <div></div>
          <div className="edit-modal-buttons" style={{display: 'flex', flexDirection: 'row', gap: '1rem'}}>
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
    numero: '',
    note: '',
    type: 'espece'
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
  const [infirmiers, setInfirmiers] = useState([]);
  const [produits, setProduits] = useState([]);
  const [globales, setGlobales] = useState([]);
  const [editingGlobale, setEditingGlobale] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const modalRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [filterClient, setFilterClient] = useState([]);
  const [filterAmbulance, setFilterAmbulance] = useState([]);
  const [filterRef, setFilterRef] = useState([]);
  const [filterBU, setFilterBU] = useState([]);
  const [newRefInput, setNewRefInput] = useState('');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  
  // Nouveaux filtres avec multi-sélection
  const [filterVille, setFilterVille] = useState([]);
  const [filterProduit, setFilterProduit] = useState([]);
  const [filterMedecin, setFilterMedecin] = useState([]);
  const [filterEtatPaiement, setFilterEtatPaiement] = useState([]);
  
  // Filtres CA TTC
  const [filterCaTTCMin, setFilterCaTTCMin] = useState('');
  const [filterCaTTCMax, setFilterCaTTCMax] = useState('');
  
  // Filtre Validation
  const [filterValider, setFilterValider] = useState([]);
  
  const [dropdownOpen, setDropdownOpen] = useState({
    ville: false,
    produit: false,
    medecin: false,
    etatPaiement: false,
    client: false,
    ambulance: false,
    ref: false,
    bu: false,
    valider: false,
    // Dropdowns du formulaire
    formBusinessUnit: false,
    formClient: false,
    formProduit: false,
    formMedecin: false,
    formVille: false,
    formAmbulance: false
  });

  const [searchTerms, setSearchTerms] = useState({});
  const [formSearchTerms, setFormSearchTerms] = useState({});

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Référence pour détecter les clics en dehors des dropdowns
  const dropdownRefs = useRef({});
  const [itemToDelete, setItemToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  const [notification, setNotification] = useState({ message: '', type: '' });

  // OPTIMISATION 1: Créer des Maps pour les recherches rapides (avec vérification de sécurité)
  const villesMap = useMemo(() => {
    return villes && villes.length > 0 ? new Map(villes.map(v => [String(v.id), v])) : new Map();
  }, [villes]);

  const clientsMap = useMemo(() => {
    return clients && clients.length > 0 ? new Map(clients.map(c => [String(c.id), c])) : new Map();
  }, [clients]);

  const ambulancesMap = useMemo(() => {
    return ambulances && ambulances.length > 0 ? new Map(ambulances.map(a => [String(a.id), a])) : new Map();
  }, [ambulances]);

  const businessUnitsMap = useMemo(() => {
    return businessUnits && businessUnits.length > 0 ? new Map(businessUnits.map(bu => [String(bu.id), bu])) : new Map();
  }, [businessUnits]);

  const medecinsMap = useMemo(() => {
    return medciens && medciens.length > 0 ? new Map(medciens.map(m => [String(m.id), m])) : new Map();
  }, [medciens]);

  const infirmiersMap = useMemo(() => {
    return infirmiers && infirmiers.length > 0 ? new Map(infirmiers.map(i => [String(i.id), i])) : new Map();
  }, [infirmiers]);

  const produitsMap = useMemo(() => {
    return produits && produits.length > 0 ? new Map(produits.map(p => [String(p.id), p])) : new Map();
  }, [produits]);

  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    // Charger toutes les listes dynamiques
    const fetchData = async () => {
      try {
        const [villesRes, clientsRes, ambulancesRes, businessUnitsRes, medecinsRes, produitsRes, infirmiersRes] = await Promise.all([
          api.get('/villes'),
          api.get('/clients'),
          api.get('/ambulances'),
          api.get('/business-units'),
          api.get('/medecins'),
          api.get('/produits'),
          api.get('/infirmiers'),
        ]);
        setVilles(villesRes.data);
        setClients(clientsRes.data);
        setAmbulances(ambulancesRes.data);
        setBusinessUnits(businessUnitsRes.data);
        setMedciens(medecinsRes.data);
        setProduits(produitsRes.data);
        setInfirmiers(infirmiersRes.data);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
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

  // Gérer les clics en dehors des dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutside = Object.values(dropdownRefs.current).every(ref => 
        ref && !ref.contains(event.target)
      );
      
      if (isOutside) {
        setDropdownOpen({
          ville: false,
          produit: false,
          medecin: false,
          etatPaiement: false,
          client: false,
          ambulance: false,
          ref: false,
          bu: false,
          valider: false,
          formBusinessUnit: false,
          formClient: false,
          formProduit: false,
          formMedecin: false,
          formVille: false,
          formAmbulance: false
        });
        // Nettoyer les termes de recherche quand on ferme les dropdowns
        setSearchTerms({});
        setFormSearchTerms({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
      const selectedBU = businessUnits.find(bu => String(bu.id) === String(formData.businessUnitType));
      
      // Determine if the selected professional is an infirmier or medecin
      const selectedInfirmier = infirmiers.find(i => String(i.id) === String(formData.medecin));
      const selectedMedecin = medciens.find(m => String(m.id) === String(formData.medecin));
      
      // Set the correct ID based on the professional type
      const medcienId = selectedMedecin ? formData.medecin : null;
      const infermierId = selectedInfirmier ? formData.medecin : null;
      
      // Convertir la valeur CA TTC en nombre, en gérant à la fois la virgule et le point
      const caTTCValue = parseFloat(formData.caTTC.replace(',', '.'));
      
      const dataToSend = {
        villeId: formData.ville,
        clientId: isB2C(formData.businessUnitType, businessUnits) ? null : formData.client,
        aumbulanceId: isAmbulanceRequired(formData.produit, produits) ? formData.ambulance : null,
        businessUnitId: formData.businessUnitType,
        produitId: formData.produit,
        medcienId: medcienId,
        infermierId: infermierId,
        dateCreation: toMySQLDatetime(formData.dateIntervention),
        Ref: formData.reference,
        caHT: Number((caTTCValue / 1.2).toFixed(2)),
        caTTC: caTTCValue,
        fullName: formData.nomPrenom,
        businessUnitType: selectedBU ? selectedBU.businessUnitType : '',
        etatdePaiment: formData.etatPaiement,
        numTelephone: formData.numero,
        note: formData.note,
        type: formData.type
      };

      console.log('Sending data to server:', dataToSend);
      
      const response = await api.post('/globales', dataToSend);
      console.log('Server response:', response.data);
      
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
        numero: '',
        note: '',
        type: 'espece'
      });
      setFormErrors({});
      showNotification('Enregistrement ajouté avec succès !', 'success');
    } catch (error) {
      console.error('Error creating globale:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de l\'envoi des données';
      showNotification(`Erreur lors de l'ajout de l'enregistrement: ${errorMessage}`, 'error');
      setApiError(errorMessage);
    }
  };

  // OPTIMISATION 5: Fonctions de filtre mémoisées
  const handleFilterVilleChange = useCallback((villeId) => {
    const villeIdStr = String(villeId);
    setFilterVille(prev => 
      prev.includes(villeIdStr) 
        ? prev.filter(id => id !== villeIdStr)
        : [...prev, villeIdStr]
    );
  }, []);

  const handleFilterProduitChange = useCallback((produitId) => {
    const produitIdStr = String(produitId);
    setFilterProduit(prev => 
      prev.includes(produitIdStr) 
        ? prev.filter(id => id !== produitIdStr)
        : [...prev, produitIdStr]
    );
  }, []);

  const handleFilterMedecinChange = useCallback((medecinId) => {
    const medecinIdStr = String(medecinId);
    setFilterMedecin(prev => 
      prev.includes(medecinIdStr) 
        ? prev.filter(id => id !== medecinIdStr)
        : [...prev, medecinIdStr]
    );
  }, []);

  const handleFilterEtatPaiementChange = useCallback((etat) => {
    setFilterEtatPaiement(prev => 
      prev.includes(etat) 
        ? prev.filter(e => e !== etat)
        : [...prev, etat]
    );
  }, []);

  const handleFilterClientChange = useCallback((clientId) => {
    const clientIdStr = String(clientId);
    setFilterClient(prev => 
      prev.includes(clientIdStr) 
        ? prev.filter(id => id !== clientIdStr)
        : [...prev, clientIdStr]
    );
  }, []);

  const handleFilterAmbulanceChange = useCallback((ambulanceId) => {
    const ambulanceIdStr = String(ambulanceId);
    setFilterAmbulance(prev => 
      prev.includes(ambulanceIdStr) 
        ? prev.filter(id => id !== ambulanceIdStr)
        : [...prev, ambulanceIdStr]
    );
  }, []);

  const handleFilterRefChange = useCallback((ref) => {
    setFilterRef(prev => 
      prev.includes(ref) 
        ? prev.filter(r => r !== ref)
        : [...prev, ref]
    );
  }, []);

  const handleAddRef = useCallback((ref) => {
    if (ref.trim() && !filterRef.includes(ref.trim())) {
      setFilterRef(prev => [...prev, ref.trim()]);
      setNewRefInput('');
    }
  }, [filterRef]);

  const handleRemoveRef = useCallback((index) => {
    setFilterRef(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleFilterBUChange = useCallback((buId) => {
    const buIdStr = String(buId);
    setFilterBU(prev => 
      prev.includes(buIdStr) 
        ? prev.filter(id => id !== buIdStr)
        : [...prev, buIdStr]
    );
  }, []);

  const handleFilterValiderChange = useCallback((valeur) => {
    setFilterValider(prev => 
      prev.includes(valeur) 
        ? prev.filter(v => v !== valeur)
        : [...prev, valeur]
    );
  }, []);



  const handleFiltreChange = (e) => {
    setFiltres({
      ...filtres,
      [e.target.name]: e.target.value
    });
  };

  // OPTIMISATION 2: Fonctions de recherche optimisées avec Maps (avec vérification de sécurité)
  const getNom = useCallback((map, id, field = 'name') => {
    if (!map || !map.get) return '';
    const found = map.get(String(id));
    return found ? (found[field] || found.nom) : '';
  }, []);

  const getClientName = useCallback(id => getNom(clientsMap, id, 'clientFullName'), [clientsMap, getNom]);
  const getVilleName = useCallback(id => getNom(villesMap, id, 'name'), [villesMap, getNom]);
  const getProduitName = useCallback(id => getNom(produitsMap, id, 'name'), [produitsMap, getNom]);
  const getAmbulanceName = useCallback(id => getNom(ambulancesMap, id, 'numberPlate'), [ambulancesMap, getNom]);
  const getMedecinName = useCallback(id => getNom(medecinsMap, id, 'name'), [medecinsMap, getNom]);
  const getBUType = useCallback(id => getNom(businessUnitsMap, id, 'businessUnitType'), [businessUnitsMap, getNom]);

  // OPTIMISATION 3: Filtrage mémoisé pour éviter les recalculs
  const globalesFiltered = useMemo(() => {
    return globales.filter(item => {
      // Recherche textuelle optimisée
      if (filtres.recherche && filtres.recherche.trim()) {
        const searchTerm = filtres.recherche.toLowerCase();
        const searchableFields = [
          item.Ref || '',
          item.fullName || '',
          item.numTelephone || '',
          item.note || '',
          getVilleName(item.villeId),
          getProduitName(item.produitId),
          getClientName(item.clientId),
          getBUType(item.businessUnitId),
          getAmbulanceName(item.aumbulanceId),
          isInfirmierAct(item.produitId, produits) 
            ? getNom(infirmiersMap, item.infermierId, 'nom')
            : getMedecinName(item.medcienId)
        ].join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchTerm)) return false;
      }

      // Client (multi-sélection) - gérer les valeurs nulles
      if (filterClient.length > 0) {
        if (!item.clientId || !filterClient.includes(String(item.clientId))) return false;
      }
      
      // Ambulance (multi-sélection) - gérer les valeurs nulles
      if (filterAmbulance.length > 0) {
        if (!item.aumbulanceId || !filterAmbulance.includes(String(item.aumbulanceId))) return false;
      }
      
      // Référence (recherche partielle) - gérer les valeurs nulles
      if (filterRef.length > 0) {
        if (!item.Ref) return false;
        // Vérifier si au moins une des références du filtre est contenue dans la référence de l'item
        const itemRef = item.Ref.toLowerCase();
        const hasMatchingRef = filterRef.some(filterRefItem => 
          itemRef.includes(filterRefItem.toLowerCase())
        );
        if (!hasMatchingRef) return false;
      }
      
      // Business Unit (multi-sélection) - gérer les valeurs nulles
      if (filterBU.length > 0) {
        if (!item.businessUnitId || !filterBU.includes(String(item.businessUnitId))) return false;
      }
      
      // Date Début - gérer les valeurs nulles
      if (filterDateStart && item.dateCreation) {
        const itemDate = new Date(item.dateCreation);
        const startDate = new Date(filterDateStart);
        if (itemDate.setHours(0,0,0,0) < startDate.setHours(0,0,0,0)) return false;
      }
      
      // Date Fin - gérer les valeurs nulles
      if (filterDateEnd && item.dateCreation) {
        const itemDate = new Date(item.dateCreation);
        const endDate = new Date(filterDateEnd);
        if (itemDate.setHours(0,0,0,0) > endDate.setHours(0,0,0,0)) return false;
      }
      
      // Ville (multi-sélection) - gérer les valeurs nulles
      if (filterVille.length > 0) {
        if (!item.villeId || !filterVille.includes(String(item.villeId))) return false;
      }
      
      // Produit (multi-sélection) - gérer les valeurs nulles
      if (filterProduit.length > 0) {
        if (!item.produitId || !filterProduit.includes(String(item.produitId))) return false;
      }
      
      // Médecin/Infirmier (multi-sélection) - gérer les valeurs nulles
      if (filterMedecin.length > 0) {
        const medecinId = isInfirmierAct(item.produitId, produits) ? item.infermierId : item.medcienId;
        if (!medecinId || !filterMedecin.includes(String(medecinId))) return false;
      }
      
      // État de paiement (multi-sélection) - gérer les valeurs nulles
      if (filterEtatPaiement.length > 0) {
        if (!item.etatdePaiment || !filterEtatPaiement.includes(item.etatdePaiment)) return false;
      }
      
      // Filtre CA TTC Min
      if (filterCaTTCMin && item.caTTC) {
        const caTTCValue = parseFloat(item.caTTC);
        const minValue = parseFloat(filterCaTTCMin);
        if (caTTCValue < minValue) return false;
      }
      
      // Filtre CA TTC Max
      if (filterCaTTCMax && item.caTTC) {
        const caTTCValue = parseFloat(item.caTTC);
        const maxValue = parseFloat(filterCaTTCMax);
        if (caTTCValue > maxValue) return false;
      }
      
      // Filtre Validation
      if (filterValider.length > 0) {
        const validerValue = item.valider ? '1' : '0';
        if (!filterValider.includes(validerValue)) return false;
      }
      
      return true;
    });
  }, [
    globales, 
    filtres.recherche, 
    filterClient, 
    filterAmbulance, 
    filterRef, 
    filterBU, 
    filterDateStart, 
    filterDateEnd, 
    filterVille, 
    filterProduit, 
    filterMedecin, 
    filterEtatPaiement, 
    filterCaTTCMin, 
    filterCaTTCMax,
    filterValider,
    getVilleName,
    getProduitName,
    getClientName,
    getBUType,
    getAmbulanceName,
    getMedecinName,
    getNom,
    infirmiersMap,
    produits
  ]);

  const handleEdit = (globale) => {
    setEditingGlobale(globale);
    setEditFormData({
      businessUnitType: globale.businessUnitId,
      client: globale.clientId,
      produit: globale.produitId,
      nomPrenom: globale.fullName,
      medecin: isInfirmierAct(globale.produitId, produits) ? globale.infermierId : globale.medcienId,
      ambulance: globale.aumbulanceId,
      ville: globale.villeId,
      reference: globale.Ref,
      etatPaiement: globale.etatdePaiment,
      dateIntervention: globale.dateCreation ? new Date(globale.dateCreation).toISOString().split('T')[0] : '',
      caTTC: globale.caTTC.toString(),
      numero: globale.numTelephone,
      note: globale.note || '',
      type: globale.type || null
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let newEditFormData = { ...editFormData, [name]: value };
    
    if (name === 'caTTC') {
      // Permettre uniquement les nombres, la virgule et le point
      const cleanValue = value.replace(/[^0-9,.]/g, '');
      newEditFormData.caTTC = cleanValue;
    }
    
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
      const selectedBU = businessUnits.find(bu => String(bu.id) === String(editFormData.businessUnitType));
      
      // Convertir la valeur CA TTC en nombre, en gérant à la fois la virgule et le point
      const caTTCValue = parseFloat(editFormData.caTTC.replace(',', '.'));
      
      const dataToSend = {
        villeId: editFormData.ville,
        clientId: isB2C(editFormData.businessUnitType, businessUnits) ? null : editFormData.client,
        aumbulanceId: isAmbulanceRequired(editFormData.produit, produits) ? editFormData.ambulance : null,
        businessUnitId: editFormData.businessUnitType,
        produitId: editFormData.produit,
        medcienId: isMedecinRequired(editFormData.produit, produits) && !isInfirmierAct(editFormData.produit, produits) ? editFormData.medecin : null,
        infermierId: isInfirmierAct(editFormData.produit, produits) ? editFormData.medecin : null,
        dateCreation: toMySQLDatetime(editFormData.dateIntervention),
        Ref: editFormData.reference,
        caHT: Number((caTTCValue / 1.2).toFixed(2)),
        caTTC: caTTCValue,
        fullName: editFormData.nomPrenom,
        businessUnitType: selectedBU ? selectedBU.businessUnitType : '',
        etatdePaiment: editFormData.etatPaiement,
        numTelephone: editFormData.numero,
        note: editFormData.note,
        type: editFormData.type
      };
      await api.put(`/globales/${editingGlobale.id}`, dataToSend);
      const res = await api.get('/globales');
      setGlobales(res.data);
      setShowEditModal(false);
      setEditingGlobale(null);
      setEditFormData(null);
      setFormErrors({});
      showNotification('Enregistrement modifié avec succès !', 'success');
    } catch (error) {
      showNotification('Erreur lors de la modification', 'error');
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
      showNotification('Enregistrement supprimé avec succès !', 'success');
    } catch (error) {
      showNotification('Erreur lors de la suppression', 'error');
      setApiError('Erreur lors de la suppression');
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const handleValider = async (id) => {
    try {
      await api.post(`/globales/${id}/valider`);
      const res = await api.get('/globales');
      setGlobales(res.data);
      showNotification('Globale validée avec succès !', 'success');
    } catch (error) {
      showNotification('Erreur lors de la validation', 'error');
      setApiError('Erreur lors de la validation');
    }
  };

  // OPTIMISATION 4: Pagination mémoisée
  const totalRows = useMemo(() => globalesFiltered.length, [globalesFiltered]);
  const totalPages = useMemo(() => Math.ceil(totalRows / rowsPerPage), [totalRows, rowsPerPage]);
  const paginatedRows = useMemo(() => {
    return globalesFiltered.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [globalesFiltered, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterClient, filterAmbulance, filterRef, filterBU, filterDateStart, filterDateEnd, filterVille, filterProduit, filterMedecin, filterEtatPaiement, filterCaTTCMin, filterCaTTCMax, filterValider]);

  const handleDownloadExcel = () => {
    // Préparer les données pour l'export
    const exportData = globalesFiltered.map(item => ({
      'ID': item.id,
      'Ville': getVilleName(item.villeId),
      'Produit': getProduitName(item.produitId),
      'Ambulance': getAmbulanceName(item.aumbulanceId),
      'Référence': item.Ref,
      'Business Unit': getBUType(item.businessUnitId),
      'Client': getClientName(item.clientId),
      'Médecin/Infirmier': isInfirmierAct(item.produitId, produits) 
        ? getNom(infirmiers, item.infermierId, 'nom')
        : getMedecinName(item.medcienId),
      'CA TTC': item.caTTC,
      'Date d\'intervention': formatDateFr(item.dateCreation),
      'État de paiement': item.etatdePaiment,
      'Numéro': item.numTelephone,
      'Note': item.note || '',
      'Type de paiement': item.type || ''
    }));

    // Créer un nouveau classeur
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 5 },  // ID
      { wch: 15 }, // Ville
      { wch: 20 }, // Produit
      { wch: 15 }, // Ambulance
      { wch: 15 }, // Référence
      { wch: 15 }, // Business Unit
      { wch: 20 }, // Client
      { wch: 20 }, // Médecin/Infirmier
      { wch: 10 }, // CA TTC
      { wch: 15 }, // Date d'intervention
      { wch: 15 }, // État de paiement
      { wch: 15 }, // Numéro
      { wch: 30 }, // Note
      { wch: 15 }  // Type de paiement
    ];
    ws['!cols'] = colWidths;

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, "Globale Records");

    // Générer le fichier Excel
    const fileName = `Globale_Records_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="dashboard-layout">
      {notification.message && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: '', type: '' })}
        />
      )}
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          {/* Formulaire */}
          <div className="form-section">
            <h3 style={{color:'#1976d2', fontWeight:'bold', fontSize:'1.5rem', display:'flex', alignItems:'center', gap:'0.5rem'}}>
              <span role="img" aria-label="form">📄</span> Formulaire de Sélection
            </h3>
            <form onSubmit={handleSubmit} className="data-form" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'1.5rem'}}>
              {/* Ligne 1 */}
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="business">🏢</span> Business Unit Type *</label>
                  <div className={`dropdown-container ${dropdownOpen.formBusinessUnit ? 'open' : ''}`} ref={el => dropdownRefs.current.formBusinessUnit = el} style={{borderColor: formErrors.businessUnitType ? '#d32f2f' : undefined}}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, formBusinessUnit: !prev.formBusinessUnit}))}>
                      <span>{formData.businessUnitType ? businessUnits.find(bu => String(bu.id) === String(formData.businessUnitType))?.businessUnitType || 'Sélectionnez un type' : 'Sélectionnez un type'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.formBusinessUnit && (
                      <div className="dropdown-content">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={formSearchTerms.businessUnit || ''}
                          onChange={(e) => setFormSearchTerms(prev => ({ ...prev, businessUnit: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {businessUnits
                          .filter(bu => !formSearchTerms.businessUnit || bu.businessUnitType.toLowerCase().includes(formSearchTerms.businessUnit.toLowerCase()))
                          .map(bu => (
                          <div 
                            key={bu.id} 
                            className="dropdown-item"
                            onClick={() => {
                              handleChange({ target: { name: 'businessUnitType', value: bu.id } });
                              setDropdownOpen(prev => ({...prev, formBusinessUnit: false}));
                              setFormSearchTerms(prev => ({ ...prev, businessUnit: '' }));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: String(formData.businessUnitType) === String(bu.id) ? '#e3f2fd' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.businessUnitType) === String(bu.id) ? '#e3f2fd' : 'transparent'}
                          >
                            {bu.businessUnitType}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formErrors.businessUnitType && <span style={{color:'#d32f2f', fontSize:'0.9em'}}><span role="img" aria-label="error">❗</span> {formErrors.businessUnitType}</span>}
                </div>

                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="client">👤</span> Client</label>
                  <div className={`dropdown-container ${dropdownOpen.formClient ? 'open' : ''}`} ref={el => dropdownRefs.current.formClient = el} style={{opacity: isB2C(formData.businessUnitType, businessUnits) ? 0.5 : 1, pointerEvents: isB2C(formData.businessUnitType, businessUnits) ? 'none' : 'auto'}}>
                    <div className="dropdown-header" onClick={() => !isB2C(formData.businessUnitType, businessUnits) && setDropdownOpen(prev => ({...prev, formClient: !prev.formClient}))}>
                      <span>{formData.client ? clients.find(c => String(c.id) === String(formData.client))?.clientFullName || 'Sélectionnez un client' : 'Sélectionnez un client'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.formClient && (
                      <div className="dropdown-content">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={formSearchTerms.client || ''}
                          onChange={(e) => setFormSearchTerms(prev => ({ ...prev, client: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {clients
                          .filter(c => !formSearchTerms.client || c.clientFullName.toLowerCase().includes(formSearchTerms.client.toLowerCase()))
                          .map(c => (
                          <div 
                            key={c.id} 
                            className="dropdown-item"
                            onClick={() => {
                              handleChange({ target: { name: 'client', value: c.id } });
                              setDropdownOpen(prev => ({...prev, formClient: false}));
                              setFormSearchTerms(prev => ({ ...prev, client: '' }));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: String(formData.client) === String(c.id) ? '#e3f2fd' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.client) === String(c.id) ? '#e3f2fd' : 'transparent'}
                          >
                            {c.clientFullName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="ref">#</span> Référence</label>
                  <input type="text" name="reference" value={formData.reference} onChange={handleChange} placeholder="Référence" />
                </div>

                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="pill">💊</span> Produit</label>
                  <div className={`dropdown-container ${dropdownOpen.formProduit ? 'open' : ''}`} ref={el => dropdownRefs.current.formProduit = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, formProduit: !prev.formProduit}))}>
                      <span>{formData.produit ? produits.find(p => String(p.id) === String(formData.produit))?.name || 'Sélectionnez un produit' : 'Sélectionnez un produit'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.formProduit && (
                      <div className="dropdown-content">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={formSearchTerms.produit || ''}
                          onChange={(e) => setFormSearchTerms(prev => ({ ...prev, produit: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {produits
                          .filter(p => !formSearchTerms.produit || p.name.toLowerCase().includes(formSearchTerms.produit.toLowerCase()))
                          .map(p => (
                          <div 
                            key={p.id} 
                            className="dropdown-item"
                            onClick={() => {
                              handleChange({ target: { name: 'produit', value: p.id } });
                              setDropdownOpen(prev => ({...prev, formProduit: false}));
                              setFormSearchTerms(prev => ({ ...prev, produit: '' }));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: String(formData.produit) === String(p.id) ? '#e3f2fd' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.produit) === String(p.id) ? '#e3f2fd' : 'transparent'}
                          >
                            {p.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}>
                    <span role="img" aria-label="doctor">🧑‍⚕️</span> 
                    {isInfirmierAct(formData.produit, produits) ? 'Infirmier' : 'Médecin'}
                  </label>
                  <div className={`dropdown-container ${dropdownOpen.formMedecin ? 'open' : ''}`} ref={el => dropdownRefs.current.formMedecin = el} style={{opacity: !isMedecinRequired(formData.produit, produits) ? 0.5 : 1, pointerEvents: !isMedecinRequired(formData.produit, produits) ? 'none' : 'auto'}}>
                    <div className="dropdown-header" onClick={() => isMedecinRequired(formData.produit, produits) && setDropdownOpen(prev => ({...prev, formMedecin: !prev.formMedecin}))}>
                      <span>
                        {formData.medecin 
                          ? (isInfirmierAct(formData.produit, produits) 
                              ? infirmiers.find(i => String(i.id) === String(formData.medecin))?.nom
                              : medciens.find(m => String(m.id) === String(formData.medecin))?.name) || `Sélectionnez ${isInfirmierAct(formData.produit, produits) ? 'un infirmier' : 'un médecin'}`
                          : `Sélectionnez ${isInfirmierAct(formData.produit, produits) ? 'un infirmier' : 'un médecin'}`
                        }
                      </span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.formMedecin && (
                      <div className="dropdown-content">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={formSearchTerms.medecin || ''}
                          onChange={(e) => setFormSearchTerms(prev => ({ ...prev, medecin: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {isInfirmierAct(formData.produit, produits) 
                          ? infirmiers
                              .filter(i => !formSearchTerms.medecin || i.nom.toLowerCase().includes(formSearchTerms.medecin.toLowerCase()))
                              .sort((a, b) => a.nom.localeCompare(b.nom))
                              .map(i => (
                                <div 
                                  key={i.id} 
                                  className="dropdown-item"
                                  onClick={() => {
                                    handleChange({ target: { name: 'medecin', value: i.id } });
                                    setDropdownOpen(prev => ({...prev, formMedecin: false}));
                                    setFormSearchTerms(prev => ({ ...prev, medecin: '' }));
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: String(formData.medecin) === String(i.id) ? '#e3f2fd' : 'transparent',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.medecin) === String(i.id) ? '#e3f2fd' : 'transparent'}
                                >
                                  {i.nom}
                                </div>
                              ))
                          : medciens
                              .filter(m => !formSearchTerms.medecin || m.name.toLowerCase().includes(formSearchTerms.medecin.toLowerCase()))
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map(m => (
                                <div 
                                  key={m.id} 
                                  className="dropdown-item"
                                  onClick={() => {
                                    handleChange({ target: { name: 'medecin', value: m.id } });
                                    setDropdownOpen(prev => ({...prev, formMedecin: false}));
                                    setFormSearchTerms(prev => ({ ...prev, medecin: '' }));
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    backgroundColor: String(formData.medecin) === String(m.id) ? '#e3f2fd' : 'transparent',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.medecin) === String(m.id) ? '#e3f2fd' : 'transparent'}
                                >
                                  {m.name}
                                </div>
                              ))
                        }
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="city">📍</span> Ville</label>
                  <div className={`dropdown-container ${dropdownOpen.formVille ? 'open' : ''}`} ref={el => dropdownRefs.current.formVille = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, formVille: !prev.formVille}))}>
                      <span>{formData.ville ? villes.find(v => String(v.id) === String(formData.ville))?.name || 'Sélectionnez une ville' : 'Sélectionnez une ville'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.formVille && (
                      <div className="dropdown-content">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={formSearchTerms.ville || ''}
                          onChange={(e) => setFormSearchTerms(prev => ({ ...prev, ville: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {villes
                          .filter(v => !formSearchTerms.ville || v.name.toLowerCase().includes(formSearchTerms.ville.toLowerCase()))
                          .map(v => (
                          <div 
                            key={v.id} 
                            className="dropdown-item"
                            onClick={() => {
                              handleChange({ target: { name: 'ville', value: v.id } });
                              setDropdownOpen(prev => ({...prev, formVille: false}));
                              setFormSearchTerms(prev => ({ ...prev, ville: '' }));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: String(formData.ville) === String(v.id) ? '#e3f2fd' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.ville) === String(v.id) ? '#e3f2fd' : 'transparent'}
                          >
                            {v.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="ambulance">🚑</span> Ambulance</label>
                  <div className={`dropdown-container ${dropdownOpen.formAmbulance ? 'open' : ''}`} ref={el => dropdownRefs.current.formAmbulance = el} style={{opacity: !isAmbulanceRequired(formData.produit, produits) ? 0.5 : 1, pointerEvents: !isAmbulanceRequired(formData.produit, produits) ? 'none' : 'auto'}}>
                    <div className="dropdown-header" onClick={() => isAmbulanceRequired(formData.produit, produits) && setDropdownOpen(prev => ({...prev, formAmbulance: !prev.formAmbulance}))}>
                      <span>{formData.ambulance ? ambulances.find(a => String(a.id) === String(formData.ambulance))?.numberPlate || 'Sélectionnez une ambulance' : 'Sélectionnez une ambulance'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.formAmbulance && (
                      <div className="dropdown-content">
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={formSearchTerms.ambulance || ''}
                          onChange={(e) => setFormSearchTerms(prev => ({ ...prev, ambulance: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {ambulances
                          .filter(a => !formSearchTerms.ambulance || a.numberPlate.toLowerCase().includes(formSearchTerms.ambulance.toLowerCase()))
                          .map(a => (
                          <div 
                            key={a.id} 
                            className="dropdown-item"
                            onClick={() => {
                              handleChange({ target: { name: 'ambulance', value: a.id } });
                              setDropdownOpen(prev => ({...prev, formAmbulance: false}));
                              setFormSearchTerms(prev => ({ ...prev, ambulance: '' }));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: String(formData.ambulance) === String(a.id) ? '#e3f2fd' : 'transparent',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(formData.ambulance) === String(a.id) ? '#e3f2fd' : 'transparent'}
                          >
                            {a.numberPlate}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              {/* Ligne 2 */}
              
          
  
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="id">🆔</span> Nom - Prénom</label>
                  <input type="text" name="nomPrenom" value={formData.nomPrenom} onChange={handleChange} placeholder="Votre nom et prénom ici" />
                </div>

              {/* Ligne 3 */}

          
              
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="phone">📞</span> Numéro</label>
                  <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Numéro" />
                </div>
                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="calendar">📅</span> Date d'intervention</label>
                  <input type="date" name="dateIntervention" value={formData.dateIntervention} onChange={handleChange} placeholder="jj/mm/aaaa" />
                </div>

                <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="money">💶</span> CA TTC</label>
                  <input 
                    type="text" 
                    name="caTTC" 
                    value={formData.caTTC} 
                    onChange={(e) => {
                      // Permettre uniquement les nombres, la virgule et le point
                      const value = e.target.value.replace(/[^0-9,.]/g, '');
                      // Remplacer la virgule par un point pour le stockage
                      const numericValue = value.replace(',', '.');
                      setFormData({
                        ...formData,
                        caTTC: value
                      });
                    }}
                    placeholder="0.00 ou 0,00"
                  />
                </div>
              {/* Ligne 4 */}
              <div className="form-group">
                  <label style={{fontWeight:'bold'}}><span role="img" aria-label="payment">💳</span> État de Paiement</label>
                  <select name="etatPaiement" value={formData.etatPaiement} onChange={handleChange}>
                    <option value="Non">Non</option>
                    <option value="Oui">Oui</option>
                  </select>
                </div>

              <div className="form-group">
                <label style={{fontWeight:'bold'}}><span role="img" aria-label="payment">💳</span> Moyen de Paiement</label>
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="espece">Espèce</option>
                  <option value="virement">Virement</option>
                  <option value="cheque">Chèque</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{fontWeight:'bold'}}><span role="img" aria-label="note">📝</span> Note</label>
                <input 
                  type="text" 
                  name="note" 
                  value={formData.note} 
                  onChange={handleChange} 
                  placeholder="Ajoutez une note ici"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px',
                    transition: 'border-color 0.2s'
                  }}
                />
              </div>
              <div></div>
              <div></div>
              <button type="submit" className="submit-btn" style={{gridColumn:'1/5', marginTop:'1rem'}}>Ajouter</button>
            </form>
          </div>

          {/* Tableau de données */}
          <div className="table-section">
            <div className="table-header">
              <div className="table-title">
                <span role="img" aria-label="table" style={{fontSize: '1.3em', marginRight: 8}}>📋</span>
                <span>Globale Records</span>
              </div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <button
                  className="download-excel-btn"
                  onClick={handleDownloadExcel}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <span role="img" aria-label="download">📥</span>
                  Télécharger Excel
                </button>

              </div>
            </div>
            <div className="filters-section">
           
              
              {/* Première ligne - Filtres principaux */}
              <div className="filters-grid">
                <div className="filter-group">
                  <label>🏙️ Ville</label>
                  <div className={`dropdown-container ${dropdownOpen.ville ? 'open' : ''}`} ref={el => dropdownRefs.current.ville = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, ville: !prev.ville}))}>
                      <span>{filterVille.length > 0 ? `${filterVille.length} ville(s)` : 'Toutes les villes'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.ville && (
                      <div className="dropdown-content">
                        {/* Champ de recherche */}
                        <input
                          type="text"
                          placeholder="Rechercher une ville..."
                          value={searchTerms.ville || ''}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, ville: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {villes
                          .filter(ville => !searchTerms.ville || ville.name.toLowerCase().includes(searchTerms.ville.toLowerCase()))
                          .map(ville => (
                          <label key={ville.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterVille.includes(String(ville.id))}
                              onChange={() => handleFilterVilleChange(ville.id)}
                            />
                            <span>{ville.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>💊 Produit</label>
                  <div className={`dropdown-container ${dropdownOpen.produit ? 'open' : ''}`} ref={el => dropdownRefs.current.produit = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, produit: !prev.produit}))}>
                      <span>{filterProduit.length > 0 ? `${filterProduit.length} produit(s)` : 'Tous les produits'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.produit && (
                      <div className="dropdown-content">
                        {/* Champ de recherche */}
                        <input
                          type="text"
                          placeholder="Rechercher un produit..."
                          value={searchTerms.produit || ''}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, produit: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {produits
                          .filter(produit => !searchTerms.produit || produit.name.toLowerCase().includes(searchTerms.produit.toLowerCase()))
                          .map(produit => (
                          <label key={produit.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterProduit.includes(String(produit.id))}
                              onChange={() => handleFilterProduitChange(produit.id)}
                            />
                            <span>{produit.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>👨‍⚕️ Médecin/Infirmier</label>
                  <div className={`dropdown-container ${dropdownOpen.medecin ? 'open' : ''}`} ref={el => dropdownRefs.current.medecin = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, medecin: !prev.medecin}))}>
                      <span>{filterMedecin.length > 0 ? `${filterMedecin.length} sélectionné(s)` : 'Tous les professionnels'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.medecin && (
                      <div className="dropdown-content">
                        {/* Champ de recherche */}
                        <input
                          type="text"
                          placeholder="Rechercher un médecin ou infirmier..."
                          value={searchTerms.medecin || ''}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, medecin: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="filter-section-title">Médecins</div>
                        {medciens
                          .filter(medecin => !searchTerms.medecin || medecin.name.toLowerCase().includes(searchTerms.medecin.toLowerCase()))
                          .map(medecin => (
                          <label key={medecin.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterMedecin.includes(String(medecin.id))}
                              onChange={() => handleFilterMedecinChange(medecin.id)}
                            />
                            <span>{medecin.name}</span>
                          </label>
                        ))}
                        <div className="filter-section-title">Infirmiers</div>
                        {infirmiers
                          .filter(infirmier => !searchTerms.medecin || infirmier.nom.toLowerCase().includes(searchTerms.medecin.toLowerCase()))
                          .map(infirmier => (
                          <label key={`inf_${infirmier.id}`} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterMedecin.includes(String(infirmier.id))}
                              onChange={() => handleFilterMedecinChange(infirmier.id)}
                            />
                            <span>{infirmier.nom}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>💳 État de Paiement</label>
                  <div className={`dropdown-container ${dropdownOpen.etatPaiement ? 'open' : ''}`} ref={el => dropdownRefs.current.etatPaiement = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, etatPaiement: !prev.etatPaiement}))}>
                      <span>{filterEtatPaiement.length > 0 ? `${filterEtatPaiement.length} état(s)` : 'Tous les états'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.etatPaiement && (
                      <div className="dropdown-content">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filterEtatPaiement.includes('Oui')}
                            onChange={() => handleFilterEtatPaiementChange('Oui')}
                          />
                          <span>✅ Payé</span>
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filterEtatPaiement.includes('Non')}
                            onChange={() => handleFilterEtatPaiementChange('Non')}
                          />
                          <span>❌ Non payé</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Deuxième ligne - Filtres secondaires */}
              <div className="filters-grid">
                <div className="filter-group">
                  <label>👤 Client</label>
                  <div className={`dropdown-container ${dropdownOpen.client ? 'open' : ''}`} ref={el => dropdownRefs.current.client = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, client: !prev.client}))}>
                      <span>{filterClient.length > 0 ? `${filterClient.length} client(s)` : 'Tous les clients'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.client && (
                      <div className="dropdown-content">
                        {/* Champ de recherche */}
                        <input
                          type="text"
                          placeholder="Rechercher un client..."
                          value={searchTerms.client || ''}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, client: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {clients
                          .filter(client => !searchTerms.client || client.clientFullName.toLowerCase().includes(searchTerms.client.toLowerCase()))
                          .map(client => (
                          <label key={client.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterClient.includes(String(client.id))}
                              onChange={() => handleFilterClientChange(client.id)}
                            />
                            <span>{client.clientFullName}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>🚑 Ambulance</label>
                  <div className={`dropdown-container ${dropdownOpen.ambulance ? 'open' : ''}`} ref={el => dropdownRefs.current.ambulance = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, ambulance: !prev.ambulance}))}>
                      <span>{filterAmbulance.length > 0 ? `${filterAmbulance.length} ambulance(s)` : 'Toutes les ambulances'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.ambulance && (
                      <div className="dropdown-content">
                        {/* Champ de recherche */}
                        <input
                          type="text"
                          placeholder="Rechercher une ambulance..."
                          value={searchTerms.ambulance || ''}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, ambulance: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {ambulances
                          .filter(ambulance => !searchTerms.ambulance || ambulance.numberPlate.toLowerCase().includes(searchTerms.ambulance.toLowerCase()))
                          .map(ambulance => (
                          <label key={ambulance.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterAmbulance.includes(String(ambulance.id))}
                              onChange={() => handleFilterAmbulanceChange(ambulance.id)}
                            />
                            <span>{ambulance.numberPlate}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label>🏢 Business Unit</label>
                  <div className={`dropdown-container ${dropdownOpen.bu ? 'open' : ''}`} ref={el => dropdownRefs.current.bu = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, bu: !prev.bu}))}>
                      <span>{filterBU.length > 0 ? `${filterBU.length} BU(s)` : 'Toutes les BU'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.bu && (
                      <div className="dropdown-content">
                        {/* Champ de recherche */}
                        <input
                          type="text"
                          placeholder="Rechercher une business unit..."
                          value={searchTerms.bu || ''}
                          onChange={(e) => setSearchTerms(prev => ({ ...prev, bu: e.target.value }))}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: 'none',
                            borderBottom: '1px solid #e0e0e0',
                            fontSize: '0.9rem',
                            outline: 'none',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px 8px 0 0',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        {businessUnits
                          .filter(bu => !searchTerms.bu || bu.businessUnitType.toLowerCase().includes(searchTerms.bu.toLowerCase()))
                          .map(bu => (
                          <label key={bu.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={filterBU.includes(String(bu.id))}
                              onChange={() => handleFilterBUChange(bu.id)}
                            />
                            <span>{bu.businessUnitType}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                                 <div className="filter-group">
                   <label>🔢 Référence</label>
                   <div className={`dropdown-container ${dropdownOpen.ref ? 'open' : ''}`} ref={el => dropdownRefs.current.ref = el}>
                     <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, ref: !prev.ref}))}>
                       <span>{filterRef.length > 0 ? `${filterRef.length} terme(s)` : 'Ajouter des termes de recherche'}</span>
                       <span className="dropdown-arrow">▼</span>
                     </div>
                    {dropdownOpen.ref && (
                      <div className="dropdown-content">
                                                 <div className="ref-input-section">
                           <input
                             type="text"
                             placeholder="Référence"
                             value={newRefInput}
                             style={{
                               width: '88%',
                               padding: '0.5rem 1rem',
                               border: '1px solid #ced4da',
                               borderRadius: '4px',
                               fontSize: '1rem'
                             }}
                             onChange={(e) => setNewRefInput(e.target.value)}
                             onKeyPress={(e) => {
                               if (e.key === 'Enter') {
                                 handleAddRef(newRefInput);
                               }
                             }}
                             className="ref-input"
                           />
                           <button 
                             type="button" 
                             onClick={() => handleAddRef(newRefInput)}
                             className="add-ref-btn"
                             disabled={!newRefInput.trim()}
                           >
                             ➕ Ajouter
                           </button>
                         </div>
                                                 {filterRef.length > 0 && (
                           <div className="ref-list">
                             <div className="ref-list-title">Termes de recherche :</div>
                            {filterRef.map((ref, index) => (
                              <div key={index} className="checkbox-label" style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.25rem 0',
                                borderBottom: '1px solid #eee'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() => handleRemoveRef(index)}
                                  style={{ cursor: 'pointer' }}
                                />
                                <span style={{ flex: 1 }}>{ref}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRef(index)}
                                  style={{
                                    background: '#ff4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Supprimer cette référence"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Troisième ligne - Filtres de date et CA */}
              <div className="filters-grid">
                <div className="filter-group">
                  <label>📅 Date de début</label>
                  <input
                    type="date"
                    value={filterDateStart}
                    onChange={e => setFilterDateStart(e.target.value)}
                    className="date-input"
                  />
                </div>

                <div className="filter-group">
                  <label>📅 Date de fin</label>
                  <input
                    type="date"
                    value={filterDateEnd}
                    onChange={e => setFilterDateEnd(e.target.value)}
                    className="date-input"
                  />
                </div>
                
                <div className="filter-group">
                  <label>💶 CA TTC Min</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filterCaTTCMin}
                    onChange={e => setFilterCaTTCMin(e.target.value)}
                    className="date-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="filter-group">
                  <label>💶 CA TTC Max</label>
                  <input
                    type="number"
                    placeholder="999999.99"
                    value={filterCaTTCMax}
                    onChange={e => setFilterCaTTCMax(e.target.value)}
                    className="date-input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="filter-group">
                  <label>✅ Validation</label>
                  <div className={`dropdown-container ${dropdownOpen.valider ? 'open' : ''}`} ref={el => dropdownRefs.current.valider = el}>
                    <div className="dropdown-header" onClick={() => setDropdownOpen(prev => ({...prev, valider: !prev.valider}))}>
                      <span>{filterValider.length > 0 ? `${filterValider.length} sélectionné(s)` : 'Tous les statuts'}</span>
                      <span className="dropdown-arrow">▼</span>
                    </div>
                    {dropdownOpen.valider && (
                      <div className="dropdown-content">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filterValider.includes('1')}
                            onChange={() => handleFilterValiderChange('1')}
                          />
                          <span>✅ Validé</span>
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filterValider.includes('0')}
                            onChange={() => handleFilterValiderChange('0')}
                          />
                          <span>⚠️ Non validé</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="filter-group filter-actions">
                  <label>&nbsp;</label>
                  <button
                    className="reset-filters-btn"
                    onClick={() => {
                      setFilterClient([]);
                      setFilterAmbulance([]);
                      setFilterRef([]);
                      setFilterBU([]);
                      setNewRefInput('');
                      setFilterDateStart('');
                      setFilterDateEnd('');
                      setFilterVille([]);
                      setFilterProduit([]);
                      setFilterMedecin([]);
                      setFilterEtatPaiement([]);
                      setFilterCaTTCMin('');
                      setFilterCaTTCMax('');
                      setFilterValider([]);
                      
                      setFiltres(prev => ({ ...prev, recherche: '' }));
                    }}
                  >
                    <span role="img" aria-label="reset">🔄</span>
                    Réinitialiser tous les filtres
                  </button>
                </div>
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
                    <th>Médecin</th>
                    <th>CA TTC</th>
                    <th>Date d'intervention</th>
                    <th>Etat de paiement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="no-result-row">
                        <span className="no-result-icon">🔍</span>
                        <span>Aucun résultat trouvé</span>
                      </td>
                    </tr>
                  ) : paginatedRows.map(item => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{getVilleName(item.villeId)}</td>
                      <td>{getProduitName(item.produitId)}</td>
                      <td>{getAmbulanceName(item.aumbulanceId)}</td>
                      <td>{item.Ref}</td>
                      <td>{getBUType(item.businessUnitId)}</td>
                      <td>{getClientName(item.clientId)}</td>
                      <td>
                        {isInfirmierAct(item.produitId, produits) 
                          ? getNom(infirmiers, item.infermierId, 'nom')
                          : getMedecinName(item.medcienId)
                        }
                      </td>
                      <td>{item.caTTC}</td>
                      <td>{formatDateFr(item.dateCreation)}</td>
                      <td>{item.etatdePaiment}</td>
                      <td>
                        <div style={{display:'flex', gap:'8px', justifyContent:'center', alignItems:'center', flexWrap:'nowrap'}}>
                          {!item.valider && (
                            <button 
                              onClick={() => handleValider(item.id)}
                              title="Valider"
                              style={{
                                width: 32,
                                height: 32,
                                minWidth: 32,
                                minHeight: 32,
                                boxSizing: 'border-box',
                                lineHeight: '32px',
                                padding: 0,
                                borderRadius: '50%',
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                border: '1.5px solid #81c784',
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                cursor: 'pointer', 
                                fontSize: '16px', 
                                fontWeight: 600
                              }}
                            >
                              ✓
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(item)}
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
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'pointer', 
                              fontSize: '16px', 
                              fontWeight: 600
                            }}
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
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
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'pointer', 
                              fontSize: '16px', 
                              fontWeight: 600
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  {'<'}
                </button>
                <span style={{margin: '0 8px'}}>Page {currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  {'>'}
                </button>
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
              infirmiers={infirmiers}
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