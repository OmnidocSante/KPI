import React, { useEffect, useState, useMemo, useCallback } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import './Data.css';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

// Définition des onglets (navigator)
const TABS = [
  { key: 'ambulances', label: 'Ambulances' },
  { key: 'ca-global', label: 'CA Global' },
  { key: 'ca-global-bu', label: 'CA Global / BU' },
  { key: 'ca-produit-global', label: 'CA Produit Global' },
  { key: 'ca-produit-bu', label: 'CA Produit / BU' },
  { key: 'ca-bu-assurance', label: 'CA BU / ASSURANCE' },
  { key: 'ca-bu-btob', label: 'CA BU / BTOB' },
  { key: 'ca-bu-btoc', label: 'CA / BU / BTOC' },
  { key: 'ca-assurance-wafa-ima', label: 'CA WAFA IMA' },
  { key: 'ca-mai', label: 'CA MAI' },
  { key: 'ca-afa', label: 'CA AFA' },
  { key: 'marge-b2b', label: 'Marge B2B' },
  { key: 'ca-medecin', label: 'CA / Médecin' },
  { key: 'ca-infirmier', label: 'CA / Infirmier' },
];


const checkboxStyle = {
  marginRight: '8px',
};


const kpiCardStyle = {
  background: '#fff',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  padding: '2rem',
  minWidth: 220,
  minHeight: 120,
  maxWidth: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  margin: '1rem',
  boxSizing: 'border-box',
};

const filterRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const responsiveMainStyle = {
  flex: 1,
  background: '#f6f8fa',
  minHeight: '100vh',
  padding: '2rem',
  width: '100%',
  maxWidth: '100vw',
  minWidth: 0,
  boxSizing: 'border-box',
};

const responsiveContainerStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  justifyContent: 'flex-start',
  width: '100%',
  boxSizing: 'border-box',
};

const responsiveGraphContainer = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  marginTop: '2.5rem',
  overflowX: 'auto',
  justifyContent: 'flex-start',
  width: '100%',
  boxSizing: 'border-box',
};

// Media queries pour mobile (inline)
const mobileStyle = `
@media (max-width: 900px) {
  .kpi-card, .graph-block { min-width: 90vw !important; max-width: 100vw !important; margin: 0.5rem auto !important; }
  .main-responsive { padding: 0.5rem !important; }
}

/* Styles pour les onglets responsives */
.tabs-container {
  /* Reset des styles par défaut */
  all: unset;
  display: flex !important;
  gap: 8px;
  margin: 0 0 1rem 0;
  border-bottom: 1px solid #e5e7eb;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  -webkit-overflow-scrolling: touch;
}

.tabs-container::-webkit-scrollbar {
  height: 4px;
}

.tabs-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 2px;
}

.tabs-container::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

/* Styles spécifiques pour les boutons d'onglets */
.tabs-container button {
  /* Reset des styles par défaut */
  all: unset;
  padding: 10px 14px !important;
  border: none !important;
  background: transparent !important;
  cursor: pointer !important;
  font-weight: 600 !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  min-width: fit-content !important;
  width: auto !important;
  font-size: clamp(0.75rem, 1.5vw, 0.9rem) !important;
  text-align: center !important;
  box-sizing: border-box !important;
}

/* États des onglets */
.tabs-container button[style*="border-bottom: 3px solid #1976d2"] {
  color: #111827 !important;
}

.tabs-container button[style*="border-bottom: 3px solid transparent"] {
  color: #6b7280 !important;
}

@media (max-width: 768px) {
  .tabs-container {
    padding-bottom: 4px;
  }
  
  .tabs-container button {
    padding: 8px 12px !important;
    font-size: 0.8rem !important;
    min-width: fit-content !important;
  }
}

@media (max-width: 480px) {
  .tabs-container button {
    padding: 6px 8px !important;
    font-size: 0.7rem !important;
    min-width: fit-content !important;
  }
}

/* Optimisations supplémentaires pour très petits écrans */
@media (max-width: 360px) {
  .tabs-container button {
    padding: 4px 6px !important;
    font-size: 0.65rem !important;
  }
  
  .data-title {
    font-size: 1.3rem;
  }
  
  .data-filters {
    padding: 0.5rem;
  }
  
  .graph-block {
    padding: 0.5rem 0.3rem;
  }
}

/* Forcer les conteneurs de graphiques à une colonne sur mobile */
@media (max-width: 480px) {
  .mobile-single-column {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 0.5rem !important;
  }
  
  .mobile-single-column > div {
    width: 100% !important;
    max-width: 100% !important;
  }
}
`;

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Fonction pour obtenir la hauteur responsive des graphiques
function getResponsiveHeight(windowWidth = 1024) {
  if (windowWidth <= 480) return 300;
  if (windowWidth <= 768) return 350;
  return 400;
}

// Fonction utilitaire pour calculer le pourcentage
function getPercent(value, total) {
  return total === 0 ? '0%' : ((value / total) * 100).toFixed(1) + '%';
}

