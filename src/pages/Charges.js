import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { 
  fetchChargeCategories,
  createChargeCategory,
  fetchCharges,
  createCharge,
  updateCharge,
  deleteCharge,
  fetchChargeById,
  fetchChargeInstallments,
  payChargeInstallment,
  fetchVilles,
  fetchAmbulances,
  fetchMedecins,
  fetchInfirmiers,
  fetchAmbulanciers,
  unpayChargeInstallment,
  autorouteCharge,
  carburantCharge,
  fetchFournisseurs,
  validateCharge,
  invalidateCharge
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

const Charges = () => {
  const toYMD = (v) => {
    if (!v) return '';
    const s = String(v);
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : s;
  };
  const formatFr = (ymd) => {
    const s = toYMD(ymd);
    if (!s || s.length < 10) return s || '';
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };
  const [charges, setCharges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategoryIds, setFilterCategoryIds] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterVilleIds, setFilterVilleIds] = useState([]);
  const [filterPaidStatuses, setFilterPaidStatuses] = useState([]);
  const [filterFournisseurIds, setFilterFournisseurIds] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showVilleFilter, setShowVilleFilter] = useState(false);
  const [showPaidFilter, setShowPaidFilter] = useState(false);
  const [showFournisseurFilter, setShowFournisseurFilter] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editChargeItem, setEditChargeItem] = useState(null);
  const [form, setForm] = useState({
    label: '',
    categoryId: '',
    villeId: '',
    type: 'recurring',
    priceType: 'monthly',
    unitPrice: '',
    periodCount: '',
    startDate: '',
    endDate: '',
    amount: '',
    variableDate: '',
    notes: '',
    fournisseurId: '',
    invoicePeriod: ''
  });

  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [villes, setVilles] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [infirmiers, setInfirmiers] = useState([]);
  const [ambulanciers, setAmbulanciers] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [fournisseurSearch, setFournisseurSearch] = useState('');

  const [showAutorouteModal, setShowAutorouteModal] = useState(false);
  const [importMode, setImportMode] = useState('autoroute'); // 'autoroute' | 'carburant'
  const [autorouteForm, setAutorouteForm] = useState({ montant: '', ville: '', ambulanceNumber: '', ambulancierName: '', date: '' });
  const [autorouteResult, setAutorouteResult] = useState(null);

  // Réinitialiser les sélections dépendantes lors du changement de ville
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      ambulanceId: '',
      medecinId: '',
      infirmierId: '',
      ambulancierId: ''
    }));
  }, [form.villeId]);

  const loadCharges = async () => {
    setLoading(true);
    try {
      const res = await fetchCharges();
      setCharges(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des charges', type: 'error' });
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const res = await fetchChargeCategories();
      setCategories(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des catégories', type: 'error' });
    }
  };

  const loadVilles = async () => {
    try {
      const res = await fetchVilles();
      setVilles(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des villes', type: 'error' });
    }
  };

  const loadAmbulances = async () => {
    try {
      const res = await fetchAmbulances();
      setAmbulances(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des ambulances', type: 'error' });
    }
  };

  const loadMedecins = async () => {
    try {
      const res = await fetchMedecins();
      setMedecins(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des médecins', type: 'error' });
    }
  };

  const loadInfirmiers = async () => {
    try {
      const res = await fetchInfirmiers();
      setInfirmiers(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des infirmiers', type: 'error' });
    }
  };

  const loadAmbulanciersList = async () => {
    try {
      const res = await fetchAmbulanciers();
      setAmbulanciers(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des ambulanciers', type: 'error' });
    }
  };

  const loadFournisseurs = async () => {
    try {
      const res = await fetchFournisseurs();
      setFournisseurs(res.data);
    } catch (e) {
      setNotification({ message: 'Erreur lors du chargement des fournisseurs', type: 'error' });
    }
  };

  useEffect(() => {
    loadCategories();
    loadVilles();
    loadAmbulances();
    loadMedecins();
    loadInfirmiers();
    loadAmbulanciersList();
    loadFournisseurs();
    loadCharges();
  }, []);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-filter-dropdown]')) {
        setShowCategoryFilter(false);
        setShowTypeFilter(false);
        setShowVilleFilter(false);
        setShowPaidFilter(false);
        setShowFournisseurFilter(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const openAddModal = () => {
    setEditChargeItem(null);
    setForm({
      label: '', categoryId: '', villeId: '', ambulanceId: '', medecinId: '', staffType: '', infirmierId: '', ambulancierId: '', fournisseurId: '', type: 'variable', priceType: 'monthly', unitPrice: '', periodCount: '', startDate: '', endDate: '', amount: '', variableDate: '', notes: '', invoicePeriod: ''
    });
    setShowModal(true);
  };

  const openEditModal = (charge) => {
    setEditChargeItem(charge);
    setForm({
      label: charge.label || '',
      categoryId: charge.categoryId || '',
      villeId: charge.villeId || '',
      ambulanceId: charge.ambulanceId || '',
      medecinId: charge.medecinId || '',
      fournisseurId: charge.fournisseurId || '',
      type: charge.type || 'recurring',
      priceType: charge.priceType || 'monthly',
      unitPrice: charge.unitPrice || '',
      periodCount: charge.periodCount || '',
      startDate: toYMD(charge.startDate),
      endDate: toYMD(charge.endDate),
      amount: charge.amount || '',
      variableDate: toYMD(charge.variableDate),
      notes: charge.notes || '',
      invoicePeriod: charge.invoicePeriod || ''
    });
    setShowModal(true);
  };

  // Calcul automatique de endDate en fonction de startDate, periodCount et priceType
  useEffect(() => {
    if (form.type !== 'recurring') return;
    const pc = Number(form.periodCount);
    if (!form.startDate || !pc || pc <= 0 || !form.priceType) return;
    const d = new Date(form.startDate);
    if (form.priceType === 'monthly') {
      d.setMonth(d.getMonth() + (pc - 1));
    } else if (form.priceType === 'yearly') {
      d.setFullYear(d.getFullYear() + (pc - 1));
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const computed = `${y}-${m}-${day}`;
    if (computed !== form.endDate) {
      setForm(prev => ({ ...prev, endDate: computed }));
    }
  }, [form.type, form.startDate, form.periodCount, form.priceType]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const selectedCategory = categories.find(c => String(c.id) === String(form.categoryId));
      const categoryName = (selectedCategory?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const isMasseSalariale = categoryName.includes('masse') && categoryName.includes('salariale');
      let combinedNotes = form.notes || '';
      if (isMasseSalariale) {
        let staffLabel = '';
        if (form.staffType === 'infirmier') {
          const inf = infirmiers.find(i => String(i.id) === String(form.infirmierId));
          const infName = inf ? (inf.nom || inf.name || '') : '';
          staffLabel = `Infirmier: ${infName || form.infirmierId || ''}`;
        } else if (form.staffType === 'ambulancier') {
          const amb = ambulanciers.find(a => String(a.id) === String(form.ambulancierId));
          const ambName = amb ? (amb.name || '') : '';
          staffLabel = `Ambulancier: ${ambName || form.ambulancierId || ''}`;
        }
        const tag = staffLabel ? `[Masse salariale: ${staffLabel}]` : '[Masse salariale]';
        combinedNotes = combinedNotes ? `${combinedNotes} ${tag}` : tag;
      }
      const selectedFournisseur = fournisseurs.find(f => String(f.id) === String(form.fournisseurId));
      const fournisseurName = selectedFournisseur?.name || form.label || '';
      const payload = form.type === 'recurring'
        ? {
            label: fournisseurName,
            fournisseurId: form.fournisseurId || null,
            categoryId: form.categoryId || null,
            ambulanceId: form.ambulanceId || null,
            villeId: form.villeId || null,
            medecinId: form.medecinId || null,
            type: 'recurring',
            priceType: form.priceType,
            unitPrice: parseFloat(form.unitPrice || '0') || 0,
            periodCount: parseInt(form.periodCount || '0', 10) || 0,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            notes: combinedNotes || null,
            valide: 1,
            invoicePeriod: form.invoicePeriod || null
          }
        : {
            label: fournisseurName,
            fournisseurId: form.fournisseurId || null,
            categoryId: form.categoryId || null,
            ambulanceId: form.ambulanceId || null,
            villeId: form.villeId || null,
            medecinId: form.medecinId || null,
            type: 'variable',
            amount: parseFloat(form.amount || '0') || 0,
            variableDate: form.variableDate || null,
            notes: combinedNotes || null,
            valide: 1,
            invoicePeriod: form.invoicePeriod || null
          };

      if (editChargeItem) {
        await updateCharge(editChargeItem.id, payload);
        setNotification({ message: 'Charge modifiée avec succès', type: 'success' });
      } else {
        await createCharge(payload);
        setNotification({ message: 'Charge ajoutée avec succès', type: 'success' });
      }
      setShowModal(false);
      setEditChargeItem(null);
      loadCharges();
    } catch (e) {
      setNotification({ message: e?.response?.data?.message || "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCharge(id);
      setNotification({ message: 'Charge supprimée', type: 'success' });
      setDeleteId(null);
      loadCharges();
    } catch (e) {
      setNotification({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const handleValidate = async (id) => {
    try {
      await validateCharge(id);
      setNotification({ message: 'Charge validée', type: 'success' });
      loadCharges();
    } catch (e) {
      setNotification({ message: 'Erreur lors de la validation', type: 'error' });
    }
  };

  const handleInvalidate = async (id) => {
    try {
      await invalidateCharge(id);
      setNotification({ message: 'Charge passée en non valide', type: 'success' });
      loadCharges();
    } catch (e) {
      setNotification({ message: 'Erreur lors du passage en non valide', type: 'error' });
    }
  };

  const openInstallments = async (charge) => {
    try {
      const [detail, inst] = await Promise.all([
        fetchChargeById(charge.id),
        fetchChargeInstallments(charge.id)
      ]);
      setSelectedCharge(detail.data);
      setInstallments(inst.data);
      setShowInstallmentsModal(true);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des échéances", type: 'error' });
    }
  };

  const handlePayInstallment = async (installmentId) => {
    try {
      await payChargeInstallment(installmentId);
      if (selectedCharge) {
        const inst = await fetchChargeInstallments(selectedCharge.id);
        setInstallments(inst.data);
      }
    } catch (e) {
      setNotification({ message: "Erreur lors de la mise à jour de l'échéance", type: 'error' });
    }
  };

  const handleUnpayInstallment = async (installmentId) => {
    try {
      await unpayChargeInstallment(installmentId);
      if (selectedCharge) {
        const inst = await fetchChargeInstallments(selectedCharge.id);
        setInstallments(inst.data);
      }
    } catch (e) {
      setNotification({ message: "Erreur lors de la mise à jour de l'échéance", type: 'error' });
    }
  };

  const filteredCharges = useMemo(() => {
    const s = (search || '').toLowerCase();
    return charges
      .filter(c => {
        if (filterCategoryIds.length === 0) return true;
        return filterCategoryIds.includes(String(c.categoryId));
      })
      .filter(c => {
        if (filterTypes.length === 0) return true;
        return filterTypes.includes(c.type);
      })
      .filter(c => {
        if (filterVilleIds.length === 0) return true;
        return filterVilleIds.includes(String(c.villeId));
      })
      .filter(c => {
        if (filterFournisseurIds.length === 0) return true;
        return filterFournisseurIds.includes(String(c.fournisseurId));
      })
      .filter(c => {
        if (filterPaidStatuses.length === 0) return true;
        const total = Number(c.totalInstallments || 0);
        const paid = Number(c.paidInstallments || 0);
        const isPaid = total > 0 && paid >= total;
        return filterPaidStatuses.some(status => 
          status === 'paid' ? isPaid : !isPaid
        );
      })
      .filter(c => {
        if (!s) return true;
        const searchableText = [
          c.id,
          c.label,
          c.fournisseurName,
          c.categoryName,
          c.ambulancePlate,
          c.villeName,
          c.type,
          c.priceType,
          c.unitPrice,
          c.periodCount,
          c.amount,
          c.notes,
          c.invoicePeriod,
          formatFr(c.startDate),
          formatFr(c.endDate),
          formatFr(c.variableDate)
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(s);
      });
  }, [charges, search, filterCategoryIds, filterTypes, filterVilleIds, filterFournisseurIds, filterPaidStatuses]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' , width:'100%'}}>
                <h2 style={{ fontSize: '1.25rem', color: '#2c3e50', margin: 0, whiteSpace:'nowrap' }}>💸 Liste des charges
                  <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#64748b', background:'#eef2f7', padding: '1px 6px', borderRadius: 999 }}>{filteredCharges.length}</span>
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flex:1, flexWrap:'wrap' }}>
                  <div style={{
                    position: 'relative',
                    background:'#f8fafc',
                    border:'1px solid #e3e6f0',
                    borderRadius:6,
                    height: 34,
                    width: 220
                  }}>
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        paddingLeft: '2rem',
                        border: 'none',
                        outline:'none',
                        background:'transparent',
                        width:'100%',
                        fontSize: '0.9rem'
                      }}
                    />
                    <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14 }}>🔍</span>
                  </div>

                  {/* Filtre Catégories */}
                  <div style={{ position: 'relative', minWidth: 200 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterCategoryIds.length > 0 ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 200,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterCategoryIds.length > 0 ? 600 : 400,
                        color: filterCategoryIds.length > 0 ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Catégories {filterCategoryIds.length > 0 ? `(${filterCategoryIds.length})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showCategoryFilter && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 38, 
                        left: 0, 
                        background: 'white', 
                        border: '1px solid #e3e6f0', 
                        borderRadius: 8, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        zIndex: 100,
                        minWidth: 280,
                        maxHeight: 300,
                        overflowY: 'auto'
                      }}>
                        <div style={{ padding: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterCategoryIds.length === 0}
                              onChange={() => setFilterCategoryIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Toutes</span>
                          </label>
                          {categories.map(c => (
                            <label key={c.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={filterCategoryIds.includes(String(c.id))}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFilterCategoryIds([...filterCategoryIds, String(c.id)]);
                                  } else {
                                    setFilterCategoryIds(filterCategoryIds.filter(id => id !== String(c.id)));
                                  }
                                }}
                                style={{ marginRight: 8 }}
                              />
                              {c.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Fournisseurs */}
                  <div style={{ position: 'relative', minWidth: 160 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowFournisseurFilter(!showFournisseurFilter)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterFournisseurIds.length > 0 ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 160,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterFournisseurIds.length > 0 ? 600 : 400,
                        color: filterFournisseurIds.length > 0 ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Fournisseurs {filterFournisseurIds.length > 0 ? `(${filterFournisseurIds.length})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showFournisseurFilter && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 38, 
                        left: 0, 
                        background: 'white', 
                        border: '1px solid #e3e6f0', 
                        borderRadius: 8, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        zIndex: 100,
                        minWidth: 200,
                        maxHeight: 300,
                        overflowY: 'auto'
                      }}>
                        <div style={{ padding: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterFournisseurIds.length === 0}
                              onChange={() => setFilterFournisseurIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Tous</span>
                          </label>
                          {fournisseurs.map(f => (
                            <label key={f.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={filterFournisseurIds.includes(String(f.id))}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFilterFournisseurIds([...filterFournisseurIds, String(f.id)]);
                                  } else {
                                    setFilterFournisseurIds(filterFournisseurIds.filter(id => id !== String(f.id)));
                                  }
                                }}
                                style={{ marginRight: 8 }}
                              />
                              {f.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Villes */}
                  <div style={{ position: 'relative', minWidth: 140 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowVilleFilter(!showVilleFilter)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterVilleIds.length > 0 ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 140,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterVilleIds.length > 0 ? 600 : 400,
                        color: filterVilleIds.length > 0 ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Villes {filterVilleIds.length > 0 ? `(${filterVilleIds.length})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showVilleFilter && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 38, 
                        left: 0, 
                        background: 'white', 
                        border: '1px solid #e3e6f0', 
                        borderRadius: 8, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        zIndex: 100,
                        minWidth: 180,
                        maxHeight: 300,
                        overflowY: 'auto'
                      }}>
                        <div style={{ padding: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterVilleIds.length === 0}
                              onChange={() => setFilterVilleIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Toutes</span>
                          </label>
                          {villes.map(v => (
                            <label key={v.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={filterVilleIds.includes(String(v.id))}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFilterVilleIds([...filterVilleIds, String(v.id)]);
                                  } else {
                                    setFilterVilleIds(filterVilleIds.filter(id => id !== String(v.id)));
                                  }
                                }}
                                style={{ marginRight: 8 }}
                              />
                              {v.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Types */}
                  <div style={{ position: 'relative', minWidth: 130 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowTypeFilter(!showTypeFilter)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterTypes.length > 0 ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 130,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterTypes.length > 0 ? 600 : 400,
                        color: filterTypes.length > 0 ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Types {filterTypes.length > 0 ? `(${filterTypes.length})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showTypeFilter && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 38, 
                        left: 0, 
                        background: 'white', 
                        border: '1px solid #e3e6f0', 
                        borderRadius: 8, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        zIndex: 100,
                        minWidth: 160
                      }}>
                        <div style={{ padding: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterTypes.length === 0}
                              onChange={() => setFilterTypes([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Tous</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={filterTypes.includes('recurring')}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFilterTypes([...filterTypes, 'recurring']);
                                } else {
                                  setFilterTypes(filterTypes.filter(t => t !== 'recurring'));
                                }
                              }}
                              style={{ marginRight: 8 }}
                            />
                            Récurrente
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={filterTypes.includes('variable')}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFilterTypes([...filterTypes, 'variable']);
                                } else {
                                  setFilterTypes(filterTypes.filter(t => t !== 'variable'));
                                }
                              }}
                              style={{ marginRight: 8 }}
                            />
                            Variable
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Statuts */}
                  <div style={{ position: 'relative', minWidth: 130 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowPaidFilter(!showPaidFilter)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterPaidStatuses.length > 0 ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 130,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterPaidStatuses.length > 0 ? 600 : 400,
                        color: filterPaidStatuses.length > 0 ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Statuts {filterPaidStatuses.length > 0 ? `(${filterPaidStatuses.length})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showPaidFilter && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 38, 
                        left: 0, 
                        background: 'white', 
                        border: '1px solid #e3e6f0', 
                        borderRadius: 8, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        zIndex: 100,
                        minWidth: 160
                      }}>
                        <div style={{ padding: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterPaidStatuses.length === 0}
                              onChange={() => setFilterPaidStatuses([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Tous</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={filterPaidStatuses.includes('paid')}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFilterPaidStatuses([...filterPaidStatuses, 'paid']);
                                } else {
                                  setFilterPaidStatuses(filterPaidStatuses.filter(s => s !== 'paid'));
                                }
                              }}
                              style={{ marginRight: 8 }}
                            />
                            Payée
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={filterPaidStatuses.includes('unpaid')}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFilterPaidStatuses([...filterPaidStatuses, 'unpaid']);
                                } else {
                                  setFilterPaidStatuses(filterPaidStatuses.filter(s => s !== 'unpaid'));
                                }
                              }}
                              style={{ marginRight: 8 }}
                            />
                            Non payée
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                
                </div>
                <button
                    onClick={openAddModal}
                    style={{
                      background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                      color: 'white',
                      border: 'none',
                      width: '120px',
                      padding: '0.45rem 0.9rem',
                      height: 34,
                      borderRadius: 6,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(25, 118, 210, 0.1)',
                      transition: 'all 0.2s ease',
                      marginLeft: 'auto'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <span style={{ fontSize: '1rem' }}>＋</span>
                    Ajouter
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
                      <th>Fournisseur</th>
                      <th>Catégorie</th>
                      <th>Ambulance</th>
                      <th>Ville</th>
                      <th>Type</th>
                      <th>Statut</th>
                      <th>Détails</th>
                      <th>Dates</th>
                      <th>Mois facture</th>
                      <th>Valide</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCharges.length === 0 ? (
                      <tr><td colSpan="12">Aucune charge trouvée.</td></tr>
                    ) : filteredCharges.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.fournisseurName || c.label}</td>
                        <td>{c.categoryName || '-'}</td>
                        <td>{c.ambulancePlate || '-'}</td>
                        <td>{c.villeName || '-'}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: c.type === 'recurring' ? '#f1f8e9' : '#fff3e0', border: '1px solid #ddd' }}>
                            {c.type === 'recurring' ? 'Récurrente' : 'Variable'}
                          </span>
                        </td>
                        <td>
                          {(function(){
                            const total = Number(c.totalInstallments || 0);
                            const paid = Number(c.paidInstallments || 0);
                            const isPaid = total > 0 && paid >= total;
                            return isPaid
                              ? <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background:'#e8f5e9', border:'1px solid #ddd' }}>Payée</span>
                              : <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background:'#fff3e0', border:'1px solid #ddd' }}>Non payée</span>;
                          })()}
                        </td>
                        <td>
                          {c.type === 'recurring' ? (
                            <span>{c.priceType === 'monthly' ? 'Mensuel' : 'Annuel'} • {c.unitPrice} × {c.periodCount}</span>
                          ) : (
                            <span>{c.amount}</span>
                          )}
                        </td>
                        <td>
                          {c.type === 'recurring' ? (
                            <span>{formatFr(c.startDate) || '-'} → {formatFr(c.endDate) || '-'}</span>
                          ) : (
                            <span>{formatFr(c.variableDate) || '-'}</span>
                          )}
                        </td>
                        <td>{c.invoicePeriod || '-'}</td>
                        <td>
                          {c.valide === 1 || c.valide === true ? (
                            <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, background:'#e8f5e9', color:'#388e3c', border:'1px solid #b2dfdb', fontWeight:600 }}>Valide</span>
                          ) : (
                            <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, background:'#fff3e0', color:'#f57c00', border:'1px solid #ffe0b2', fontWeight:600 }}>Non valide</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            {(c.valide === 1 || c.valide === true) ? (
                              <button
                                onClick={() => handleInvalidate(c.id)}
                                title="Marquer non valide"
                                style={{
                                  width: 32,
                                  height: 32,
                                  minWidth: 32,
                                  minHeight: 32,
                                  boxSizing: 'border-box',
                                  lineHeight: '32px',
                                  padding: 0,
                                  borderRadius: '50%',
                                  background: '#fff3e0',
                                  color: '#f57c00',
                                  border: '1px solid #ffe0b2',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >🚫</button>
                            ) : (
                              <button
                                onClick={() => handleValidate(c.id)}
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
                                  background: '#e9f7ef',
                                  color: '#1b8f3a',
                                  border: '1px solid #a7e3bd',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >✔️</button>
                            )}
                            <button
                              onClick={() => openEditModal(c)}
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
                                border: '1px solid #90caf9',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                              }}
                            >✏️</button>
                            {(c.type === 'recurring' || c.type === 'variable') && (
                              <button
                                onClick={() => openInstallments(c)}
                                title="Échéances"
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
                                  border: '1px solid #a7e3bd',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                  fontWeight: 600,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                                }}
                              >📅</button>
                            )}
                            <button
                              onClick={() => setDeleteId(c.id)}
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
                                border: '1px solid #f4b4b4',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 600,
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
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

        {/* Modale ajout/modif charge */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '100vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', borderBottom: '2px solid #f1f3f4', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{editChargeItem ? '✏️ Modifier la charge' : '➕ Ajouter une nouvelle charge'}</h2>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Fournisseur *</label>
                      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                        <input
                          type="text"
                          placeholder="Rechercher un fournisseur..."
                          value={fournisseurSearch}
                          onChange={e => setFournisseurSearch(e.target.value)}
                          style={{ padding:'0.6rem 0.8rem', border:'1.5px solid #e3e6f0', borderRadius:8 }}
                        />
                        <select value={form.fournisseurId || ''} onChange={e => setForm({ ...form, fournisseurId: e.target.value })} required>
                          <option value="">--</option>
                          {fournisseurs
                            .filter(f => (f.name || '').toLowerCase().includes(fournisseurSearch.toLowerCase()))
                            .map(f => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Catégorie</label>
                      <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                        <option value="">--</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Ville</label>
                      <select value={form.villeId} onChange={e => setForm({ ...form, villeId: e.target.value })}>
                        <option value="">--</option>
                        {villes.map(v => (
                          <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                      </select>
                    </div>
                    {(function(){
                      const selectedCategory = categories.find(c => String(c.id) === String(form.categoryId));
                      const rawName = (selectedCategory?.name || '').toLowerCase();
                      const catName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const isMasseSalariale = catName.includes('masse') && catName.includes('salariale');
                      if (!isMasseSalariale) return null;
                      const selectedVilleName = (villes.find(v => String(v.id) === String(form.villeId))?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const filteredInfirmiers = infirmiers.filter(i => {
                        const iv = String(i.ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        return !selectedVilleName || iv === selectedVilleName;
                      });
                      return (
                        <div style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px dashed #e2e8f0', borderRadius: 8 }}>
                          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                            <label>Type de personnel</label>
                            <select value={form.staffType || ''} onChange={e => setForm({ ...form, staffType: e.target.value })}>
                              <option value="">--</option>
                              <option value="infirmier">Infirmier</option>
                              <option value="ambulancier">Ambulancier</option>
                            </select>
                          </div>
                          {form.staffType === 'infirmier' && (
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label>Infirmier</label>
                              <select value={form.infirmierId || ''} onChange={e => setForm({ ...form, infirmierId: e.target.value })}>
                                <option value="">--</option>
                                {filteredInfirmiers.map(i => (
                                  <option key={i.id} value={i.id}>{i.nom || i.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                          {form.staffType === 'ambulancier' && (
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label>Ambulancier</label>
                              <select value={form.ambulancierId || ''} onChange={e => setForm({ ...form, ambulancierId: e.target.value })}>
                                <option value="">--</option>
                                {ambulanciers
                                  .filter(a => {
                                    const av = String(a.ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                    const selectedVilleName = (villes.find(v => String(v.id) === String(form.villeId))?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                    return !selectedVilleName || av === selectedVilleName;
                                  })
                                  .map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {(function(){
                      const selectedCategory = categories.find(c => String(c.id) === String(form.categoryId));
                      const rawName = (selectedCategory?.name || '').toLowerCase();
                      const catName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const isHonorairesMedecin = catName.includes('honoraires') && catName.includes('medecin');
                      if (!isHonorairesMedecin) return null;
                      const selectedVilleName = (villes.find(v => String(v.id) === String(form.villeId))?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const filteredMedecins = medecins.filter(m => {
                        const mv = String(m.ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        return !selectedVilleName || mv === selectedVilleName;
                      });
                      return (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Médecin</label>
                          <select value={form.medecinId || ''} onChange={e => setForm({ ...form, medecinId: e.target.value })}>
                            <option value="">--</option>
                            {filteredMedecins.map(m => (
                              <option key={m.id} value={m.id}>{m.name} {m.specialty ? `— ${m.specialty}` : ''}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                    {(function(){
                      const selectedCategory = categories.find(c => String(c.id) === String(form.categoryId));
                      const rawName = (selectedCategory?.name || '').toLowerCase();
                      const catName = rawName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const triggers = ['carburant','autoroute','autoroutes','entretien','assurance vehicule','vignette','vignettes','traite vehicule'];
                      const needsAmbulance = triggers.some(t => catName.includes(t));
                      if (!needsAmbulance) return null;
                      return (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Ambulance</label>
                          <select value={form.ambulanceId || ''} onChange={e => setForm({ ...form, ambulanceId: e.target.value })}>
                            <option value="">--</option>
                            {ambulances
                              .filter(a => {
                                const selectedVilleName = (villes.find(v => String(v.id) === String(form.villeId))?.name || '')
                                  .toLowerCase()
                                  .normalize('NFD')
                                  .replace(/[\u0300-\u036f]/g, '');
                                const av = String(a.villeActivite || '')
                                  .toLowerCase()
                                  .normalize('NFD')
                                  .replace(/[\u0300-\u036f]/g, '');
                                return !selectedVilleName || av === selectedVilleName;
                              })
                              .map(a => (
                                <option key={a.id} value={a.id}>{a.numberPlate}</option>
                              ))}
                          </select>
                        </div>
                      );
                    })()}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Type</label>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      <option value="variable">Variable</option>
                        <option value="recurring">Récurrente</option>
                        
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Notes</label>
                      <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    {form.type === 'recurring' ? (
                      <>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Périodicité</label>
                          <select value={form.priceType} onChange={e => setForm({ ...form, priceType: e.target.value })}>
                            <option value="monthly">Mensuel</option>
                            <option value="yearly">Annuel</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Montant par période</label>
                          <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Nombre de périodes</label>
                          <input type="number" value={form.periodCount} onChange={e => setForm({ ...form, periodCount: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Début</label>
                          <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Fin (optionnel)</label>
                          <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Montant</label>
                          <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label>Date</label>
                          <input type="date" value={form.variableDate} onChange={e => setForm({ ...form, variableDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>Mois facture</label>
                          <input type="month" value={form.invoicePeriod} onChange={e => setForm({ ...form, invoicePeriod: e.target.value })} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '0.7rem 1.2rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                  <button type="submit" className="submit-btn" style={{ background: '#1976d2', color: 'white' }}>{editChargeItem ? '💾 Enregistrer' : '➕ Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale échéances */}
        {showInstallmentsModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', borderBottom: '2px solid #f1f3f4', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>📅 Échéances — {selectedCharge?.fournisseurName || selectedCharge?.label}</h2>
              </div>
              <div style={{ overflowX: 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '14px', width: '30%' }}>Date d'échéance</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '14px', width: '25%' }}>Montant</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '14px', width: '20%' }}>Statut</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '14px', width: '25%' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.length === 0 ? (
                      <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Aucune échéance.</td></tr>
                    ) : installments.map(i => (
                      <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap' }}>
                          📅 {formatFr(i.dueDate)}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                          {Number(i.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {i.isPaid ? (
                            <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 13, background: '#d1fae5', color: '#065f46', fontWeight: 600, whiteSpace: 'nowrap' }}>✓ Payée</span>
                          ) : (
                            <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 13, background: '#fee2e2', color: '#991b1b', fontWeight: 600, whiteSpace: 'nowrap' }}>⏳ À payer</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {!i.isPaid ? (
                            <button 
                              onClick={() => handlePayInstallment(i.id)} 
                              style={{ 
                                background: '#10b981', 
                                color: 'white', 
                                border: 'none', 
                                padding: '8px 16px', 
                                borderRadius: 8, 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#059669'}
                              onMouseOut={e => e.currentTarget.style.background = '#10b981'}
                            >
                              ✓ Marquer payée
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUnpayInstallment(i.id)} 
                              style={{ 
                                background: '#ef4444', 
                                color: 'white', 
                                border: 'none', 
                                padding: '8px 16px', 
                                borderRadius: 8, 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                fontSize: '13px',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                              onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                            >
                              ✗ Marquer non payée
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
                <button 
                  onClick={() => setShowInstallmentsModal(false)} 
                  style={{ 
                    background: '#e2e8f0', 
                    color: '#4a5568', 
                    border: 'none', 
                    padding: '10px 24px', 
                    borderRadius: 8, 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#cbd5e1'}
                  onMouseOut={e => e.currentTarget.style.background = '#e2e8f0'}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation suppression */}
        {deleteId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
              <h3>Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer cette charge ?</p>
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

export default Charges;


