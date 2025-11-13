import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  const ITEMS_PER_PAGE = 100;
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
  const [filterAmbulanceIds, setFilterAmbulanceIds] = useState([]);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterValide, setFilterValide] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showVilleFilter, setShowVilleFilter] = useState(false);
  const [showPaidFilter, setShowPaidFilter] = useState(false);
  const [showFournisseurFilter, setShowFournisseurFilter] = useState(false);
  const [showAmbulanceFilter, setShowAmbulanceFilter] = useState(false);
  const [showValideFilter, setShowValideFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
  const [ambulanceSearch, setAmbulanceSearch] = useState('');
  const [categoryFilterSearch, setCategoryFilterSearch] = useState('');
  const [fournisseurFilterSearch, setFournisseurFilterSearch] = useState('');
  const [villeFilterSearch, setVilleFilterSearch] = useState('');
  const [typeFilterSearch, setTypeFilterSearch] = useState('');
  const [statusFilterSearch, setStatusFilterSearch] = useState('');
  const [valideFilterSearch, setValideFilterSearch] = useState('');

  const SearchableSelect = ({
    value,
    onChange,
    options,
    placeholder = '--',
    disabled = false,
    renderLabel,
    allowClear = true,
    menuMaxHeight = 260
  }) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      const handleClickOutside = (event) => {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setOpen(false);
          setSearchTerm('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    useEffect(() => {
      if (!open) {
        setSearchTerm('');
      }
    }, [open]);

    const getOptionLabel = (option) => {
      const resolved = renderLabel ? renderLabel(option) : option.label;
      return String(resolved ?? '');
    };

    const normalizedValue = value == null ? '' : String(value);
    const selectedOption = options.find(option => String(option.value) === normalizedValue);
    const filteredOptions = options.filter(option =>
      getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (newValue) => {
      onChange(newValue);
      setOpen(false);
    };

    return (
      <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
        <button
          type="button"
          onClick={() => !disabled && setOpen(prev => !prev)}
          style={{
            width: '100%',
            padding: '0.6rem 0.8rem',
            borderRadius: 8,
            border: '1.5px solid #e3e6f0',
            textAlign: 'left',
            background: disabled ? '#f5f5f5' : 'white',
            color: selectedOption ? '#1f2937' : '#64748b',
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            fontSize: '0.95rem',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}
          disabled={disabled}
        >
          <span>{selectedOption ? getOptionLabel(selectedOption) : placeholder}</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>▼</span>
        </button>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'white',
              boxShadow: '0 12px 30px rgba(15,23,42,0.14)',
              borderRadius: 10,
              border: '1px solid #dbe4f0',
              zIndex: 3000,
              padding: '0.6rem 0.6rem 0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}
          >
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                autoFocus
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  paddingLeft: '2rem',
                  borderRadius: 8,
                  border: '1px solid #d0d7de',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <span style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '0.85rem'
              }}>🔍</span>
            </div>
            <div style={{ maxHeight: menuMaxHeight, overflowY: 'auto', borderRadius: 6 }}>
              {allowClear && (
                <div
                  onClick={() => handleSelect('')}
                  style={{
                    padding: '0.45rem 0.6rem',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    background: normalizedValue === '' ? '#e3f2fd' : 'transparent',
                    fontWeight: normalizedValue === '' ? 600 : 400,
                    marginBottom: 4
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = normalizedValue === '' ? '#e3f2fd' : 'transparent'}
                >
                  -- Aucun --
                </div>
              )}
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '0.6rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                  Aucun résultat
                </div>
              ) : filteredOptions.map(option => {
                const label = getOptionLabel(option);
                const optionValue = String(option.value);
                const isActive = normalizedValue === optionValue;
                return (
                  <div
                    key={option.value ?? label}
                    onClick={() => handleSelect(optionValue)}
                    style={{
                      padding: '0.45rem 0.6rem',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      background: isActive ? '#e3f2fd' : 'transparent',
                      fontWeight: isActive ? 600 : 400
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={e => e.currentTarget.style.background = isActive ? '#e3f2fd' : 'transparent'}
                  >
                    {label || '—'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

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
        setShowAmbulanceFilter(false);
        setShowValideFilter(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    filterCategoryIds,
    filterTypes,
    filterVilleIds,
    filterPaidStatuses,
    filterFournisseurIds,
    filterAmbulanceIds,
    filterDateStart,
    filterDateEnd,
    filterValide
  ]);

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
        if (filterAmbulanceIds.length === 0) return true;
        return filterAmbulanceIds.includes(String(c.ambulanceId));
      })
      .filter(c => {
        if (!filterDateStart && !filterDateEnd) return true;
        
        const startDate = filterDateStart ? new Date(filterDateStart) : null;
        const endDate = filterDateEnd ? new Date(filterDateEnd) : null;
        
        // Pour les charges récurrentes, vérifier si elles chevauchent l'intervalle
        if (c.type === 'recurring') {
          const chargeStart = c.startDate ? new Date(c.startDate) : null;
          const chargeEnd = c.endDate ? new Date(c.endDate) : null;
          
          if (chargeStart && chargeEnd) {
            // Vérifier si l'intervalle de la charge chevauche l'intervalle de filtre
            // Les deux dates sont incluses
            if (startDate && endDate) {
              return (chargeStart <= endDate && chargeEnd >= startDate);
            } else if (startDate) {
              return chargeEnd >= startDate;
            } else if (endDate) {
              return chargeStart <= endDate;
            }
          } else if (chargeStart) {
            // Pas de date de fin, vérifier si startDate est dans l'intervalle
            if (startDate && endDate) {
              return chargeStart >= startDate && chargeStart <= endDate;
            } else if (startDate) {
              return chargeStart >= startDate;
            } else if (endDate) {
              return chargeStart <= endDate;
            }
          }
          return true;
        } else {
          // Pour les charges variables, vérifier si variableDate est dans l'intervalle
          const variableDate = c.variableDate ? new Date(c.variableDate) : null;
          if (!variableDate) return true;
          
          if (startDate && endDate) {
            return variableDate >= startDate && variableDate <= endDate;
          } else if (startDate) {
            return variableDate >= startDate;
          } else if (endDate) {
            return variableDate <= endDate;
          }
        }
        return true;
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
        if (!filterValide) return true;
        const isValide = c.valide === 1 || c.valide === true;
        if (filterValide === 'valid') return isValide;
        if (filterValide === 'invalid') return !isValide;
        return true;
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
  }, [charges, search, filterCategoryIds, filterTypes, filterVilleIds, filterFournisseurIds, filterAmbulanceIds, filterDateStart, filterDateEnd, filterPaidStatuses, filterValide]);

  const totalPages = Math.max(1, Math.ceil(filteredCharges.length / ITEMS_PER_PAGE) || 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredCharges.length, currentPage, totalPages]);

  const paginatedCharges = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCharges.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCharges, currentPage]);

  const pageStartIndex = filteredCharges.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const pageEndIndex = filteredCharges.length === 0 ? 0 : Math.min(filteredCharges.length, (currentPage - 1) * ITEMS_PER_PAGE + paginatedCharges.length);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredCharges.length / ITEMS_PER_PAGE) || 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredCharges.length, currentPage]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' , width:'100%'}}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '1.25rem', color: '#2c3e50', margin: 0, whiteSpace:'nowrap' }}>💸 Liste des charges</h2>
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
                    Total: {filteredCharges.length} {filteredCharges.length <= 1 ? 'charge' : 'charges'}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flex:1, flexWrap:'wrap', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexWrap:'wrap', flex:1 }}>
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
                          <div style={{ marginBottom: 8, position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Rechercher une catégorie..."
                              value={categoryFilterSearch}
                              onChange={e => setCategoryFilterSearch(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.6rem',
                                paddingLeft: '2rem',
                                borderRadius: 6,
                                border: '1px solid #e3e6f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = '#1976d2'}
                              onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                            />
                            <span style={{
                              position: 'absolute',
                              left: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              pointerEvents: 'none'
                            }}>🔍</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterCategoryIds.length === 0}
                              onChange={() => setFilterCategoryIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Toutes</span>
                          </label>
                          {categories
                            .filter(c => (c.name || '').toLowerCase().includes(categoryFilterSearch.toLowerCase()))
                            .map(c => (
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
                          <div style={{ marginBottom: 8, position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Rechercher un fournisseur..."
                              value={fournisseurFilterSearch}
                              onChange={e => setFournisseurFilterSearch(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.6rem',
                                paddingLeft: '2rem',
                                borderRadius: 6,
                                border: '1px solid #e3e6f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = '#1976d2'}
                              onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                            />
                            <span style={{
                              position: 'absolute',
                              left: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              pointerEvents: 'none'
                            }}>🔍</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterFournisseurIds.length === 0}
                              onChange={() => setFilterFournisseurIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Tous</span>
                          </label>
                          {fournisseurs
                            .filter(f => (f.name || '').toLowerCase().includes(fournisseurFilterSearch.toLowerCase()))
                            .map(f => (
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
                          <div style={{ marginBottom: 8, position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Rechercher une ville..."
                              value={villeFilterSearch}
                              onChange={e => setVilleFilterSearch(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.6rem',
                                paddingLeft: '2rem',
                                borderRadius: 6,
                                border: '1px solid #e3e6f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = '#1976d2'}
                              onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                            />
                            <span style={{
                              position: 'absolute',
                              left: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              pointerEvents: 'none'
                            }}>🔍</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterVilleIds.length === 0}
                              onChange={() => setFilterVilleIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Toutes</span>
                          </label>
                          {villes
                            .filter(v => (v.name || '').toLowerCase().includes(villeFilterSearch.toLowerCase()))
                            .map(v => (
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
                          <div style={{ marginBottom: 8, position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Rechercher un type..."
                              value={typeFilterSearch}
                              onChange={e => setTypeFilterSearch(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.6rem',
                                paddingLeft: '2rem',
                                borderRadius: 6,
                                border: '1px solid #e3e6f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = '#1976d2'}
                              onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                            />
                            <span style={{
                              position: 'absolute',
                              left: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              pointerEvents: 'none'
                            }}>🔍</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterTypes.length === 0}
                              onChange={() => setFilterTypes([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Tous</span>
                          </label>
                          {[{ value: 'recurring', label: 'Récurrente' }, { value: 'variable', label: 'Variable' }]
                            .filter(option => option.label.toLowerCase().includes(typeFilterSearch.toLowerCase()))
                            .map(option => (
                              <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <input
                              type="checkbox"
                                checked={filterTypes.includes(option.value)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFilterTypes([...filterTypes, option.value]);
                                } else {
                                  setFilterTypes(filterTypes.filter(t => t !== option.value));
                                }
                              }}
                              style={{ marginRight: 8 }}
                            />
                            {option.label}
                          </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Ambulances */}
                  <div style={{ position: 'relative', minWidth: 160 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowAmbulanceFilter(!showAmbulanceFilter)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterAmbulanceIds.length > 0 ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 160,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterAmbulanceIds.length > 0 ? 600 : 400,
                        color: filterAmbulanceIds.length > 0 ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Ambulances {filterAmbulanceIds.length > 0 ? `(${filterAmbulanceIds.length})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showAmbulanceFilter && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 38, 
                        left: 0, 
                        background: 'white', 
                        border: '1px solid #e3e6f0', 
                        borderRadius: 8, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                        zIndex: 100,
                        minWidth: 240,
                        maxHeight: 350,
                        overflowY: 'auto'
                      }}>
                        <div style={{ padding: '8px' }}>
                          {/* Champ de recherche */}
                          <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e3e6f0' }}>
                            <input
                              type="text"
                              placeholder="Rechercher une ambulance..."
                              value={ambulanceSearch}
                              onChange={e => setAmbulanceSearch(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '0.4rem 0.6rem',
                                paddingLeft: '2rem',
                                borderRadius: 6,
                                border: '1px solid #e3e6f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = '#1976d2'}
                              onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                            />
                            <span style={{
                              position: 'absolute',
                              left: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              pointerEvents: 'none'
                            }}>🔍</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterAmbulanceIds.length === 0}
                              onChange={() => setFilterAmbulanceIds([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Toutes</span>
                          </label>
                          {ambulances
                            .filter(a => {
                              if (!ambulanceSearch) return true;
                              const searchLower = ambulanceSearch.toLowerCase();
                              return (a.numberPlate || '').toLowerCase().includes(searchLower) ||
                                     (a.number || '').toString().includes(searchLower);
                            })
                            .map(a => (
                            <label key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={filterAmbulanceIds.includes(String(a.id))}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFilterAmbulanceIds([...filterAmbulanceIds, String(a.id)]);
                                  } else {
                                    setFilterAmbulanceIds(filterAmbulanceIds.filter(id => id !== String(a.id)));
                                  }
                                }}
                                style={{ marginRight: 8 }}
                              />
                              {a.numberPlate || `Ambulance ${a.id}`}
                            </label>
                          ))}
                          {ambulances.filter(a => {
                            if (!ambulanceSearch) return false;
                            const searchLower = ambulanceSearch.toLowerCase();
                            return (a.numberPlate || '').toLowerCase().includes(searchLower) ||
                                   (a.number || '').toString().includes(searchLower);
                          }).length === 0 && ambulanceSearch && (
                            <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                              Aucune ambulance trouvée
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Dates */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 320 }}>
                    <div style={{ position: 'relative', width: '150px' }}>
                      <input
                        type="date"
                        placeholder="Date début"
                        value={filterDateStart}
                        onChange={e => setFilterDateStart(e.target.value)}
                        style={{
                          padding: '0.3rem 0.55rem',
                          height: 34,
                          borderRadius: 6,
                          border: '1px solid #e3e6f0',
                          background: filterDateStart ? '#e3f2fd' : '#fff',
                          fontSize: '0.9rem',
                          width: '100%',
                          cursor: 'pointer',
                          fontWeight: filterDateStart ? 600 : 400,
                          color: filterDateStart ? '#1976d2' : '#333'
                        }}
                      />
                      {filterDateStart && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '8px',
                          background: '#1976d2',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>Début</span>
                      )}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>→</span>
                    <div style={{ position: 'relative', width: '150px' }}>
                      <input
                        type="date"
                        placeholder="Date fin"
                        value={filterDateEnd}
                        onChange={e => setFilterDateEnd(e.target.value)}
                        style={{
                          padding: '0.3rem 0.55rem',
                          height: 34,
                          borderRadius: 6,
                          border: '1px solid #e3e6f0',
                          background: filterDateEnd ? '#e3f2fd' : '#fff',
                          fontSize: '0.9rem',
                          width: '100%',
                          cursor: 'pointer',
                          fontWeight: filterDateEnd ? 600 : 400,
                          color: filterDateEnd ? '#1976d2' : '#333'
                        }}
                      />
                      {filterDateEnd && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '8px',
                          background: '#1976d2',
                          color: 'white',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>Fin</span>
                      )}
                    </div>
                    {(filterDateStart || filterDateEnd) && (
                      <button
                        onClick={() => {
                          setFilterDateStart('');
                          setFilterDateEnd('');
                        }}
                        style={{
                          padding: '0.3rem 0.6rem',
                          height: 34,
                          borderRadius: 6,
                          border: '1px solid #e3e6f0',
                          background: '#fff',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Réinitialiser les dates"
                      >
                        ✕
                      </button>
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
                          <div style={{ marginBottom: 8, position: 'relative' }}>
                            <input
                              type="text"
                              placeholder="Rechercher un statut..."
                              value={statusFilterSearch}
                              onChange={e => setStatusFilterSearch(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '0.45rem 0.6rem',
                                paddingLeft: '2rem',
                                borderRadius: 6,
                                border: '1px solid #e3e6f0',
                                fontSize: '0.85rem',
                                outline: 'none',
                                boxSizing: 'border-box'
                              }}
                              onFocus={e => e.target.style.borderColor = '#1976d2'}
                              onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                            />
                            <span style={{
                              position: 'absolute',
                              left: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#94a3b8',
                              fontSize: '0.85rem',
                              pointerEvents: 'none'
                            }}>🔍</span>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}>
                            <input
                              type="checkbox"
                              checked={filterPaidStatuses.length === 0}
                              onChange={() => setFilterPaidStatuses([])}
                              style={{ marginRight: 8 }}
                            />
                            <span style={{ fontWeight: 600 }}>Tous</span>
                          </label>
                          {[{ value: 'paid', label: 'Payée' }, { value: 'unpaid', label: 'Non payée' }]
                            .filter(option => option.label.toLowerCase().includes(statusFilterSearch.toLowerCase()))
                            .map(option => (
                              <label key={option.value} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', cursor: 'pointer', borderRadius: 4, fontSize: '0.9rem' }}
                            onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={filterPaidStatuses.includes(option.value)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setFilterPaidStatuses([...filterPaidStatuses, option.value]);
                                } else {
                                  setFilterPaidStatuses(filterPaidStatuses.filter(s => s !== option.value));
                                }
                              }}
                              style={{ marginRight: 8 }}
                            />
                            {option.label}
                          </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filtre Validité */}
                  <div style={{ position: 'relative', minWidth: 130 }} data-filter-dropdown>
                    <button
                      onClick={() => setShowValideFilter(prev => !prev)}
                      style={{ 
                        padding: '0.3rem 0.55rem', 
                        height: 34, 
                        borderRadius: 6, 
                        border: '1px solid #e3e6f0', 
                        background: filterValide ? '#e3f2fd' : '#fff', 
                        fontSize: '0.9rem', 
                        minWidth: 130,
                        width: '100%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontWeight: filterValide ? 600 : 400,
                        color: filterValide ? '#1976d2' : '#333'
                      }}
                    >
                      <span>Validité {filterValide ? `(${filterValide === 'valid' ? 'valides' : 'non valides'})` : ''}</span>
                      <span>▼</span>
                    </button>
                    {showValideFilter && (
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
                          <div style={{ padding: '4px 0' }}>
                            <div style={{ padding: '0 12px 8px', position: 'relative' }}>
                              <input
                                type="text"
                                placeholder="Rechercher..."
                                value={valideFilterSearch}
                                onChange={e => setValideFilterSearch(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  width: '100%',
                                  padding: '0.45rem 0.6rem',
                                  paddingLeft: '2rem',
                                  borderRadius: 6,
                                  border: '1px solid #e3e6f0',
                                  fontSize: '0.85rem',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                                onFocus={e => e.target.style.borderColor = '#1976d2'}
                                onBlur={e => e.target.style.borderColor = '#e3e6f0'}
                              />
                              <span style={{
                                position: 'absolute',
                                left: 16,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#94a3b8',
                                fontSize: '0.85rem',
                                pointerEvents: 'none'
                              }}>🔍</span>
                            </div>
                          {[
                            { label: 'Toutes', value: '' },
                            { label: 'Validées', value: 'valid' },
                            { label: 'Non valides', value: 'invalid' }
                          ]
                            .filter(option => option.label.toLowerCase().includes(valideFilterSearch.toLowerCase()))
                            .map(option => {
                            const isActive = filterValide === option.value;
                            return (
                              <div
                                key={option.value || 'all'}
                                onClick={() => {
                                  setFilterValide(option.value);
                                  setShowValideFilter(false);
                                }}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem',
                                  background: isActive ? (option.value === 'valid' ? '#e8f5e9' : option.value === 'invalid' ? '#fff3e0' : '#f1f5f9') : 'transparent',
                                  color: '#1f2933'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = isActive ? e.currentTarget.style.background : '#f8fafc'}
                                onMouseOut={e => e.currentTarget.style.background = isActive ? (option.value === 'valid' ? '#e8f5e9' : option.value === 'invalid' ? '#fff3e0' : '#f1f5f9') : 'transparent'}
                              >
                                <span style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  border: '2px solid #1976d2',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: isActive ? '#1976d2' : 'transparent'
                                }}>
                                  {isActive && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', display: 'inline-block' }} />}
                                </span>
                                {option.label}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bouton Ajouter */}
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
                      marginLeft: 'auto',
                      flexShrink: 0
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <span style={{ fontSize: '1rem' }}>＋</span>
                    Ajouter
                  </button>
                  </div>
                </div>
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
                    ) : paginatedCharges.map(c => (
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
                {filteredCharges.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Affichage {pageStartIndex} – {pageEndIndex} sur {filteredCharges.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: currentPage === 1 ? '#f8fafc' : '#fff',
                          color: currentPage === 1 ? '#94a3b8' : '#1976d2',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        «
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: currentPage === 1 ? '#f8fafc' : '#fff',
                          color: currentPage === 1 ? '#94a3b8' : '#1976d2',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ‹
                      </button>
                      <span style={{ fontSize: '0.9rem', color: '#1f2937', fontWeight: 600 }}>
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: currentPage === totalPages ? '#f8fafc' : '#fff',
                          color: currentPage === totalPages ? '#94a3b8' : '#1976d2',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        ›
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          background: currentPage === totalPages ? '#f8fafc' : '#fff',
                          color: currentPage === totalPages ? '#94a3b8' : '#1976d2',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          fontWeight: 600
                        }}
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modale ajout/modif charge */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '950px', maxHeight: '100vh', height: '80%', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
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
              <SearchableSelect
                value={form.categoryId || ''}
                onChange={val => setForm({ ...form, categoryId: val })}
                options={categories.map(c => ({
                  value: String(c.id),
                  label: c.name || ''
                }))}
              />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Ville</label>
              <SearchableSelect
                value={form.villeId || ''}
                onChange={val => setForm({ ...form, villeId: val })}
                options={villes.map(v => ({
                  value: String(v.id),
                  label: v.name || ''
                }))}
              />
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
                          <SearchableSelect
                            value={form.infirmierId || ''}
                            onChange={val => setForm({ ...form, infirmierId: val })}
                            options={filteredInfirmiers.map(i => ({
                              value: String(i.id),
                              label: i.nom || i.name || ''
                            }))}
                          />
                            </div>
                          )}
                          {form.staffType === 'ambulancier' && (
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                              <label>Ambulancier</label>
                          <SearchableSelect
                            value={form.ambulancierId || ''}
                            onChange={val => setForm({ ...form, ambulancierId: val })}
                            options={ambulanciers
                              .filter(a => {
                                const av = String(a.ville || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                const selectedVilleName = (villes.find(v => String(v.id) === String(form.villeId))?.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                return !selectedVilleName || av === selectedVilleName;
                              })
                              .map(a => ({
                                value: String(a.id),
                                label: a.name || `Ambulancier ${a.id}`
                              }))}
                          />
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
                    <SearchableSelect
                      value={form.medecinId || ''}
                      onChange={val => setForm({ ...form, medecinId: val })}
                      options={filteredMedecins.map(m => ({
                        value: String(m.id),
                        label: `${m.name || ''}${m.specialty ? ` — ${m.specialty}` : ''}`
                      }))}
                    />
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
                    <SearchableSelect
                      value={form.ambulanceId || ''}
                      onChange={val => setForm({ ...form, ambulanceId: val })}
                      options={ambulances
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
                              .map(a => ({
                                value: String(a.id),
                                label: a.numberPlate || `Ambulance ${a.id}`
                              }))}
                    />
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