const Data = () => {
  const [globales, setGlobales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [villes, setVilles] = useState([]);
  const [produits, setProduits] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [clients, setClients] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [infirmiers, setInfirmiers] = useState([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Onglet actif
  const [activeTab, setActiveTab] = useState('ambulances');

  // Filtres par onglet
  const [tabFilters, setTabFilters] = useState(() => {
    const base = { start: '', end: '', villes: [], bu: [], produits: [], etats: [], ambulances: [], clients: [], statuts: [], typeMissions: [], zoneGeos: [], medecins: [], infirmiers: [] };
    return TABS.reduce((acc, t) => ({ ...acc, [t.key]: { ...base } }), {});
  });
  const currentFilters = tabFilters[activeTab] || { start: '', end: '', villes: [], bu: [], produits: [], etats: [], ambulances: [], clients: [], statuts: [], typeMissions: [], zoneGeos: [], medecins: [], infirmiers: [] };
  const updateCurrentFilters = (updater) => {
    setTabFilters(prev => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], ...updater }
    }));
  };
  const [openDropdown, setOpenDropdown] = useState(null);
  const [searchTerms, setSearchTerms] = useState({});

  // OPTIMISATION 1: Créer des Maps pour les recherches rapides
  const businessUnitsMap = useMemo(() => {
    return new Map(businessUnits.map(bu => [String(bu.id), bu]));
  }, [businessUnits]);

  const produitsMap = useMemo(() => {
    return new Map(produits.map(p => [String(p.id), p]));
  }, [produits]);

  const villesMap = useMemo(() => {
    return new Map(villes.map(v => [String(v.id), v]));
  }, [villes]);

  const clientsMap = useMemo(() => {
    return new Map(clients.map(c => [String(c.id), c]));
  }, [clients]);

  const ambulancesMap = useMemo(() => {
    return new Map(ambulances.map(a => [String(a.id), a]));
  }, [ambulances]);

  const medecinsMap = useMemo(() => {
    return new Map(medecins.map(m => [String(m.id), m]));
  }, [medecins]);

  const infirmiersMap = useMemo(() => {
    return new Map(infirmiers.map(i => [String(i.id), i]));
  }, [infirmiers]);

  // OPTIMISATION 2: Traitement efficace de tous les éléments (pas de pagination)
  // Utiliser filtered directement pour tous les calculs

  // Fonction pour ouvrir/fermer un dropdown et nettoyer la recherche
  const toggleDropdown = (dropdownName) => {
    if (openDropdown === dropdownName) {
      setOpenDropdown(null);
      // Nettoyer le terme de recherche quand on ferme le dropdown
      setSearchTerms(prev => ({ ...prev, [dropdownName]: '' }));
    } else {
      setOpenDropdown(dropdownName);
    }
  };

  // Ajout d'un useEffect pour gérer le clic en dehors du dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // Fonction pour gérer les sélections multiples
  const handleMultiSelect = (value, currentState, setState) => {
    if (currentState.includes(value)) {
      setState(currentState.filter(item => item !== value));
    } else {
      setState([...currentState, value]);
    }
  };

  // Hook pour détecter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [globalesRes, villesRes, produitsRes, buRes, clientsRes, ambulancesRes, medecinsRes, infirmiersRes] = await Promise.all([
          api.get('/globales'),
          api.get('/villes'),
          api.get('/produits'),
          api.get('/business-units'),
          api.get('/clients'),
          api.get('/ambulances'),
          api.get('/medecins'),
          api.get('/infirmiers'),
        ]);
        setGlobales(globalesRes.data);
        setVilles(villesRes.data);
        setProduits(produitsRes.data);
        setBusinessUnits(buRes.data);
        setClients(clientsRes.data);
        setAmbulances(ambulancesRes.data);
        setMedecins(medecinsRes.data);
        setInfirmiers(infirmiersRes.data);
      } catch (err) {
        setGlobales([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Application des filtres (par onglet) - Mémoisé pour éviter les recalculs
  const filtered = React.useMemo(() => {
    return globales.filter(g => {
      const dateValue = g.dateCreation ? String(g.dateCreation).slice(0, 10) : null; // YYYY-MM-DD
      if (currentFilters.start && dateValue && dateValue < currentFilters.start) return false;
      if (currentFilters.end && dateValue && dateValue > currentFilters.end) return false;
      if (currentFilters.villes.length > 0 && !currentFilters.villes.includes(String(g.villeId))) return false;
      if (currentFilters.bu.length > 0 && !currentFilters.bu.includes(String(g.businessUnitId))) return false;
      if (currentFilters.clients.length > 0 && !currentFilters.clients.includes(String(g.clientId))) return false;
      if (currentFilters.produits.length > 0 && !currentFilters.produits.includes(String(g.produitId))) return false;
      if (currentFilters.etats.length > 0 && !currentFilters.etats.includes(String(g.etatdePaiment))) return false;
      if (currentFilters.ambulances.length > 0 && !currentFilters.ambulances.includes(String(g.aumbulanceId))) return false;
      if (currentFilters.statuts && currentFilters.statuts.length > 0 && !currentFilters.statuts.includes(String(g.statutMission))) return false;
      if (currentFilters.typeMissions && currentFilters.typeMissions.length > 0 && !currentFilters.typeMissions.includes(String(g.typeMission))) return false;
      if (currentFilters.zoneGeos && currentFilters.zoneGeos.length > 0 && !currentFilters.zoneGeos.includes(String(g.zoneGeographique))) return false;
      if (currentFilters.medecins && currentFilters.medecins.length > 0 && !currentFilters.medecins.includes(String(g.medcienId))) return false;
      if (currentFilters.infirmiers && currentFilters.infirmiers.length > 0 && !currentFilters.infirmiers.includes(String(g.infermierId))) return false;
      return true;
    });
  }, [globales, currentFilters]);

  // OPTIMISATION 2: Traitement efficace de tous les éléments (pas de pagination)
  // Utiliser filtered directement pour tous les calculs

  // OPTIMISATION 3: Debouncing des filtres pour éviter les calculs excessifs
  const [debouncedFilters, setDebouncedFilters] = useState(currentFilters);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(currentFilters);
    }, 300); // 300ms de délai
    
    return () => clearTimeout(timer);
  }, [currentFilters]);

  // OPTIMISATION 4: Fonctions mémoisées pour les événements de graphiques
  const formatValue = useCallback((value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toLocaleString('fr-FR');
  }, []);

  // OPTIMISATION 5: Pré-calcul des agrégations pour éviter les recalculs
  const precomputedAggregations = useMemo(() => {
    const aggregations = {
      byBusinessUnit: new Map(),
      byProduit: new Map(),
      byVille: new Map(),
      byClient: new Map(),
      byAmbulance: new Map(),
      byMedecin: new Map(),
      byInfirmier: new Map(),
      byMonth: new Map(),
      totalCA: 0
    };

    for (const g of filtered) {
      const caTTC = Number(g.caTTC) || 0;
      aggregations.totalCA += caTTC;

      // Agrégation par Business Unit
      if (g.businessUnitId) {
        const buId = String(g.businessUnitId);
        const current = aggregations.byBusinessUnit.get(buId) || 0;
        aggregations.byBusinessUnit.set(buId, current + caTTC);
      }

      // Agrégation par Produit
      if (g.produitId) {
        const produitId = String(g.produitId);
        const current = aggregations.byProduit.get(produitId) || 0;
        aggregations.byProduit.set(produitId, current + caTTC);
      }

      // Agrégation par Ville
      if (g.villeId) {
        const villeId = String(g.villeId);
        const current = aggregations.byVille.get(villeId) || 0;
        aggregations.byVille.set(villeId, current + caTTC);
      }

      // Agrégation par Client
      if (g.clientId) {
        const clientId = String(g.clientId);
        const current = aggregations.byClient.get(clientId) || 0;
        aggregations.byClient.set(clientId, current + caTTC);
      }

      // Agrégation par Ambulance
      if (g.aumbulanceId) {
        const ambulanceId = String(g.aumbulanceId);
        const current = aggregations.byAmbulance.get(ambulanceId) || 0;
        aggregations.byAmbulance.set(ambulanceId, current + caTTC);
      }

      // Agrégation par Médecin
      if (g.medcienId) {
        const medecinId = String(g.medcienId);
        const current = aggregations.byMedecin.get(medecinId) || 0;
        aggregations.byMedecin.set(medecinId, current + caTTC);
      }

      // Agrégation par Infirmier
      if (g.infermierId) {
        const infirmierId = String(g.infermierId);
        const current = aggregations.byInfirmier.get(infirmierId) || 0;
        aggregations.byInfirmier.set(infirmierId, current + caTTC);
      }

      // Agrégation par Mois
      if (g.dateCreation) {
        const month = String(g.dateCreation).slice(0, 7);
        const current = aggregations.byMonth.get(month) || 0;
        aggregations.byMonth.set(month, current + caTTC);
      }
    }

    return aggregations;
  }, [filtered]);

  // Debug: afficher les informations de filtrage (désactivé en production)
  // console.log('Filtres actifs:', currentFilters);
  // console.log('Données totales:', globales.length);
  // console.log('Données filtrées:', filtered.length);
  // console.log('Onglet actif:', activeTab);

  // Mettre à jour le contenu central du donut chart quand les filtres changent
  useEffect(() => {
    // Mise à jour pour l'onglet CA Global / BU
    const centerElement = document.getElementById('donut-center');
    if (centerElement && activeTab === 'ca-global-bu' && !loading && filtered.length > 0) {
      const total = precomputedAggregations.totalCA; // Utiliser l'agrégation pré-calculée
      
      centerElement.innerHTML = `
        <tspan x="50%" dy="-0.5em" style="font-size: 1.2rem; font-weight: bold; fill: #333;">
          ${formatValue(total)}
        </tspan>
        <tspan x="50%" dy="1.2em" style="font-size: 1rem; fill: #666;">
          TOTAL
        </tspan>
      `;
    }

    // Mise à jour pour l'onglet CA Produit Global
    const produitCenterElement = document.getElementById('donut-produit-center');
    if (produitCenterElement && activeTab === 'ca-produit-global' && !loading && filtered.length > 0) {
      const total = precomputedAggregations.totalCA; // Utiliser l'agrégation pré-calculée
      
      produitCenterElement.innerHTML = `
        <tspan x="50%" dy="-0.8em" style="font-size: 1.3rem; font-weight: bold; fill: #333; text-anchor: middle;">
          ${formatValue(total)}
        </tspan>
        <tspan x="50%" dy="1.4em" style="font-size: 1rem; fill: #666; text-anchor: middle;">
          TOTAL
        </tspan>
      `;
    }
    
    // Mise à jour pour l'onglet CA BU / BTOB - Optimisé avec pré-calculs
    const btobCenterElement = document.getElementById('donut-btob-center');
    if (btobCenterElement && activeTab === 'ca-bu-btob' && !loading && filtered.length > 0) {
      let totalBtob = 0;
      for (const [buId, caTTC] of precomputedAggregations.byBusinessUnit.entries()) {
        const bu = businessUnitsMap.get(buId);
        if (bu && bu.businessUnitType === 'b2b') {
          totalBtob += caTTC;
        }
      }
      
      btobCenterElement.innerHTML = `
        <tspan x="50%" dy="-0.6em" style="font-size: 16px; font-weight: bold; fill: #333;">
          ${formatValue(totalBtob)}
        </tspan>
        <tspan x="50%" dy="1.2em" style="font-size: 14px; fill: #666;">
          TOTAL
        </tspan>
      `;
    }
    
    // Mise à jour pour l'onglet CA BU / BTOC - Optimisé avec pré-calculs
    const btocCenterElement = document.getElementById('donut-btoc-center');
    if (btocCenterElement && activeTab === 'ca-bu-btoc' && !loading && filtered.length > 0) {
      let totalBtoc = 0;
      for (const [buId, caTTC] of precomputedAggregations.byBusinessUnit.entries()) {
        const bu = businessUnitsMap.get(buId);
        if (bu && bu.businessUnitType === 'b2c') {
          totalBtoc += caTTC;
        }
      }
      
      btocCenterElement.innerHTML = `
        <tspan x="50%" dy="-0.6em" style="font-size: 16px; font-weight: bold; fill: #333;">
          ${formatValue(totalBtoc)}
        </tspan>
        <tspan x="50%" dy="1.2em" style="font-size: 14px; fill: #666;">
          TOTAL
        </tspan>
      `;
    }
  }, [activeTab, loading, precomputedAggregations, formatValue]);

  // KPIs supprimés (placeholder pour futur besoin)

  // Tous les calculs de graphes retirés; ils seront définis par onglet plus tard
  // Données Ambulances (CA TTC et Nombre de missions) - Optimisé avec pré-calculs
  const ambulanceAgg = React.useMemo(() => {
    if (activeTab !== 'ambulances') return { caByAmbulance: [], countByAmbulance: [] };
    
    const caByAmbulance = [];
    const countByAmbulance = [];
    
    // Utiliser les agrégations pré-calculées
    for (const [id, caTTC] of precomputedAggregations.byAmbulance.entries()) {
      const amb = ambulancesMap.get(id);
      const name = amb ? amb.numberPlate : id;
      caByAmbulance.push({ name, value: Math.round(caTTC) });
      
      // Compter les missions pour cette ambulance
      const missionCount = filtered.filter(g => String(g.aumbulanceId) === id).length;
      countByAmbulance.push({ name, value: missionCount });
    }
    
    return { caByAmbulance, countByAmbulance };
  }, [activeTab, precomputedAggregations, ambulancesMap, filtered]);

  // Pré-agrégations CA Global par mois - Optimisé avec pré-calculs
  const caGlobalByMonth = React.useMemo(() => {
    return Array.from(precomputedAggregations.byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, value }));
  }, [precomputedAggregations]);

  // Style pour les dropdowns avec checkboxes
  const dropdownStyle = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8
  };

  const dropdownContentStyle = {
    display: 'block',
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    backgroundColor: '#fff',
    minWidth: '200px',
    maxWidth: '400px',
    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
    zIndex: 9999,
    maxHeight: '300px',
    overflowY: 'auto',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    padding: '0',
  };

  const searchInputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px 8px 0 0',
  };

  const dropdownItemStyle = {
    padding: '12px 16px 12px 16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
    backgroundColor: '#fff',
    position: 'relative',
    paddingLeft: '40px',
  };

  const checkboxStyle = {
    position: 'absolute',
    left: '-50px',
    top: '50%',
    transform: 'translateY(-50%)',
    margin: '0',
    flexShrink: 0,
    width: '16px',
    height: '16px',
  };

  const handleChartMouseEnter = useCallback((data, index) => {
    // Effet de survol optimisé - le segment se met en évidence
    const pieElement = document.querySelector('.recharts-pie');
    if (pieElement) {
      const segments = pieElement.querySelectorAll('.recharts-pie-sector');
      segments.forEach((seg, i) => {
        if (i === index) {
          seg.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(0,0,0,0.3))';
        } else {
          seg.style.filter = 'brightness(0.8)';
        }
      });
    }
    
    // Mettre à jour le contenu central avec le nom et la valeur
    const centerElement = document.getElementById('donut-center');
    if (centerElement && data) {
      const fontSize = windowWidth <= 480 ? '0.9rem' : '1.2rem';
      const fontSizeSmall = windowWidth <= 480 ? '0.8rem' : '1rem';
      
      centerElement.innerHTML = `
        <tspan x="50%" dy="-0.2em" style="font-size: ${fontSize}; font-weight: bold; fill: #333;">
          ${formatValue(data.value)}
        </tspan>
        <tspan x="50%" dy="0.8em" style="font-size: ${fontSizeSmall}; fill: #666;">
          ${data.name}
        </tspan>
      `;
    }
  }, [windowWidth, formatValue]);

  const handleChartMouseLeave = useCallback(() => {
    // Retour à l'état normal
    const pieElement = document.querySelector('.recharts-pie');
    if (pieElement) {
      const segments = pieElement.querySelectorAll('.recharts-pie-sector');
      segments.forEach(seg => {
        seg.style.filter = 'none';
      });
    }
    
    // Remettre le total au centre avec le bon formatage
    const centerElement = document.getElementById('donut-center');
    if (centerElement) {
      const total = filtered.reduce((sum, g) => sum + (Number(g.caTTC) || 0), 0);
      
      const fontSize = windowWidth <= 480 ? '0.9rem' : '1.2rem';
      const fontSizeSmall = windowWidth <= 480 ? '0.8rem' : '1rem';
      
      centerElement.innerHTML = `
        <tspan x="50%" dy="-0.2em" style="font-size: ${fontSize}; font-weight: bold; fill: #333;">
          ${formatValue(total)}
        </tspan>
        <tspan x="50%" dy="0.8em" style="font-size: ${fontSizeSmall}; fill: #666;">
          TOTAL
        </tspan>
      `;
    }
  }, [filtered, windowWidth, formatValue]);

  // Fonction pour gérer les effets de survol des éléments de dropdown
  const handleDropdownItemHover = useCallback((event) => {
    event.target.style.backgroundColor = '#f8f9fa';
  }, []);

  const handleDropdownItemLeave = useCallback((event) => {
    event.target.style.backgroundColor = '#fff';
  }, []);

  const dropdownButtonStyle = {
    padding: '10px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '160px',
    maxWidth: '260px',
    width: 'auto',
    textAlign: 'left',
    color: '#333',
    fontSize: '0.95rem',
    fontWeight: 500,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  // Helpers pour afficher la sélection dans les dropdowns
  const getSelectedText = (selected, options, labelKey = 'name', max = 2) => {
    if (!selected || selected.length === 0) return 'Tout';
    const names = options
      .filter(opt => selected.includes(String(opt.id)))
      .map(opt => opt[labelKey]);
    if (names.length === 0) return 'Tout';
    if (names.length > max) {
      return names.slice(0, max).join(', ') + ', ...';
    }
    return names.join(', ');
  };
  const getSelectedTextEtat = (selected, options, max = 2) => {
    if (!selected || selected.length === 0) return 'Tout';
    const names = options.filter(opt => selected.includes(String(opt)));
    if (names.length === 0) return 'Tout';
    if (names.length > max) {
      return names.slice(0, max).join(', ') + ', ...';
    }
    return names.join(', ');
  };

  return (
    <div className="data-layout">
      <style>{mobileStyle}</style>
      <Sidebar />
      <main className="data-main">
        <h2 className="data-title">Analytique</h2>
        {/* Navigator Tabs - Responsive */}
        <div className="tabs-container" style={{ 
          display: 'flex', 
          gap: 8, 
          margin: '0 0 1rem 0', 
          borderBottom: '1px solid #e5e7eb',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e0 #f7fafc',
          WebkitOverflowScrolling: 'touch'
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                borderBottom: activeTab === tab.key ? '3px solid #1976d2' : '3px solid transparent',
                color: activeTab === tab.key ? '#111827' : '#6b7280'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Filtres (dépendent de l'onglet actif) */}
        <section className="data-filters">
          {/* Première ligne de filtres */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: '180px' }}>
            <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Date début :</label>
            <input 
              style={{ minWidth: 130, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} 
              type="date" 
              value={currentFilters.start} 
              onChange={e => updateCurrentFilters({ start: e.target.value })} 
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: '180px' }}>
            <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Date fin :</label>
            <input 
              style={{ minWidth: 130, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }} 
              type="date" 
              value={currentFilters.end} 
              onChange={e => updateCurrentFilters({ end: e.target.value })} 
            />
          </div>

          {/* Ambulance: visible pour Ambulances et CA Global */}
          {['ambulances','ca-global'].includes(activeTab) && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Ambulance :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('ambulance')}
              >
                {getSelectedText(currentFilters.ambulances, ambulances, 'numberPlate')}
              </button>
              {openDropdown === 'ambulance' ? (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher une ambulance..."
                    value={searchTerms.ambulance || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, ambulance: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ ambulances: ambulances.map(a => String(a.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {ambulances
                    .filter(a => !searchTerms.ambulance || a.numberPlate.toLowerCase().includes(searchTerms.ambulance.toLowerCase()))
                    .map(a => (
                    <div 
                      key={a.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ ambulances: currentFilters.ambulances.includes(String(a.id)) ? currentFilters.ambulances.filter(x => x !== String(a.id)) : [...currentFilters.ambulances, String(a.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={currentFilters.ambulances.includes(String(a.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {a.numberPlate}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Ville: visible pour plusieurs onglets */}
          {['ambulances', 'villes', 'ca-global', 'ca-global-bu', 'ca-produit-global', 'ca-produit-bu', 'ca-bu-assurance', 'ca-bu-btob', 'ca-bu-btoc', 'ca-assurance-wafa-ima', 'ca-medecin', 'ca-infirmier'].includes(activeTab) && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Ville :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('ville')}
              >
                {getSelectedText(currentFilters.villes, villes)}
              </button>
              {openDropdown === 'ville' && (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher une ville..."
                    value={searchTerms.ville || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, ville: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ villes: villes.map(v => String(v.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {villes
                    .filter(v => !searchTerms.ville || v.name.toLowerCase().includes(searchTerms.ville.toLowerCase()))
                    .map(v => (
                    <div 
                      key={v.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ villes: currentFilters.villes.includes(String(v.id)) ? currentFilters.villes.filter(x => x !== String(v.id)) : [...currentFilters.villes, String(v.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={currentFilters.villes.includes(String(v.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {v.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Business Unit: visible pour plusieurs onglets */}
          {['ambulances', 'bu', 'ca-global', 'ca-global-bu', 'ca-produit-global'].includes(activeTab) && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Business Unit :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('bu')}
              >
                {getSelectedText(currentFilters.bu, businessUnits, 'businessUnitType')}
              </button>
              {openDropdown === 'bu' && (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher une business unit..."
                    value={searchTerms.bu || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, bu: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ bu: businessUnits.map(bu => String(bu.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {businessUnits
                    .filter(bu => !searchTerms.bu || bu.businessUnitType.toLowerCase().includes(searchTerms.bu.toLowerCase()))
                    .map(bu => (
                    <div 
                      key={bu.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ bu: currentFilters.bu.includes(String(bu.id)) ? currentFilters.bu.filter(x => x !== String(bu.id)) : [...currentFilters.bu, String(bu.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={currentFilters.bu.includes(String(bu.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {bu.businessUnitType}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* État: visible pour Global, Paiement et CA Global / BU */}
          {['global', 'paiement', 'ca-global-bu', 'ca-medecin', 'ca-infirmier'].includes(activeTab) && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>État paiement :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('etat')}
              >
                {getSelectedTextEtat(currentFilters.etats, Array.from(new Set(globales.map(g => g.etatdePaiment).filter(Boolean))))}
              </button>
              {openDropdown === 'etat' && (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher un état de paiement..."
                    value={searchTerms.etat || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, etat: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {Array.from(new Set(globales.map(g => g.etatdePaiment).filter(Boolean)))
                    .filter(etat => !searchTerms.etat || etat.toLowerCase().includes(searchTerms.etat.toLowerCase()))
                    .map(etat => (
                    <div 
                      key={etat} 
                      style={dropdownItemStyle}
                      onClick={() => updateCurrentFilters({ etats: currentFilters.etats.includes(String(etat)) ? currentFilters.etats.filter(x => x !== String(etat)) : [...currentFilters.etats, String(etat)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={currentFilters.etats.includes(String(etat))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {etat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Produits: visible pour plusieurs onglets */}
          {['ca-global','ca-produit-global', 'ca-produit-bu', 'ca-global-bu'].includes(activeTab) && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Produit :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('produit')}
              >
                {getSelectedText(currentFilters.produits, produits)}
              </button>
              {openDropdown === 'produit' && (
                <div style={{...dropdownContentStyle, minWidth: '240px'}}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerms.produit || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, produit: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ produits: produits.map(p => String(p.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {produits
                    .filter(p => !searchTerms.produit || p.name.toLowerCase().includes(searchTerms.produit.toLowerCase()))
                    .map(p => (
                    <div 
                      key={p.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ produits: currentFilters.produits.includes(String(p.id)) ? currentFilters.produits.filter(x => x !== String(p.id)) : [...currentFilters.produits, String(p.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={currentFilters.produits.includes(String(p.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Client: visible pour plusieurs onglets */}
          {['ambulances','ca-global', 'ca-global-bu', 'ca-produit-global', 'ca-produit-bu', 'ca-bu-assurance', 'ca-bu-btob', 'ca-bu-btoc', 'ca-medecin', 'ca-infirmier'].includes(activeTab) && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Client :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('client')}
              >
                {getSelectedText(currentFilters.clients, clients, 'clientFullName')}
              </button>
              {openDropdown === 'client' ? (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchTerms.client || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, client: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ clients: clients.map(c => String(c.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {clients
                    .filter(c => !searchTerms.client || c.clientFullName.toLowerCase().includes(searchTerms.client.toLowerCase()))
                    .map(c => (
                    <div 
                      key={c.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ clients: currentFilters.clients.includes(String(c.id)) ? currentFilters.clients.filter(x => x !== String(c.id)) : [...currentFilters.clients, String(c.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={currentFilters.clients.includes(String(c.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {c.clientFullName}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Médecin: visible pour l'onglet CA / Médecin */}
          {activeTab === 'ca-medecin' && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Médecin :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('medecin')}
              >
                {getSelectedText(currentFilters.medecins || [], medecins, 'name')}
              </button>
              {openDropdown === 'medecin' && (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher un médecin..."
                    value={searchTerms.medecin || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, medecin: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ medecins: medecins.map(m => String(m.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {medecins
                    .filter(m => {
                      const searchTerm = searchTerms.medecin || '';
                      const medecinName = m.name || `${m.nom || ''} ${m.prenom || ''}`.trim();
                      return !searchTerm || medecinName.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map(m => (
                    <div 
                      key={m.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ medecins: (currentFilters.medecins || []).includes(String(m.id)) ? (currentFilters.medecins || []).filter(x => x !== String(m.id)) : [...(currentFilters.medecins || []), String(m.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={(currentFilters.medecins || []).includes(String(m.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {m.name || `${m.nom || ''} ${m.prenom || ''}`.trim()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Infirmier: visible pour l'onglet CA / Infirmier */}
          {activeTab === 'ca-infirmier' && (
            <div style={{ ...dropdownStyle, minWidth: '200px' }} className="dropdown-container">
              <label style={{ whiteSpace: 'nowrap', color: '#1976d2', fontWeight: 500 }}>Infirmier :</label>
              <button 
                style={{ ...dropdownButtonStyle, maxWidth: 220 }}
                onClick={() => toggleDropdown('infirmier')}
              >
                {getSelectedText(currentFilters.infirmiers || [], infirmiers, 'nom')}
              </button>
              {openDropdown === 'infirmier' && (
                <div style={dropdownContentStyle}>
                  {/* Champ de recherche */}
                  <input
                    type="text"
                    placeholder="Rechercher un infirmier..."
                    value={searchTerms.infirmier || ''}
                    onChange={(e) => setSearchTerms(prev => ({ ...prev, infirmier: e.target.value }))}
                    style={searchInputStyle}
                    onClick={(e) => e.stopPropagation()}
                  />
                  
                  {/* Option "Tout" */}
                  <div 
                    style={{...dropdownItemStyle, backgroundColor: '#f8f9fa', fontWeight: 'bold', borderBottom: '2px solid #dee2e6'}}
                    onMouseEnter={handleDropdownItemHover}
                    onMouseLeave={handleDropdownItemLeave}
                    onClick={() => updateCurrentFilters({ infirmiers: infirmiers.map(i => String(i.id)) })}
                  >
                    <input 
                      type="checkbox" 
                      checked={false}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    Tout
                  </div>
                  
                  {infirmiers
                    .filter(i => {
                      const searchTerm = searchTerms.infirmier || '';
                      const infirmierName = `${i.nom || ''} ${i.prenom || ''}`.trim();
                      return !searchTerm || infirmierName.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map(i => (
                    <div 
                      key={i.id} 
                      style={dropdownItemStyle}
                      onMouseEnter={handleDropdownItemHover}
                      onMouseLeave={handleDropdownItemLeave}
                      onClick={() => updateCurrentFilters({ infirmiers: (currentFilters.infirmiers || []).includes(String(i.id)) ? (currentFilters.infirmiers || []).filter(x => x !== String(i.id)) : [...(currentFilters.infirmiers || []), String(i.id)] })}
                    >
                      <input 
                        type="checkbox" 
                        checked={(currentFilters.infirmiers || []).includes(String(i.id))}
                        onChange={() => {}}
                        style={checkboxStyle}
                      />
                      {i.nom} {i.prenom}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
        {/* Contenu de l'onglet actif */}
        <section className="data-graphs">
          {activeTab === 'ambulances' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="graph-block" style={{ padding: '1rem', background: '#fff', borderRadius: 8 }}>
                <h4>CA / Ambulance</h4>
                <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                  <strong>Total CA: {ambulanceAgg.caByAmbulance.reduce((sum, item) => sum + item.value, 0).toLocaleString('fr-FR')} DH</strong>
                </div>
                <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                  <BarChart data={ambulanceAgg.caByAmbulance}>
                <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" type="category" interval={0} angle={-45} textAnchor="end" height={80} />
                    <YAxis type="number" tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                    <Tooltip formatter={(v) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                    <Bar dataKey="value" fill="#66bb6a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
              <div className="graph-block" style={{ padding: '1rem', background: '#fff', borderRadius: 8 }}>
                <h4>Nombre de Mission</h4>
                <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                  <BarChart data={ambulanceAgg.countByAmbulance}>
                <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" type="category" interval={0} angle={-45} textAnchor="end" height={80} />
                    <YAxis type="number" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#42a5f5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
              {/* Tableaux correspondants */}
              <div className="graph-block" style={{ padding: '1rem', background: '#fff', borderRadius: 8 }}>
                <h4>Tableau - CA / Ambulance</h4>
                <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                  <strong>Total CA: {ambulanceAgg.caByAmbulance.reduce((sum, item) => sum + item.value, 0).toLocaleString('fr-FR')} DH</strong>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th className="rank">#</th>
                        <th>Ambulance</th>
                        <th className="num">CA TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ambulanceAgg.caByAmbulance.map((row, idx) => (
                        <tr key={`ca-${row.name}`}>
                          <td className="rank">{idx + 1}</td>
                          <td>{row.name}</td>
                          <td className="num">{Number(row.value).toLocaleString('fr-FR')} DH</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="graph-block" style={{ padding: '1rem', background: '#fff', borderRadius: 8 }}>
                <h4>Tableau - Nombre de Mission</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th className="rank">#</th>
                        <th>Ambulance</th>
                        <th className="num">Nombre de missions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ambulanceAgg.countByAmbulance.map((row, idx) => (
                        <tr key={`count-${row.name}`}>
                          <td className="rank">{idx + 1}</td>
                          <td>{row.name}</td>
                          <td className="num">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
          ) : activeTab === 'ca-global' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="graph-block">
                <h4>CA Global Par Mois - T</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>DateCreation: Mois</th>
                        <th className="num">Somme de CaTTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caGlobalByMonth.map(row => (
                        <tr key={row.month}>
                          <td>{new Date(row.month + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</td>
                          <td className="num">{Number(row.value).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
          </div>
          </div>
          <div className="graph-block">
                <h4>CA Global Par Mois</h4>
                <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                  <LineChart data={caGlobalByMonth} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(m) => new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                    <Tooltip labelFormatter={(m) => new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} formatter={(v) => [Number(v).toLocaleString('fr-FR'), 'Somme de Ca TTC']} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Somme de Ca TTC" stroke="#66bb6a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
            </ResponsiveContainer>
          </div>
          </div>
          ) : activeTab === 'ca-global-bu' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Donut Chart - CA Global / BU */}
              <div className="graph-block">
                <h4>CA Global / BU</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <PieChart width={400} height={400}>
                      <Pie
                        data=                        {(() => {
                          const buData = {};
                          // Utiliser les agrégations pré-calculées pour les Business Units
                          for (const [buId, caTTC] of precomputedAggregations.byBusinessUnit.entries()) {
                            const bu = businessUnitsMap.get(buId);
                            if (!bu) continue;
                            const buType = bu.businessUnitType;
                            buData[buType] = (buData[buType] || 0) + caTTC;
                          }
                          const total = Object.values(buData).reduce((sum, val) => sum + val, 0);
                          return Object.entries(buData).map(([type, value]) => ({
                            name: type,
                            value: value,
                            percentage: total > 0 ? ((value / total) * 100).toFixed(2) : 0
                          }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={windowWidth <= 480 ? 40 : 60}
                        outerRadius={windowWidth <= 480 ? 80 : 100}
                        paddingAngle={5}
                        dataKey="value"
                        onMouseEnter={handleChartMouseEnter}
                        onMouseLeave={handleChartMouseLeave}
                      >
                        {(() => {
                          const buData = {};
                          for (const g of filtered) {
                            if (!g.businessUnitId) continue;
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu) continue;
                            const buType = bu.businessUnitType;
                            buData[buType] = (buData[buType] || 0) + (Number(g.caTTC) || 0);
                          }
                          const total = Object.values(buData).reduce((sum, val) => sum + val, 0);
                          const colors = ['#8884d8', '#ff7300', '#ffc658', '#82ca9d', '#ff8042'];
                          return Object.entries(buData)
                            .sort(([,a], [,b]) => b - a)
                            .map(([type, value], index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={colors[index % colors.length]}
                                style={{ 
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease-in-out'
                                }}
                              />
                            ));
                        })()}
                      </Pie>
                      
                      {/* Contenu central du donut */}
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" id="donut-center">
                        <tspan x="50%" dy="-0.2em" style={{ fontSize: windowWidth <= 480 ? '0.9rem' : '1.2rem', fontWeight: 'bold', fill: '#333' }}>
                          {(() => {
                            const total = filtered.reduce((sum, g) => sum + (Number(g.caTTC) || 0), 0);
                            const formatTotal = (value) => {
                              if (value >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}M`;
                              } else if (value >= 1000) {
                                return `${(value / 1000).toFixed(0)}k`;
                              }
                              return value.toLocaleString('fr-FR');
                            };
                            return formatTotal(total);
                          })()}
                        </tspan>
                        <tspan x="50%" dy="0.8em" style={{ fontSize: windowWidth <= 480 ? '0.8rem' : '1rem', fill: '#666' }}>
                          TOTAL
                        </tspan>
                      </text>
                      
                      <Tooltip 
                        formatter={(value, name) => {
                          // Afficher la valeur complète dans le tooltip
                          return [
                            `${Number(value).toLocaleString('fr-FR')} DH`,
                            name
                          ];
                        }}
                        labelStyle={{ 
                          fontWeight: 'bold',
                          color: '#fff'
                        }}
                        contentStyle={{ 
                          backgroundColor: '#333', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend 
                        formatter={(value, entry, index) => {
                          const buData = {};
                          for (const g of filtered) {
                            if (!g.businessUnitId) continue;
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu) continue;
                            const buType = bu.businessUnitType;
                            buData[buType] = (buData[buType] || 0) + (Number(g.caTTC) || 0);
                          }
                          const total = Object.values(buData).reduce((sum, val) => sum + val, 0);
                          const percentage = total > 0 ? ((buData[value] || 0) / total * 100).toFixed(2) : 0;
                          return `${value} (${percentage}%)`;
                        }}
                        wrapperStyle={{ color: '#333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '300px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Tableau - CA Global / BU - T */}
              <div className="graph-block">
                <h4>CA Global / BU - T</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="simple-table">
                    <thead>
                      <tr>
                        <th>Businessunits - BusinessUnitId → BusinessUnitType</th>
                        <th className="num">Somme de CaTTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const buData = {};
                        for (const g of filtered) {
                          if (!g.businessUnitId) continue;
                          const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                          if (!bu) continue;
                          const buType = bu.businessUnitType;
                          buData[buType] = (buData[buType] || 0) + (Number(g.caTTC) || 0);
                        }
                        return Object.entries(buData)
                          .sort(([,a], [,b]) => b - a)
                          .map(([type, value]) => (
                            <tr key={type}>
                              <td>{type}</td>
                              <td className="num">{Number(value).toLocaleString('fr-FR')}</td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Line Chart - CA Global / BU / Mois */}
              <div className="graph-block">
                <h4>CA Global / BU / Mois</h4>
                <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                  <LineChart data={(() => {
                    const monthData = {};
                    for (const g of filtered) {
                      if (!g.dateCreation || !g.businessUnitId) continue;
                      const ym = String(g.dateCreation).slice(0, 7);
                      const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                      if (!bu) continue;
                      const buType = bu.businessUnitType;
                      
                      if (!monthData[ym]) monthData[ym] = {};
                      monthData[ym][buType] = (monthData[ym][buType] || 0) + (Number(g.caTTC) || 0);
                    }
                    
                    return Object.entries(monthData)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, buValues]) => ({
                        month,
                        ...buValues
                      }));
                  })()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(m) => new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} 
                      interval={0} 
                      angle={-30} 
                      textAnchor="end" 
                      height={60} 
                    />
                    <YAxis tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                    <Tooltip 
                      labelFormatter={(m) => new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} 
                      formatter={(v, name) => [Number(v).toLocaleString('fr-FR'), name]} 
                    />
                    <Legend />
                    {(() => {
                      const buTypes = [...new Set(filtered.map(g => {
                        const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                        return bu ? bu.businessUnitType : null;
                      }).filter(Boolean))];
                      
                      const colors = ['#8884d8', '#ff7300', '#ffc658', '#82ca9d', '#ff8042'];
                      
                      return buTypes.map((buType, index) => (
                        <Line 
                          key={buType}
                          type="monotone" 
                          dataKey={buType} 
                          name={buType} 
                          stroke={colors[index % colors.length]} 
                          strokeWidth={3} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }} 
                        />
                      ));
                    })()}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 4ème panneau - KPIs ou métriques supplémentaires */}
              <div className="graph-block">
                <h4>Métriques BU</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', justifyContent: 'center' }}>
                  {(() => {
                    const buData = {};
                    for (const g of filtered) {
                      if (!g.businessUnitId) continue;
                      const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                      if (!bu) continue;
                      const buType = bu.businessUnitType;
                      buData[buType] = (buData[buType] || 0) + (Number(g.caTTC) || 0);
                    }
                    const total = Object.values(buData).reduce((sum, val) => sum + val, 0);
                    
                    return Object.entries(buData)
                      .sort(([,a], [,b]) => b - a)
                      .map(([type, value], index) => {
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
                        const colors = ['#8884d8', '#ff7300', '#ffc658', '#82ca9d', '#ff8042'];
                        
                        return (
                          <div key={type} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.5rem',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${colors[index % colors.length]}`
                          }}>
                            <span style={{ fontWeight: 600, color: '#333' }}>{type}</span>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, color: '#1976d2' }}>
                                {Number(value).toLocaleString('fr-FR')} DH
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                {percentage}%
                              </div>
                            </div>
                          </div>
                        );
                      });
                  })()}
                </div>
              </div>
            </div>
          ) : activeTab === 'ca-produit-global' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Donut Chart - CA Global Par Produit */}
              <div className="graph-block">
                <h4>CA Global Par Produit</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const produitData = {};
                          for (const g of filtered) {
                            if (!g.produitId) continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            const produitName = produit.name;
                            produitData[produitName] = (produitData[produitName] || 0) + (Number(g.caTTC) || 0);
                          }
                          
                          // Calculer le total
                          const total = Object.values(produitData).reduce((sum, val) => sum + val, 0);
                          
                          // Trier par valeur décroissante
                          const sortedEntries = Object.entries(produitData)
                            .sort(([,a], [,b]) => b - a);
                          
                          // Garder les 5 premiers produits et regrouper le reste dans "Autre"
                          const topProducts = sortedEntries.slice(0, 5);
                          const otherProducts = sortedEntries.slice(5);
                          
                          let result = topProducts.map(([name, value]) => ({
                            name,
                            value: value,
                            percentage: total > 0 ? ((value / total) * 100).toFixed(2) : 0,
                            isOther: false
                          }));
                          
                          // Ajouter "Autre" si il y a des produits restants
                          if (otherProducts.length > 0) {
                            const otherTotal = otherProducts.reduce((sum, [, value]) => sum + value, 0);
                            result.push({
                              name: 'Autre',
                              value: otherTotal,
                              percentage: total > 0 ? ((otherTotal / total) * 100).toFixed(2) : 0,
                              isOther: true,
                              details: otherProducts.map(([name, value]) => ({ name, value }))
                            });
                          }
                          
                          return result;
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        onMouseEnter={(data, index) => {
                          // Effet de survol - le segment se met en évidence
                          const pieElement = document.querySelector('.recharts-pie');
                          if (pieElement) {
                            const segments = pieElement.querySelectorAll('.recharts-pie-sector');
                            segments.forEach((seg, i) => {
                              if (i === index) {
                                seg.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(0,0,0,0.3))';
                              } else {
                                seg.style.filter = 'brightness(0.8)';
                              }
                            });
                          }
                          
                          // Mettre à jour le contenu central avec le nom et la valeur
                          const centerElement = document.getElementById('donut-produit-center');
                          if (centerElement && data) {
                            // Formater la valeur en format court
                            const formatValue = (value) => {
                              if (value >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}M`;
                              } else if (value >= 1000) {
                                return `${(value / 1000).toFixed(0)}k`;
                              }
                              return value.toLocaleString('fr-FR');
                            };
                            
                            if (data.isOther && data.details) {
                              // Pour "Autre", afficher le détail des produits
                              centerElement.innerHTML = `
                                <tspan x="50%" dy="-0.8em" style="font-size: 1.3rem; font-weight: bold; fill: #333; text-anchor: middle;">
                                  ${formatValue(data.value)}
                                </tspan>
                                <tspan x="50%" dy="1.4em" style="font-size: 1rem; fill: #666; text-anchor: middle;">
                                  Autre
                                </tspan>
                                <tspan x="50%" dy="1.2em" style="font-size: 0.75rem; fill: #999; text-anchor: middle;">
                                  (${data.details.length} produits)
                                </tspan>
                              `;
                            } else {
                              // Pour les produits individuels
                              centerElement.innerHTML = `
                                <tspan x="50%" dy="-0.8em" style="font-size: 1.3rem; font-weight: bold; fill: #333; text-anchor: middle;">
                                  ${formatValue(data.value)}
                                </tspan>
                                <tspan x="50%" dy="1.4em" style="font-size: 1rem; fill: #666; text-anchor: middle;">
                                  ${data.name}
                                </tspan>
                              `;
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          // Retour à l'état normal
                          const pieElement = document.querySelector('.recharts-pie');
                          if (pieElement) {
                            const segments = pieElement.querySelectorAll('.recharts-pie-sector');
                            segments.forEach(seg => {
                              seg.style.filter = 'none';
                            });
                          }
                          
                          // Remettre le total au centre
                          const centerElement = document.getElementById('donut-produit-center');
                          if (centerElement) {
                            const total = filtered.reduce((sum, g) => sum + (Number(g.caTTC) || 0), 0);
                            const formatTotal = (value) => {
                              if (value >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}M`;
                              } else if (value >= 1000) {
                                return `${(value / 1000).toFixed(0)}k`;
                              }
                              return value.toLocaleString('fr-FR');
                            };
                            centerElement.innerHTML = `
                              <tspan x="50%" dy="-0.8em" style="font-size: 1.3rem; font-weight: bold; fill: #333; text-anchor: middle;">
                                ${formatTotal(total)}
                              </tspan>
                              <tspan x="50%" dy="1.4em" style="font-size: 1rem; fill: #666; text-anchor: middle;">
                                TOTAL
                              </tspan>
                            `;
                          }
                        }}
                      >
                        {(() => {
                          const produitData = {};
                          for (const g of filtered) {
                            if (!g.produitId) continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            const produitName = produit.name;
                            produitData[produitName] = (produitData[produitName] || 0) + (Number(g.caTTC) || 0);
                          }
                          
                          // Calculer le total
                          const total = Object.values(produitData).reduce((sum, val) => sum + val, 0);
                          
                          // Trier par valeur décroissante
                          const sortedEntries = Object.entries(produitData)
                            .sort(([,a], [,b]) => b - a);
                          
                          // Garder les 5 premiers produits et regrouper le reste dans "Autre"
                          const topProducts = sortedEntries.slice(0, 5);
                          const otherProducts = sortedEntries.slice(5);
                          
                          let result = topProducts.map(([name, value]) => ({
                            name,
                            value: value,
                            percentage: total > 0 ? ((value / total) * 100).toFixed(2) : 0,
                            isOther: false
                          }));
                          
                          // Ajouter "Autre" si il y a des produits restants
                          if (otherProducts.length > 0) {
                            const otherTotal = otherProducts.reduce((sum, [, value]) => sum + value, 0);
                            result.push({
                              name: 'Autre',
                              value: otherTotal,
                              percentage: total > 0 ? ((otherTotal / total) * 100).toFixed(2) : 0,
                              isOther: true,
                              details: otherProducts.map(([name, value]) => ({ name, value }))
                            });
                          }
                          
                          const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff8042', '#8dd1e1'];
                          return result.map((item, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colors[index % colors.length]}
                              style={{ 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out'
                              }}
                            />
                          ));
                        })()}
                      </Pie>
                      
                      {/* Contenu central du donut */}
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" id="donut-produit-center">
                        <tspan x="50%" dy="-0.8em" style={{ fontSize: '1.3rem', fontWeight: 'bold', fill: '#333', textAnchor: 'middle' }}>
                          {(() => {
                            const total = filtered.reduce((sum, g) => sum + (Number(g.caTTC) || 0), 0);
                            const formatTotal = (value) => {
                              if (value >= 1000000) {
                                return `${(value / 1000000).toFixed(1)}M`;
                              } else if (value >= 1000) {
                                return `${(value / 1000).toFixed(0)}k`;
                              }
                              return value.toLocaleString('fr-FR');
                            };
                            return formatTotal(total);
                          })()}
                        </tspan>
                        <tspan x="50%" dy="1.4em" style={{ fontSize: '1rem', fill: '#666', textAnchor: 'middle' }}>
                          TOTAL
                        </tspan>
                      </text>
                      
                      <Tooltip 
                        formatter={(value, name, props) => {
                          // Afficher la valeur complète dans le tooltip
                          if (props.payload.isOther && props.payload.details) {
                            // Pour "Autre", afficher le détail des produits
                            const detailsText = props.payload.details
                              .map(d => `${d.name}: ${Number(d.value).toLocaleString('fr-FR')} DH`)
                              .join('\n');
                            return [
                              `${Number(value).toLocaleString('fr-FR')} DH`,
                              `${name}\n\n${detailsText}`
                            ];
                          }
                          return [
                            `${Number(value).toLocaleString('fr-FR')} DH`,
                            name
                          ];
                        }}
                        labelStyle={{ 
                          fontWeight: 'bold',
                          color: '#fff'
                        }}
                        contentStyle={{ 
                          backgroundColor: '#333', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff',
                          whiteSpace: 'pre-line'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend 
                        formatter={(value, entry, index) => {
                          const produitData = {};
                          for (const g of filtered) {
                            if (!g.produitId) continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            const produitName = produit.name;
                            produitData[produitName] = (produitData[produitName] || 0) + (Number(g.caTTC) || 0);
                          }
                          
                          // Calculer le total
                          const total = Object.values(produitData).reduce((sum, val) => sum + val, 0);
                          
                          // Trier par valeur décroissante
                          const sortedEntries = Object.entries(produitData)
                            .sort(([,a], [,b]) => b - a);
                          
                          // Garder les 5 premiers produits et regrouper le reste dans "Autre"
                          const topProducts = sortedEntries.slice(0, 5);
                          const otherProducts = sortedEntries.slice(5);
                          
                          let result = topProducts.map(([name, value]) => ({
                            name,
                            value: value,
                            percentage: total > 0 ? ((value / total) * 100).toFixed(2) : 0,
                            isOther: false
                          }));
                          
                          // Ajouter "Autre" si il y a des produits restants
                          if (otherProducts.length > 0) {
                            const otherTotal = otherProducts.reduce((sum, [, value]) => sum + value, 0);
                            result.push({
                              name: 'Autre',
                              value: otherTotal,
                              percentage: total > 0 ? ((otherTotal / total) * 100).toFixed(2) : 0,
                              isOther: true,
                              details: otherProducts.map(([name, value]) => ({ name, value }))
                            });
                          }
                          
                          const item = result[index];
                          if (item) {
                            return `${item.name} (${item.percentage}%)`;
                          }
                          return value;
                        }}
                        wrapperStyle={{ color: '#333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '300px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Tableau - CA Global Par Produit - T */}
              <div className="graph-block">
                <h4>CA Global Par Produit - T</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Produits - ProduitId → Name</th>
                          <th className="num">Somme de CaTTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const produitData = {};
                          for (const g of filtered) {
                            if (!g.produitId) continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            const produitName = produit.name;
                            produitData[produitName] = (produitData[produitName] || 0) + (Number(g.caTTC) || 0);
                          }
                          return Object.entries(produitData)
                            .sort(([,a], [,b]) => b - a)
                            .map(([name, value]) => (
                              <tr key={name}>
                                <td>{name}</td>
                                <td className="num">{Number(value).toLocaleString('fr-FR')}</td>
                              </tr>
                            ));
                        })()}
                      </tbody>
                    </table>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginTop: '1rem',
                      padding: '0.5rem',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      color: '#666'
                    }}>
                      <span>Total: {(() => {
                        const total = filtered.reduce((sum, g) => sum + (Number(g.caTTC) || 0), 0);
                        return `${Number(total).toLocaleString('fr-FR')} DH`;
                      })()}</span>
                      <span>Lignes 1-{(() => {
                        const produitData = {};
                        for (const g of filtered) {
                          if (!g.produitId) continue;
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          if (!produit) continue;
                          const produitName = produit.name;
                          produitData[produitName] = (produitData[produitName] || 0) + (Number(g.caTTC) || 0);
                        }
                        return Object.keys(produitData).length;
                      })()} parmi {(() => {
                        const produitData = {};
                        for (const g of filtered) {
                          if (!g.produitId) continue;
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          if (!produit) continue;
                          const produitName = produit.name;
                          produitData[produitName] = (produitData[produitName] || 0) + (Number(g.caTTC) || 0);
                        }
                        return Object.keys(produitData).length;
                      })()}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '300px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-produit-bu' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '1rem' }}>
              {/* Tableau - CA Global / Produit / BU - Plus d'espace */}
              <div className="graph-block">
                <h4>CA Global / Produit / BU</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '700px', overflowY: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Produits</th>
                          <th className="num">Assurance</th>
                          <th className="num">b2b</th>
                          <th className="num">b2c</th>
                          <th className="num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const produitBuData = {};
                          
                          // Agréger les données par produit et BU
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!produit || !bu) continue;
                            
                            const produitName = produit.name;
                            const buType = bu.businessUnitType;
                            
                            if (!produitBuData[produitName]) {
                              produitBuData[produitName] = {
                                Assurance: 0,
                                b2b: 0,
                                b2c: 0,
                                total: 0
                              };
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            produitBuData[produitName][buType] += caTTC;
                            produitBuData[produitName].total += caTTC;
                          }
                          
                          // Calculer les totaux généraux
                          const grandTotal = {
                            Assurance: 0,
                            b2b: 0,
                            b2c: 0,
                            total: 0
                          };
                          
                          Object.values(produitBuData).forEach(data => {
                            grandTotal.Assurance += data.Assurance;
                            grandTotal.b2b += data.b2b;
                            grandTotal.b2c += data.b2c;
                            grandTotal.total += data.total;
                          });
                          
                          // Trier par total décroissant et ajouter la ligne de total
                          const sortedEntries = Object.entries(produitBuData)
                            .sort(([,a], [,b]) => b.total - a.total);
                          
                          return [
                            // Lignes des produits
                            ...sortedEntries.map(([produitName, data]) => (
                              <tr key={produitName}>
                                <td style={{ fontSize: '0.9rem' }}>{produitName}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data.Assurance > 0 ? Number(data.Assurance).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data.b2b > 0 ? Number(data.b2b).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data.b2c > 0 ? Number(data.b2c).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(data.total).toLocaleString('fr-FR')}</td>
                              </tr>
                            )),
                            // Ligne de total
                            <tr key="grand-total" style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                              <td style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Grand total</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal.Assurance).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal.b2b).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal.b2c).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1976d2' }}>{Number(grandTotal.total).toLocaleString('fr-FR')}</td>
                            </tr>
                          ];
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '600px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique à barres empilées - CA Global / Produit / BU - Sur 2 lignes */}
              <div className="graph-block" style={{ gridRow: 'span 2' }}>
                <h4>CA Global / Produit / BU -</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={600}>
                    <BarChart
                      data={(() => {
                        const produitBuData = {};
                        
                        // Agréger les données par produit et BU
                        for (const g of filtered) {
                          if (!g.produitId || !g.businessUnitId) continue;
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                          if (!produit || !bu) continue;
                          
                          const produitName = produit.name;
                          const buType = bu.businessUnitType;
                          
                          if (!produitBuData[produitName]) {
                            produitBuData[produitName] = {
                              name: produitName,
                              Assurance: 0,
                              b2b: 0,
                              b2c: 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          produitBuData[produitName][buType] += caTTC;
                        }
                        
                        // Trier par total décroissant et limiter aux 15 premiers pour la lisibilité
                        return Object.values(produitBuData)
                          .sort((a, b) => (b.Assurance + b.b2b + b.b2c) - (a.Assurance + a.b2b + a.b2c))
                          .slice(0, 15);
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                        labelFormatter={(label) => `Produit: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="Assurance" stackId="a" fill="#ff69b4" name="Assurance" />
                      <Bar dataKey="b2b" stackId="a" fill="#8a2be2" name="b2b" />
                      <Bar dataKey="b2c" stackId="a" fill="#ffd700" name="b2c" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '600px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-bu-assurance' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {/* Tableau - CA par Produit / assurances - Pleine largeur */}
              <div className="graph-block">
                <h4>CA par Produit / assurances</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Clients - ClientId → ClientFullName</th>
                          <th className="num">ACTE INFIRMIER</th>
                          <th className="num">ACTE MEDECIN</th>
                          <th className="num">LOCATION MATERIELS</th>
                          <th className="num">MAD</th>
                          <th className="num">TAM</th>
                          <th className="num">TAS</th>
                          <th className="num">VSL</th>
                          <th className="num">Chèque de caution</th>
                          <th className="num">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const clientProduitData = {};
                          
                          // Agréger les données par client et produit (uniquement pour Assurance)
                          for (const g of filtered) {
                            if (!g.clientId || !g.produitId || !g.businessUnitId) continue;
                            
                            // Vérifier que c'est bien une assurance
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'Assurance') continue;
                            
                            const client = clients.find(c => String(c.id) === String(g.clientId));
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!client || !produit) continue;
                            
                            const clientName = client.clientFullName;
                            const produitName = produit.name;
                            
                            if (!clientProduitData[clientName]) {
                              clientProduitData[clientName] = {
                                'ACTE INFIRMIER': 0,
                                'ACTE MEDECIN': 0,
                                'LOCATION MATERIELS': 0,
                                'MAD': 0,
                                'TAM': 0,
                                'TAS': 0,
                                'VSL': 0,
                                'Chèque de caution': 0,
                                total: 0
                              };
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            if (clientProduitData[clientName].hasOwnProperty(produitName)) {
                              clientProduitData[clientName][produitName] += caTTC;
                            }
                            clientProduitData[clientName].total += caTTC;
                          }
                          
                          // Calculer les totaux généraux
                          const grandTotal = {
                            'ACTE INFIRMIER': 0,
                            'ACTE MEDECIN': 0,
                            'LOCATION MATERIELS': 0,
                            'MAD': 0,
                            'TAM': 0,
                            'TAS': 0,
                            'VSL': 0,
                            'Chèque de caution': 0,
                            total: 0
                          };
                          
                          Object.values(clientProduitData).forEach(data => {
                            Object.keys(grandTotal).forEach(key => {
                              if (key !== 'total') {
                                grandTotal[key] += data[key] || 0;
                              }
                            });
                            grandTotal.total += data.total;
                          });
                          
                          // Trier par total décroissant et ajouter la ligne de total
                          const sortedEntries = Object.entries(clientProduitData)
                            .sort(([,a], [,b]) => b.total - a.total);
                          
                          return [
                            // Lignes des clients
                            ...sortedEntries.map(([clientName, data]) => (
                              <tr key={clientName}>
                                <td style={{ fontSize: '0.9rem' }}>{clientName}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['ACTE INFIRMIER'] > 0 ? Number(data['ACTE INFIRMIER']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['ACTE MEDECIN'] > 0 ? Number(data['ACTE MEDECIN']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['LOCATION MATERIELS'] > 0 ? Number(data['LOCATION MATERIELS']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['MAD'] > 0 ? Number(data['MAD']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['TAM'] > 0 ? Number(data['TAM']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['TAS'] > 0 ? Number(data['TAS']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['VSL'] > 0 ? Number(data['VSL']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{data['Chèque de caution'] > 0 ? Number(data['Chèque de caution']).toLocaleString('fr-FR') : ''}</td>
                                <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(data.total).toLocaleString('fr-FR')}</td>
                              </tr>
                            )),
                            // Ligne de total
                            <tr key="grand-total" style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                              <td style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Grand total</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['ACTE INFIRMIER']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['ACTE MEDECIN']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['LOCATION MATERIELS']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['MAD']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['TAM']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['TAS']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['VSL']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal['Chèque de caution']).toLocaleString('fr-FR')}</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{Number(grandTotal.total).toLocaleString('fr-FR')}</td>
                            </tr>
                          ];
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique à barres groupées - CA par Produit / assurances - T */}
              <div className="graph-block">
                <h4>CA par Produit / assurances - T</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const clientProduitData = {};
                        
                        // Agréger les données par client et produit (uniquement pour Assurance)
                        for (const g of filtered) {
                          if (!g.clientId || !g.produitId || !g.businessUnitId) continue;
                          
                          // Vérifier que c'est bien une assurance
                          const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                          if (!bu || bu.businessUnitType !== 'Assurance') continue;
                          
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          if (!client || !produit) continue;
                          
                          const clientName = client.clientFullName;
                          const produitName = produit.name;
                          
                          if (!clientProduitData[clientName]) {
                            clientProduitData[clientName] = {
                              name: clientName,
                              'ACTE INFIRMIER': 0,
                              'ACTE MEDECIN': 0,
                              'LOCATION MATERIELS': 0,
                              'MAD': 0,
                              'TAM': 0,
                              'TAS': 0,
                              'VSL': 0,
                              'Chèque de caution': 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          if (clientProduitData[clientName].hasOwnProperty(produitName)) {
                            clientProduitData[clientName][produitName] += caTTC;
                          }
                        }
                        
                        // Trier par total décroissant
                        return Object.values(clientProduitData)
                          .sort((a, b) => {
                            const totalA = Object.keys(a).filter(key => key !== 'name').reduce((sum, key) => sum + (a[key] || 0), 0);
                            const totalB = Object.keys(b).filter(key => key !== 'name').reduce((sum, key) => sum + (b[key] || 0), 0);
                            return totalB - totalA;
                          });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                        labelFormatter={(label) => `Client: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="ACTE INFIRMIER" fill="#8884d8" name="ACTE INFIRMIER" />
                      <Bar dataKey="ACTE MEDECIN" fill="#ff6b6b" name="ACTE MEDECIN" />
                      <Bar dataKey="LOCATION MATERIELS" fill="#ffa726" name="LOCATION MATERIELS" />
                      <Bar dataKey="MAD" fill="#42a5f5" name="MAD" />
                      <Bar dataKey="TAM" fill="#66bb6a" name="TAM" />
                      <Bar dataKey="TAS" fill="#26c6da" name="TAS" />
                      <Bar dataKey="VSL" fill="#7b1fa2" name="VSL" />
                      <Bar dataKey="Chèque de caution" fill="#ffd54f" name="Chèque de caution" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Nouveau graphique - CA Assurance / Client / Mois */}
              <div className="graph-block">
                <h4>CA Assurance / Client / Mois</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <LineChart
                      data={(() => {
                        const clientMoisData = {};
                        
                        // Agréger les données par client et mois (uniquement pour Assurance)
                        for (const g of filtered) {
                          if (!g.clientId || !g.businessUnitId) continue;
                          
                          // Vérifier que c'est bien une assurance
                          const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                          if (!bu || bu.businessUnitType !== 'Assurance') continue;
                          
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client) continue;
                          
                          // Extraire le mois de la date de création
                          const dateCreation = new Date(g.dateCreation);
                          const ym = dateCreation.toISOString().slice(0, 7); // Format YYYY-MM
                          
                          const clientName = client.clientFullName;
                          
                          if (!clientMoisData[ym]) clientMoisData[ym] = {};
                          clientMoisData[ym][clientName] = (clientMoisData[ym][clientName] || 0) + (Number(g.caTTC) || 0);
                        }
                        
                        // Trier par mois et limiter aux 5 premiers clients pour la lisibilité
                        const sortedMonths = Object.keys(clientMoisData).sort();
                        const topClients = Object.keys(
                          Object.values(clientMoisData).reduce((acc, monthData) => {
                            Object.entries(monthData).forEach(([client, value]) => {
                              acc[client] = (acc[client] || 0) + value;
                            });
                            return acc;
                          }, {})
                        )
                        .sort((a, b) => {
                          const totalA = Object.values(clientMoisData).reduce((sum, monthData) => sum + (monthData[a] || 0), 0);
                          const totalB = Object.values(clientMoisData).reduce((sum, monthData) => sum + (monthData[b] || 0), 0);
                          return totalB - totalA;
                        })
                        .slice(0, 5);
                        
                        return sortedMonths.map(month => ({
                          month,
                          ...topClients.reduce((acc, client) => {
                            acc[client] = clientMoisData[month][client] || 0;
                            return acc;
                          }, {})
                        }));
                      })()}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(m) => new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} 
                        interval={0} 
                        angle={-30} 
                        textAnchor="end" 
                        height={60} 
                      />
                      <YAxis tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                      <Tooltip 
                        labelFormatter={(m) => new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} 
                        formatter={(v, name) => [Number(v).toLocaleString('fr-FR'), name]} 
                      />
                      <Legend />
                      {(() => {
                        // Recréer les données pour obtenir les noms des clients
                        const clientMoisData = {};
                        for (const g of filtered) {
                          if (!g.clientId || !g.businessUnitId) continue;
                          const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                          if (!bu || bu.businessUnitType !== 'Assurance') continue;
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client) continue;
                          const dateCreation = new Date(g.dateCreation);
                          const ym = dateCreation.toISOString().slice(0, 7);
                          const clientName = client.clientFullName;
                          if (!clientMoisData[ym]) clientMoisData[ym] = {};
                          clientMoisData[ym][clientName] = (clientMoisData[ym][clientName] || 0) + (Number(g.caTTC) || 0);
                        }
                        
                        const clientNames = Object.keys(
                          Object.values(clientMoisData).reduce((acc, monthData) => {
                            Object.entries(monthData).forEach(([client, value]) => {
                              acc[client] = (acc[client] || 0) + value;
                            });
                            return acc;
                          }, {})
                        )
                        .sort((a, b) => {
                          const totalA = Object.values(clientMoisData).reduce((sum, monthData) => sum + (monthData[a] || 0), 0);
                          const totalB = Object.values(clientMoisData).reduce((sum, monthData) => sum + (monthData[b] || 0), 0);
                          return totalB - totalA;
                        })
                        .slice(0, 5);
                        
                        const colors = ['#8884d8', '#ff7300', '#ffc658', '#82ca9d', '#ff8042'];
                        
                        return clientNames.map((clientName, index) => (
                          <Line 
                            key={clientName}
                            type="monotone" 
                            dataKey={clientName} 
                            name={clientName} 
                            stroke={colors[index % colors.length]} 
                            strokeWidth={3} 
                            dot={{ r: 4 }} 
                            activeDot={{ r: 6 }} 
                          />
                        ));
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '300px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-bu-btob' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Tableau - CA BU / BTOB */}
              <div className="graph-block">
                <h4>CA BU / BTOB</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Produits - ProduitId → Name</th>
                          <th className="num">Somme de CaTTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const produitBtobData = {};
                          
                          // Agréger les données par produit (uniquement pour B2B)
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            
                            // Vérifier que c'est bien B2B
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'b2b') continue;
                            
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            
                            const produitName = produit.name;
                            
                            if (!produitBtobData[produitName]) {
                              produitBtobData[produitName] = 0;
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            produitBtobData[produitName] += caTTC;
                          }
                          
                          // Calculer le total général
                          const grandTotal = Object.values(produitBtobData).reduce((sum, value) => sum + value, 0);
                          
                          // Trier par CA décroissant et ajouter la ligne de total
                          const sortedEntries = Object.entries(produitBtobData)
                            .sort(([,a], [,b]) => b - a);
                          
                          return [
                            // Lignes des produits
                            ...sortedEntries.map(([produitName, caTTC]) => (
                              <tr key={produitName}>
                                <td style={{ fontSize: '0.9rem' }}>{produitName}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{Number(caTTC).toLocaleString('fr-FR')}</td>
                              </tr>
                            )),
                            // Ligne de total
                            <tr key="grand-total" style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                              <td style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Grand total</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1976d2' }}>{Number(grandTotal).toLocaleString('fr-FR')}</td>
                            </tr>
                          ];
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '500px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique en anneau - CA / Produit . B2B */}
              <div className="graph-block">
                <h4>CA / Produit . B2B</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const produitBtobData = {};
                          
                          // Agréger les données par produit (uniquement pour B2B)
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            
                            // Vérifier que c'est bien B2B
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'b2b') continue;
                            
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            
                            const produitName = produit.name;
                            
                            if (!produitBtobData[produitName]) {
                              produitBtobData[produitName] = 0;
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            produitBtobData[produitName] += caTTC;
                          }
                          
                          // Calculer le total
                          const total = Object.values(produitBtobData).reduce((sum, value) => sum + value, 0);
                          
                          // Trier par CA décroissant, prendre le top 3 et grouper le reste dans "Autre"
                          const sortedEntries = Object.entries(produitBtobData)
                            .sort(([,a], [,b]) => b - a);
                          
                          const top3 = sortedEntries.slice(0, 3);
                          const other = sortedEntries.slice(3);
                          
                          const result = [
                            ...top3.map(([name, value]) => ({
                              name,
                              value,
                              percentage: ((value / total) * 100).toFixed(2),
                              isOther: false
                            }))
                          ];
                          
                          if (other.length > 0) {
                            const otherTotal = other.reduce((sum, [, value]) => sum + value, 0);
                            result.push({
                              name: 'Autre',
                              value: otherTotal,
                              percentage: ((otherTotal / total) * 100).toFixed(2),
                              isOther: true,
                              details: other.map(([name, value]) => ({ name, value }))
                            });
                          }
                          
                          return result;
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        onMouseEnter={(data) => {
                          const centerElement = document.getElementById('donut-btob-center');
                          if (centerElement) {
                            if (data.isOther) {
                              centerElement.innerHTML = `
                                <tspan x="50%" dy="-0.6em" text-anchor="middle" style="font-size: 16px; font-weight: bold; fill: #000;">
                                  ${Number(data.value).toLocaleString('fr-FR')}
                                </tspan>
                                <tspan x="50%" dy="1.2em" text-anchor="middle" style="font-size: 14px; fill: #666;">
                                  Autre
                                </tspan>
                              `;
                            } else {
                              centerElement.innerHTML = `
                                <tspan x="50%" dy="-0.6em" text-anchor="middle" style="font-size: 16px; font-weight: bold; fill: #000;">
                                  ${Number(data.value).toLocaleString('fr-FR')}
                                </tspan>
                                <tspan x="50%" dy="1.2em" text-anchor="middle" style="font-size: 14px; fill: #666;">
                                  ${data.name}
                                </tspan>
                              `;
                            }
                          }
                        }}
                        onMouseLeave={() => {
                          const centerElement = document.getElementById('donut-btob-center');
                          if (centerElement) {
                            const total = (() => {
                              const produitBtobData = {};
                              for (const g of filtered) {
                                if (!g.produitId || !g.businessUnitId) continue;
                                const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                                if (!bu || bu.businessUnitType !== 'b2b') continue;
                                const produit = produits.find(p => String(p.id) === String(g.produitId));
                                if (!produit) continue;
                                const produitName = produit.name;
                                if (!produitBtobData[produitName]) {
                                  produitBtobData[produitName] = 0;
                                }
                                const caTTC = Number(g.caTTC) || 0;
                                produitBtobData[produitName] += caTTC;
                              }
                              return Object.values(produitBtobData).reduce((sum, value) => sum + value, 0);
                            })();
                            
                            centerElement.innerHTML = `
                              <tspan x="50%" dy="-0.6em" text-anchor="middle" style="font-size: 16px; font-weight: bold; fill: #333;">
                                ${Number(total).toLocaleString('fr-FR')}
                              </tspan>
                              <tspan x="50%" dy="1.2em" text-anchor="middle" style="font-size: 14px; fill: #666;">
                                TOTAL
                              </tspan>
                            `;
                          }
                        }}
                      >
                        {(() => {
                          const produitBtobData = {};
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'b2b') continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            const produitName = produit.name;
                            if (!produitBtobData[produitName]) {
                              produitBtobData[produitName] = 0;
                            }
                            const caTTC = Number(g.caTTC) || 0;
                            produitBtobData[produitName] += caTTC;
                          }
                          
                          const total = Object.values(produitBtobData).reduce((sum, value) => sum + value, 0);
                          const sortedEntries = Object.entries(produitBtobData).sort(([,a], [,b]) => b - a);
                          const top3 = sortedEntries.slice(0, 3);
                          const other = sortedEntries.slice(3);
                          
                          const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
                          const result = [];
                          
                          top3.forEach((entry, index) => {
                            result.push(
                              <Cell key={entry[0]} fill={colors[index]} />
                            );
                          });
                          
                          if (other.length > 0) {
                            result.push(
                              <Cell key="other" fill={colors[3]} />
                            );
                          }
                          
                          return result;
                        })()}
                      </Pie>
                      <text id="donut-btob-center" x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-0.6em" style={{ fontSize: '16px', fontWeight: 'bold', fill: '#333' }}>
                          {(() => {
                            const produitBtobData = {};
                            for (const g of filtered) {
                              if (!g.produitId || !g.businessUnitId) continue;
                              const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                              if (!bu || bu.businessUnitType !== 'b2b') continue;
                              const produit = produits.find(p => String(p.id) === String(g.produitId));
                              if (!produit) continue;
                              const produitName = produit.name;
                              if (!produitBtobData[produitName]) {
                                produitBtobData[produitName] = 0;
                              }
                              const caTTC = Number(g.caTTC) || 0;
                              produitBtobData[produitName] += caTTC;
                            }
                            return Number(Object.values(produitBtobData).reduce((sum, value) => sum + value, 0)).toLocaleString('fr-FR');
                          })()}
                        </tspan>
                        <tspan x="50%" dy="1.2em" style={{ fontSize: '14px', fill: '#666' }}>
                          TOTAL
                        </tspan>
                      </text>
                      <Tooltip 
                        formatter={(value, name, props) => {
                          if (name === 'Autre') {
                            const data = (() => {
                              const produitBtobData = {};
                              for (const g of filtered) {
                                if (!g.produitId || !g.businessUnitId) continue;
                                const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                                if (!bu || bu.businessUnitType !== 'b2b') continue;
                                const produit = produits.find(p => String(p.id) === String(g.produitId));
                                if (!produit) continue;
                                const produitName = produit.name;
                                if (!produitBtobData[produitName]) {
                                  produitBtobData[produitName] = 0;
                                }
                                const caTTC = Number(g.caTTC) || 0;
                                produitBtobData[produitName] += caTTC;
                              }
                              
                              const total = Object.values(produitBtobData).reduce((sum, value) => sum + value, 0);
                              const sortedEntries = Object.entries(produitBtobData).sort(([,a], [,b]) => b - a);
                              const other = sortedEntries.slice(3);
                              
                              return other.map(([name, value]) => ({ name, value }));
                            })();
                            
                            const details = data.map(item => `${item.name}: ${Number(item.value).toLocaleString('fr-FR')} DH`).join('\n');
                            return [details, 'Autre'];
                          }
                          return [`${Number(value).toLocaleString('fr-FR')} DH`, name];
                        }}
                        contentStyle={{ whiteSpace: 'pre-line' }}
                      />
                      <Legend 
                        formatter={(value, entry, index) => {
                          const data = (() => {
                            const produitBtobData = {};
                            for (const g of filtered) {
                              if (!g.produitId || !g.businessUnitId) continue;
                              const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                              if (!bu || bu.businessUnitType !== 'b2b') continue;
                              const produit = produits.find(p => String(p.id) === String(g.produitId));
                              if (!produit) continue;
                              const produitName = produit.name;
                              if (!produitBtobData[produitName]) {
                                produitBtobData[produitName] = 0;
                              }
                              const caTTC = Number(g.caTTC) || 0;
                              produitBtobData[produitName] += caTTC;
                            }
                            
                            const total = Object.values(produitBtobData).reduce((sum, value) => sum + value, 0);
                            const sortedEntries = Object.entries(produitBtobData).sort(([,a], [,b]) => b - a);
                            const top3 = sortedEntries.slice(0, 3);
                            const other = sortedEntries.slice(3);
                            
                            const result = [
                              ...top3.map(([name, value]) => ({
                                name,
                                value,
                                percentage: ((value / total) * 100).toFixed(2),
                                isOther: false
                              }))
                            ];
                            
                            if (other.length > 0) {
                              const otherTotal = other.reduce((sum, [, value]) => sum + value, 0);
                              result.push({
                                name: 'Autre',
                                value: otherTotal,
                                percentage: ((otherTotal / total) * 100).toFixed(2),
                                isOther: true,
                                details: other.map(([name, value]) => ({ name, value }))
                              });
                            }
                            
                            return result;
                          })();
                          
                          if (data[index] && data[index].isOther) {
                            return `${value} (${data[index].percentage}%)`;
                          }
                          return `${value} (${data[index]?.percentage || 0}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '500px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-bu-btoc' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Graphique en anneau - CA / BU / BTOC */}
              <div className="graph-block">
                <h4>CA / BU / BTOC</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                      <Pie
                        data={(() => {
                          const produitBtocData = {};
                          
                          // Agréger les données par produit (uniquement pour BTOC)
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            
                            // Vérifier que c'est bien BTOC
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'b2c') continue;
                            
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            
                            const produitName = produit.name;
                            
                            if (!produitBtocData[produitName]) {
                              produitBtocData[produitName] = 0;
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            produitBtocData[produitName] += caTTC;
                          }
                          
                          // Calculer le total
                          const total = Object.values(produitBtocData).reduce((sum, value) => sum + value, 0);
                          
                          // Trier par CA décroissant et calculer les pourcentages
                          const sortedEntries = Object.entries(produitBtocData)
                            .sort(([,a], [,b]) => b - a)
                            .map(([name, value]) => ({
                              name,
                              value,
                              percentage: ((value / total) * 100).toFixed(2),
                              isOther: false
                            }));
                          
                          return sortedEntries;
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                        onMouseEnter={(data) => {
                          const centerElement = document.getElementById('donut-btoc-center');
                          if (centerElement) {
                            centerElement.innerHTML = `
                              <tspan x="50%" dy="-0.6em" text-anchor="middle" style="font-size: 16px; font-weight: bold; fill: #000;">
                                ${Number(data.value).toLocaleString('fr-FR')}
                              </tspan>
                              <tspan x="50%" dy="1.2em" text-anchor="middle" style="font-size: 14px; fill: #666;">
                                ${data.name}
                              </tspan>
                            `;
                          }
                        }}
                        onMouseLeave={() => {
                          const centerElement = document.getElementById('donut-btoc-center');
                          if (centerElement) {
                            const total = (() => {
                              const produitBtocData = {};
                              for (const g of filtered) {
                                if (!g.produitId || !g.businessUnitId) continue;
                                const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                                if (!bu || bu.businessUnitType !== 'b2c') continue;
                                const produit = produits.find(p => String(p.id) === String(g.produitId));
                                if (!produit) continue;
                                const produitName = produit.name;
                                if (!produitBtocData[produitName]) {
                                  produitBtocData[produitName] = 0;
                                }
                                const caTTC = Number(g.caTTC) || 0;
                                produitBtocData[produitName] += caTTC;
                              }
                              return Object.values(produitBtocData).reduce((sum, value) => sum + value, 0);
                            })();
                            
                            centerElement.innerHTML = `
                              <tspan x="50%" dy="-0.6em" text-anchor="middle" style="font-size: 16px; font-weight: bold; fill: #333;">
                                ${Number(total).toLocaleString('fr-FR')}
                              </tspan>
                              <tspan x="50%" dy="1.2em" text-anchor="middle" style="font-size: 14px; fill: #666;">
                                TOTAL
                              </tspan>
                            `;
                          }
                        }}
                      >
                        {(() => {
                          const produitBtocData = {};
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'b2c') continue;
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            const produitName = produit.name;
                            if (!produitBtocData[produitName]) {
                              produitBtocData[produitName] = 0;
                            }
                            const caTTC = Number(g.caTTC) || 0;
                            produitBtocData[produitName] += caTTC;
                          }
                          
                          const sortedEntries = Object.entries(produitBtocData).sort(([,a], [,b]) => b - a);
                          const colors = ['#82ca9d', '#ffb6c1', '#42a5f5', '#87ceeb', '#8884d8', '#ffa726'];
                          
                          return sortedEntries.map((entry, index) => (
                            <Cell key={entry[0]} fill={colors[index % colors.length]} />
                          ));
                        })()}
                      </Pie>
                      <text id="donut-btoc-center" x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-0.6em" style={{ fontSize: '16px', fontWeight: 'bold', fill: '#333' }}>
                          {(() => {
                            const produitBtocData = {};
                            for (const g of filtered) {
                              if (!g.produitId || !g.businessUnitId) continue;
                              const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                              if (!bu || bu.businessUnitType !== 'b2c') continue;
                              const produit = produits.find(p => String(p.id) === String(g.produitId));
                              if (!produit) continue;
                              const produitName = produit.name;
                              if (!produitBtocData[produitName]) {
                                produitBtocData[produitName] = 0;
                              }
                              const caTTC = Number(g.caTTC) || 0;
                              produitBtocData[produitName] += caTTC;
                            }
                            return Number(Object.values(produitBtocData).reduce((sum, value) => sum + value, 0)).toLocaleString('fr-FR');
                          })()}
                        </tspan>
                        <tspan x="50%" dy="1.2em" style={{ fontSize: '14px', fill: '#666' }}>
                          TOTAL
                        </tspan>
                      </text>
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                      />
                      <Legend 
                        formatter={(value, entry, index) => {
                          const data = (() => {
                            const produitBtocData = {};
                            for (const g of filtered) {
                              if (!g.produitId || !g.businessUnitId) continue;
                              const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                              if (!bu || bu.businessUnitType !== 'b2c') continue;
                              const produit = produits.find(p => String(p.id) === String(g.produitId));
                              if (!produit) continue;
                              const produitName = produit.name;
                              if (!produitBtocData[produitName]) {
                                produitBtocData[produitName] = 0;
                              }
                              const caTTC = Number(g.caTTC) || 0;
                              produitBtocData[produitName] += caTTC;
                            }
                            
                            const total = Object.values(produitBtocData).reduce((sum, value) => sum + value, 0);
                            const sortedEntries = Object.entries(produitBtocData)
                              .sort(([,a], [,b]) => b - a)
                              .map(([name, value]) => ({
                                name,
                                value,
                                percentage: ((value / total) * 100).toFixed(2)
                              }));
                            
                            return sortedEntries;
                          })();
                          
                          if (data[index]) {
                            return `${data[index].name} (${data[index].percentage}%)`;
                          }
                          return value;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '500px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Tableau - CA / BU / BTOC - T */}
              <div className="graph-block">
                <h4>CA / BU / BTOC - T</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Produits - ProduitId → Name</th>
                          <th className="num">Somme de CaTTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const produitBtocData = {};
                          
                          // Agréger les données par produit (uniquement pour BTOC)
                          for (const g of filtered) {
                            if (!g.produitId || !g.businessUnitId) continue;
                            
                            // Vérifier que c'est bien BTOC
                            const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                            if (!bu || bu.businessUnitType !== 'b2c') continue;
                            
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            if (!produit) continue;
                            
                            const produitName = produit.name;
                            
                            if (!produitBtocData[produitName]) {
                              produitBtocData[produitName] = 0;
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            produitBtocData[produitName] += caTTC;
                          }
                          
                          // Calculer le total général
                          const grandTotal = Object.values(produitBtocData).reduce((sum, value) => sum + value, 0);
                          
                          // Trier par CA décroissant et ajouter la ligne de total
                          const sortedEntries = Object.entries(produitBtocData)
                            .sort(([,a], [,b]) => b - a);
                          
                          return [
                            // Lignes des produits
                            ...sortedEntries.map(([produitName, caTTC]) => (
                              <tr key={produitName}>
                                <td style={{ fontSize: '0.9rem' }}>{produitName}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{Number(caTTC).toLocaleString('fr-FR')}</td>
                              </tr>
                            )),
                            // Ligne de total
                            <tr key="grand-total" style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                              <td style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Grand total</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1976d2' }}>{Number(grandTotal).toLocaleString('fr-FR')}</td>
                            </tr>
                          ];
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '500px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-assurance-wafa-ima' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Graphique en barres - CA / BU / WAFAIMA */}
              <div className="graph-block">
                <h4>CA / BU / WAFAIMA</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const produitWafaimaData = {};
                        
                        // Agréger les données par produit (uniquement pour Wafa Ima et Business Unit Assurance)
                        for (const g of filtered) {
                          if (!g.produitId || !g.businessUnitId || !g.clientId) continue;
                          
                          // Vérifier que c'est bien Wafa Ima
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client || client.clientFullName !== 'Wafa ima') continue;
                          
                          // Vérifier que c'est bien une assurance
                          const bu = businessUnits.find(b => String(b.id) === String(g.businessUnitId));
                          if (!bu || bu.businessUnitType !== 'Assurance') continue;
                          
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          if (!produit) continue;
                          
                          const produitName = produit.name;
                          
                          if (!produitWafaimaData[produitName]) {
                            produitWafaimaData[produitName] = 0;
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          produitWafaimaData[produitName] += caTTC;
                        }
                        
                        // Trier par CA décroissant
                        return Object.entries(produitWafaimaData)
                          .sort(([,a], [,b]) => b - a)
                          .map(([name, value]) => ({
                            name,
                            value
                          }));
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                      />
                      <Bar dataKey="value" fill="#90EE90" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique en ligne - CA WAFA IMA/ Mois */}
              <div className="graph-block">
                <h4>CA WAFA IMA/ Mois</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <LineChart
                      data={(() => {
                        const monthlyData = {};
                        
                        // Agréger les données par mois (uniquement pour Wafa Ima)
                        for (const g of filtered) {
                          if (!g.dateCreation || !g.clientId) continue;
                          
                          // Vérifier que c'est bien Wafa Ima
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client || client.clientFullName !== 'Wafa ima') continue;
                          
                          const date = new Date(g.dateCreation);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                          
                          if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = {
                              month: monthLabel,
                              value: 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          monthlyData[monthKey].value += caTTC;
                        }
                        
                        // Trier par mois chronologique
                        return Object.values(monthlyData)
                          .sort((a, b) => {
                            const monthA = a.month.split(' ')[1] + ' ' + a.month.split(' ')[0];
                            const monthB = b.month.split(' ')[1] + ' ' + b.month.split(' ')[0];
                            return new Date(monthA) - new Date(monthB);
                          });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          'Somme de CaTTC'
                        ]}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#90EE90" 
                        strokeWidth={3}
                        dot={{ fill: '#90EE90', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#90EE90', strokeWidth: 2, fill: '#90EE90' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-mai' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Graphique en barres - CA / Produit */}
              <div className="graph-block">
                <h4>CA / Produit</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const produitMaiData = {};
                        
                        // Agréger les données par produit (uniquement pour MAI)
                        for (const g of filtered) {
                          if (!g.produitId || !g.clientId) continue;
                          
                          // Vérifier que c'est bien MAI
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client || client.clientFullName !== 'Mai') continue;
                          
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          if (!produit) continue;
                          
                          const produitName = produit.name;
                          
                          if (!produitMaiData[produitName]) {
                            produitMaiData[produitName] = 0;
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          produitMaiData[produitName] += caTTC;
                        }
                        
                        // Trier par CA décroissant
                        return Object.entries(produitMaiData)
                          .sort(([,a], [,b]) => b - a)
                          .map(([name, value]) => ({
                            name,
                            value
                          }));
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                      />
                      <Bar dataKey="value" fill="#66bb6a" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique en ligne - CA MAI / Mois */}
              <div className="graph-block">
                <h4>CA MAI / Mois</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <LineChart
                      data={(() => {
                        const monthlyData = {};
                        
                        // Agréger les données par mois (uniquement pour MAI)
                        for (const g of filtered) {
                          if (!g.dateCreation || !g.clientId) continue;
                          
                          // Vérifier que c'est bien MAI
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client || client.clientFullName !== 'Mai') continue;
                          
                          const date = new Date(g.dateCreation);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                          
                          if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = {
                              month: monthLabel,
                              value: 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          monthlyData[monthKey].value += caTTC;
                        }
                        
                        // Trier par mois chronologique
                        return Object.values(monthlyData)
                          .sort((a, b) => {
                            const monthA = a.month.split(' ')[1] + ' ' + a.month.split(' ')[0];
                            const monthB = b.month.split(' ')[1] + ' ' + b.month.split(' ')[0];
                            return new Date(monthA) - new Date(monthB);
                          });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          'Somme de CaTTC'
                        ]}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#66bb6a" 
                        strokeWidth={3}
                        dot={{ fill: '#66bb6a', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#66bb6a', strokeWidth: 2, fill: '#66bb6a' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
          </div>
          </div>
          ) : activeTab === 'ca-afa' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Graphique en barres - CA / Produit */}
              <div className="graph-block">
                <h4>CA / Produit</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const produitAfaData = {};
                        
                        // Agréger les données par produit (uniquement pour Africa First Assist)
                        for (const g of filtered) {
                          if (!g.produitId || !g.clientId) continue;
                          
                          // Vérifier que c'est bien Africa First Assist
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client || client.clientFullName !== 'Africa First Assist') continue;
                          
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          if (!produit) continue;
                          
                          const produitName = produit.name;
                          
                          if (!produitAfaData[produitName]) {
                            produitAfaData[produitName] = 0;
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          produitAfaData[produitName] += caTTC;
                        }
                        
                        // Trier par CA décroissant
                        return Object.entries(produitAfaData)
                          .sort(([,a], [,b]) => b - a)
                          .map(([name, value]) => ({
                            name,
                            value
                          }));
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                      />
                      <Bar dataKey="value" fill="#42a5f5" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique en ligne - CA AFA / Mois */}
              <div className="graph-block">
                <h4>CA Africa First Assist / Mois</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <LineChart
                      data={(() => {
                        const monthlyData = {};
                        
                        // Agréger les données par mois (uniquement pour Africa First Assist)
                        for (const g of filtered) {
                          if (!g.dateCreation || !g.clientId) continue;
                          
                          // Vérifier que c'est bien Africa First Assist
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          if (!client || client.clientFullName !== 'Africa First Assist') continue;
                          
                          const date = new Date(g.dateCreation);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                          
                          if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = {
                              month: monthLabel,
                              value: 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          monthlyData[monthKey].value += caTTC;
                        }
                        
                        // Trier par mois chronologique
                        return Object.values(monthlyData)
                          .sort((a, b) => {
                            const monthA = a.month.split(' ')[1] + ' ' + a.month.split(' ')[0];
                            const monthB = b.month.split(' ')[1] + ' ' + b.month.split(' ')[0];
                            return new Date(monthA) - new Date(monthB);
                          });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          'Somme de CaTTC'
                        ]}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#42a5f5" 
                        strokeWidth={3}
                        dot={{ fill: '#42a5f5', strokeWidth: 2, r: 6 }}
                        activeDot={{ r: 8, stroke: '#42a5f5', strokeWidth: 2, fill: '#42a5f5' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'marge-b2b' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Graphique en barres horizontales - Marge Ebdeta (TGCC) */}
              <div className="graph-block">
                <h4>Marge Ebdeta</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const monthlyMargeData = {};
                        
                        // Debug: afficher les données disponibles (désactivé en production)
                        // console.log('Données filtrées pour Marge B2B:', filtered);
                        // console.log('Clients disponibles:', clients.map(c => ({ id: c.id, name: c.clientFullName })));
                        // console.log('Structure des données globales:', filtered.length > 0 ? Object.keys(filtered[0]) : 'Aucune donnée');
                        
                        // Agréger les données par mois pour Tgcc
                        for (const g of filtered) {
                          if (!g.dateCreation || !g.clientId) continue;
                          
                          // Vérifier que c'est bien Tgcc
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          // console.log('Client trouvé:', client);
                          if (!client || client.clientFullName !== 'Tgcc') continue;
                          
                          const date = new Date(g.dateCreation);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' });
                          
                          if (!monthlyMargeData[monthKey]) {
                            monthlyMargeData[monthKey] = {
                              month: monthLabel,
                              caTTC: 0,
                              honoraireMedecin: 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          // Essayer différents champs pour les honoraires
                          const honoraireMedecin = Number(g.honoraireMedecin || g.honoraire || g.montantHonoraire || 0) || 0;
                          
                          monthlyMargeData[monthKey].caTTC += caTTC;
                          monthlyMargeData[monthKey].honoraireMedecin += honoraireMedecin;
                        }
                        
                        // Calculer la marge bénéficiaire et trier par mois chronologique
                        return Object.values(monthlyMargeData)
                          .map(data => ({
                            ...data,
                            margeBeneficiaire: data.caTTC - data.honoraireMedecin - 38500
                          }))
                          .sort((a, b) => {
                            const monthA = a.month.split(' ')[1] + ' ' + a.month.split(' ')[0];
                            const monthB = b.month.split(' ')[1] + ' ' + b.month.split(' ')[0];
                            return new Date(monthA) - new Date(monthB);
                          });
                      })()}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: 'marge_beneficiaire', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="month"
                        width={80}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'margeBeneficiaire') {
                            return [`${Number(value).toLocaleString('fr-FR')} DH`, 'Marge Bénéficiaire'];
                          }
                          return [`${Number(value).toLocaleString('fr-FR')} DH`, name];
                        }}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Bar dataKey="margeBeneficiaire" fill="#32CD32" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique en barres horizontales - Ebdeta Honoris */}
              <div className="graph-block">
                <h4>Ebdeta Honoris</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const monthlyMargeData = {};
                        
                        // Debug: afficher les données disponibles (désactivé en production)
                        // console.log('Données filtrées pour Groupe honoris:', filtered);
                        // console.log('Clients disponibles pour Groupe honoris:', clients.map(c => ({ id: c.id, name: c.clientFullName })));
                        
                        // Agréger les données par mois pour Groupe honoris
                        for (const g of filtered) {
                          if (!g.dateCreation || !g.clientId) continue;
                          
                          // Vérifier que c'est bien Groupe honoris
                          const client = clients.find(c => String(c.id) === String(g.clientId));
                          // console.log('Client Groupe honoris trouvé:', client);
                          if (!client || client.clientFullName !== 'Groupe honoris') continue;
                          
                          const date = new Date(g.dateCreation);
                          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                          const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', day: 'numeric', year: 'numeric' });
                          
                          if (!monthlyMargeData[monthKey]) {
                            monthlyMargeData[monthKey] = {
                              month: monthLabel,
                              caTTC: 0,
                              honoraireMedecin: 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          // Essayer différents champs pour les honoraires
                          const honoraireMedecin = Number(g.honoraireMedecin || g.honoraire || g.montantHonoraire || 0) || 0;
                          
                          monthlyMargeData[monthKey].caTTC += caTTC;
                          monthlyMargeData[monthKey].honoraireMedecin += honoraireMedecin;
                        }
                        
                        // Calculer la marge bénéficiaire et trier par mois chronologique
                        return Object.values(monthlyMargeData)
                          .map(data => ({
                            ...data,
                            margeBeneficiaire: data.caTTC - data.honoraireMedecin
                          }))
                          .sort((a, b) => {
                            const monthA = a.month.split(' ')[1] + ' ' + a.month.split(' ')[0];
                            const monthB = b.month.split(' ')[1] + ' ' + b.month.split(' ')[0];
                            return new Date(monthA) - new Date(monthB);
                          });
                      })()}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number"
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: 'marge_beneficiaire', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="month"
                        width={80}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'margeBeneficiaire') {
                            return [`${Number(value).toLocaleString('fr-FR')} DH`, 'Marge Bénéficiaire'];
                          }
                          return [`${Number(value).toLocaleString('fr-FR')} DH`, name];
                        }}
                        labelFormatter={(label) => `Mois: ${label}`}
                      />
                      <Bar dataKey="margeBeneficiaire" fill="#32CD32" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-medecin' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {/* Tableau détaillé - CA par Médecin / Produit avec nombre de fois */}
              <div className="graph-block">
                <h4>CA par Médecin / Produit (ACTE MEDECIN & TAM)</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th>Médecin</th>
                          <th>Client</th>
                          <th className="num">ACTE MEDECIN (CA)</th>
                          <th className="num">ACTE MEDECIN (Nb)</th>
                          <th className="num">TAM (CA)</th>
                          <th className="num">TAM (Nb)</th>
                          <th className="num">Total CA</th>
                          <th className="num">Total Missions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const medecinClientData = {};
                          
                          // Agréger les données par médecin, client et produit
                          for (const g of filtered) {
                            if (!g.medcienId) continue;
                            
                            const medecin = medecins.find(m => String(m.id) === String(g.medcienId));
                            if (!medecin) continue;
                            
                            const client = clients.find(c => String(c.id) === String(g.clientId));
                            const produit = produits.find(p => String(p.id) === String(g.produitId));
                            
                            // Ne garder que ACTE MEDECIN et TAM
                            if (!produit || (produit.name !== 'ACTE MEDECIN' && produit.name !== 'TAM')) continue;
                            
                            const medecinName = medecin.name || `${medecin.nom || ''} ${medecin.prenom || ''}`.trim();
                            const clientName = client ? client.clientFullName : 'Client inconnu';
                            const key = `${medecinName}|${clientName}`;
                            
                            if (!medecinClientData[key]) {
                              medecinClientData[key] = {
                                medecinName,
                                clientName,
                                acteMedecinCA: 0,
                                acteMedecinCount: 0,
                                tamCA: 0,
                                tamCount: 0,
                                totalCA: 0,
                                totalCount: 0
                              };
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            
                            if (produit.name === 'ACTE MEDECIN') {
                              medecinClientData[key].acteMedecinCA += caTTC;
                              medecinClientData[key].acteMedecinCount += 1;
                            } else if (produit.name === 'TAM') {
                              medecinClientData[key].tamCA += caTTC;
                              medecinClientData[key].tamCount += 1;
                            }
                            
                            medecinClientData[key].totalCA += caTTC;
                            medecinClientData[key].totalCount += 1;
                          }
                          
                          // Calculer les totaux généraux
                          const grandTotals = {
                            acteMedecinCA: 0,
                            acteMedecinCount: 0,
                            tamCA: 0,
                            tamCount: 0,
                            totalCA: 0,
                            totalCount: 0
                          };
                          
                          Object.values(medecinClientData).forEach(data => {
                            grandTotals.acteMedecinCA += data.acteMedecinCA;
                            grandTotals.acteMedecinCount += data.acteMedecinCount;
                            grandTotals.tamCA += data.tamCA;
                            grandTotals.tamCount += data.tamCount;
                            grandTotals.totalCA += data.totalCA;
                            grandTotals.totalCount += data.totalCount;
                          });
                          
                          // Trier par CA total décroissant
                          const sortedEntries = Object.values(medecinClientData)
                            .sort((a, b) => b.totalCA - a.totalCA);
                          
                          return [
                            // Lignes des médecins
                            ...sortedEntries.map((data, index) => (
                              <tr key={`${data.medecinName}-${data.clientName}`}>
                                <td style={{ fontSize: '0.9rem' }}>{data.medecinName}</td>
                                <td style={{ fontSize: '0.9rem' }}>{data.clientName}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>
                                  {data.acteMedecinCA > 0 ? Number(data.acteMedecinCA).toLocaleString('fr-FR') + ' DH' : '-'}
                                </td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>
                                  {data.acteMedecinCount > 0 ? data.acteMedecinCount : '-'}
                                </td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>
                                  {data.tamCA > 0 ? Number(data.tamCA).toLocaleString('fr-FR') + ' DH' : '-'}
                                </td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>
                                  {data.tamCount > 0 ? data.tamCount : '-'}
                                </td>
                                <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  {Number(data.totalCA).toLocaleString('fr-FR')} DH
                                </td>
                                <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  {data.totalCount}
                                </td>
                              </tr>
                            )),
                            // Ligne de total
                            <tr key="grand-total" style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                              <td style={{ fontSize: '0.9rem', fontWeight: 'bold' }} colSpan="2">Grand total</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {Number(grandTotals.acteMedecinCA).toLocaleString('fr-FR')} DH
                              </td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {grandTotals.acteMedecinCount}
                              </td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {Number(grandTotals.tamCA).toLocaleString('fr-FR')} DH
                              </td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {grandTotals.tamCount}
                              </td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1976d2' }}>
                                {Number(grandTotals.totalCA).toLocaleString('fr-FR')} DH
                              </td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1976d2' }}>
                                {grandTotals.totalCount}
                              </td>
                            </tr>
                          ];
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '600px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Graphique en barres - Résumé CA par Médecin */}
              <div className="graph-block">
                <h4>Résumé CA par Médecin (ACTE MEDECIN + TAM)</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const medecinSummary = {};
                        
                        // Agréger les données par médecin pour ACTE MEDECIN et TAM uniquement
                        for (const g of filtered) {
                          if (!g.medcienId) continue;
                          
                          const medecin = medecins.find(m => String(m.id) === String(g.medcienId));
                          const produit = produits.find(p => String(p.id) === String(g.produitId));
                          
                          if (!medecin || !produit || (produit.name !== 'ACTE MEDECIN' && produit.name !== 'TAM')) continue;
                          
                          const medecinName = medecin.name || `${medecin.nom || ''} ${medecin.prenom || ''}`.trim();
                          
                          if (!medecinSummary[medecinName]) {
                            medecinSummary[medecinName] = {
                              name: medecinName,
                              'ACTE MEDECIN': 0,
                              'TAM': 0
                            };
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          medecinSummary[medecinName][produit.name] += caTTC;
                        }
                        
                        // Trier par CA total décroissant
                        return Object.values(medecinSummary)
                          .sort((a, b) => (b['ACTE MEDECIN'] + b['TAM']) - (a['ACTE MEDECIN'] + a['TAM']))
                          .slice(0, 10); // Limiter aux 10 premiers pour la lisibilité
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          name
                        ]}
                        labelFormatter={(label) => `Médecin: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="ACTE MEDECIN" stackId="a" fill="#4fc3f7" name="ACTE MEDECIN" />
                      <Bar dataKey="TAM" stackId="a" fill="#81c784" name="TAM" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ca-infirmier' ? (
            <div className="mobile-single-column" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Graphique en barres - CA / Infirmier */}
              <div className="graph-block">
                <h4>CA / Infirmier</h4>
                {!loading && filtered.length > 0 ? (
                  <ResponsiveContainer width="100%" height={getResponsiveHeight(windowWidth)}>
                    <BarChart
                      data={(() => {
                        const infirmierData = {};
                        
                        // Agréger les données par infirmier
                        for (const g of filtered) {
                          if (!g.infermierId) continue;
                          
                          const infirmier = infirmiers.find(i => String(i.id) === String(g.infermierId));
                          if (!infirmier) continue;
                          
                          const infirmierName = infirmier.nom || `${infirmier.nom || ''} ${infirmier.prenom || ''}`.trim();
                          
                          if (!infirmierData[infirmierName]) {
                            infirmierData[infirmierName] = 0;
                          }
                          
                          const caTTC = Number(g.caTTC) || 0;
                          infirmierData[infirmierName] += caTTC;
                        }
                        
                        // Trier par CA décroissant
                        return Object.entries(infirmierData)
                          .sort(([,a], [,b]) => b - a)
                          .map(([name, value]) => ({
                            name,
                            value
                          }));
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        interval={0}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        tickFormatter={(value) => value.toLocaleString('fr-FR')}
                        label={{ value: '', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${Number(value).toLocaleString('fr-FR')} DH`,
                          'CA TTC'
                        ]}
                        labelFormatter={(label) => `Infirmier: ${label}`}
                      />
                      <Bar dataKey="value" fill="#ab47bc" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>

              {/* Tableau - CA / Infirmier */}
              <div className="graph-block">
                <h4>CA / Infirmier - Tableau</h4>
                {!loading && filtered.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="simple-table">
                      <thead>
                        <tr>
                          <th className="rank">#</th>
                          <th>Infirmier</th>
                          <th className="num">CA TTC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const infirmierData = {};
                          
                          // Agréger les données par infirmier
                          for (const g of filtered) {
                            if (!g.infermierId) continue;
                            
                            const infirmier = infirmiers.find(i => String(i.id) === String(g.infermierId));
                            if (!infirmier) continue;
                            
                            const infirmierName = infirmier.nom || `${infirmier.nom || ''} ${infirmier.prenom || ''}`.trim();
                            
                            if (!infirmierData[infirmierName]) {
                              infirmierData[infirmierName] = 0;
                            }
                            
                            const caTTC = Number(g.caTTC) || 0;
                            infirmierData[infirmierName] += caTTC;
                          }
                          
                          // Calculer le total général
                          const grandTotal = Object.values(infirmierData).reduce((sum, value) => sum + value, 0);
                          
                          // Trier par CA décroissant et ajouter la ligne de total
                          const sortedEntries = Object.entries(infirmierData)
                            .sort(([,a], [,b]) => b - a);
                          
                          return [
                            // Lignes des infirmiers
                            ...sortedEntries.map(([infirmierName, caTTC], index) => (
                              <tr key={infirmierName}>
                                <td className="rank">{index + 1}</td>
                                <td style={{ fontSize: '0.9rem' }}>{infirmierName}</td>
                                <td className="num" style={{ fontSize: '0.9rem' }}>{Number(caTTC).toLocaleString('fr-FR')} DH</td>
                              </tr>
                            )),
                            // Ligne de total
                            <tr key="grand-total" style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', borderTop: '2px solid #dee2e6' }}>
                              <td className="rank" style={{ fontWeight: 'bold' }}>-</td>
                              <td style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Grand total</td>
                              <td className="num" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1976d2' }}>{Number(grandTotal).toLocaleString('fr-FR')} DH</td>
                            </tr>
                          ];
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '400px',
                    color: '#666',
                    fontSize: '1.1rem'
                  }}>
                    {loading ? 'Chargement...' : 'Aucune donnée disponible'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="graph-block" style={{ padding: '2rem', background: '#fff', borderRadius: 8 }}>
              Onglet actif: <strong>{TABS.find(t => t.key === activeTab)?.label}</strong>
              <div style={{ marginTop: 8, color: '#6b7280' }}>
                Aucun graphe pour le moment. Dites-moi onglet par onglet quels graphiques vous souhaitez.
          </div>
          </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Data; 