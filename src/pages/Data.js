import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import './Data.css';

const COLORS = ['#1976d2', '#43a047', '#f44336', '#ff9800', '#8e24aa', '#0288d1', '#388e3c', '#e57373', '#00bcd4', '#cddc39'];


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
`;

function formatDate(date) {
  return date.toISOString().split('T')[0];
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

  // Filtres
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterVille, setFilterVille] = useState([]);
  const [filterBU, setFilterBU] = useState([]);
  const [filterProduit, setFilterProduit] = useState([]);
  const [filterEtat, setFilterEtat] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [globalesRes, villesRes, produitsRes, buRes, clientsRes, ambulancesRes] = await Promise.all([
          api.get('/globales'),
          api.get('/villes'),
          api.get('/produits'),
          api.get('/business-units'),
          api.get('/clients'),
          api.get('/ambulances'),
        ]);
        setGlobales(globalesRes.data);
        setVilles(villesRes.data);
        setProduits(produitsRes.data);
        setBusinessUnits(buRes.data);
        setClients(clientsRes.data);
        setAmbulances(ambulancesRes.data);
      } catch (err) {
        setGlobales([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Application des filtres
  const filtered = globales.filter(g => {
    if (filterStart && g.dateCreation && g.dateCreation < filterStart) return false;
    if (filterEnd && g.dateCreation && g.dateCreation > filterEnd) return false;
    if (filterVille.length > 0 && !filterVille.includes(String(g.villeId))) return false;
    if (filterBU.length > 0 && !filterBU.includes(String(g.businessUnitId))) return false;
    if (filterProduit.length > 0 && !filterProduit.includes(String(g.produitId))) return false;
    if (filterEtat.length > 0 && !filterEtat.includes(String(g.etatdePaiment))) return false;
    return true;
  });

  // KPI principaux
  const totalRecords = filtered.length;
  const totalCAHT = filtered.reduce((sum, g) => sum + (Number(g.caHT) || 0), 0);
  const totalCATTC = filtered.reduce((sum, g) => sum + (Number(g.caTTC) || 0), 0);
  const uniqueClients = new Set(filtered.map(g => g.clientId).filter(Boolean)).size;

  // Interventions par mois
  const interventionsByMonth = {};
  filtered.forEach(g => {
    if (!g.dateCreation) return;
    const month = g.dateCreation.slice(0,7); // YYYY-MM
    interventionsByMonth[month] = (interventionsByMonth[month] || 0) + 1;
  });
  const interventionsByMonthArr = Object.entries(interventionsByMonth).map(([month, count]) => ({ month, count }));

  // CA par mois
  const caByMonth = {};
  filtered.forEach(g => {
    if (!g.dateCreation) return;
    const month = g.dateCreation.slice(0,7);
    caByMonth[month] = caByMonth[month] || { month, caHT: 0, caTTC: 0 };
    caByMonth[month].caHT += Number(g.caHT) || 0;
    caByMonth[month].caTTC += Number(g.caTTC) || 0;
  });
  const caByMonthArr = Object.values(caByMonth);

  // Répartition par ville
  const repVille = {};
  filtered.forEach(g => {
    const ville = villes.find(v => String(v.id) === String(g.villeId));
    const name = ville ? ville.name : 'Inconnu';
    repVille[name] = (repVille[name] || 0) + 1;
  });
  const repVilleArr = Object.entries(repVille).map(([name, value]) => ({ name, value }));

  // Répartition par produit
  const repProduit = {};
  filtered.forEach(g => {
    const prod = produits.find(p => String(p.id) === String(g.produitId));
    const name = prod ? prod.name : 'Inconnu';
    repProduit[name] = (repProduit[name] || 0) + 1;
  });
  const repProduitArr = Object.entries(repProduit).map(([name, value]) => ({ name, value }));

  // Répartition par état de paiement
  const repEtat = {};
  filtered.forEach(g => {
    const etat = g.etatdePaiment || 'Inconnu';
    repEtat[etat] = (repEtat[etat] || 0) + 1;
  });
  const repEtatArr = Object.entries(repEtat).map(([name, value]) => ({ name, value }));

  // Top 5 clients
  const clientsCount = {};
  filtered.forEach(g => {
    if (g.clientId) clientsCount[g.clientId] = (clientsCount[g.clientId] || 0) + 1;
  });
  const topClientsRaw = Object.entries(clientsCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id, value]) => ({ id, value }));
  const topClients = topClientsRaw.map(tc => {
    const client = clients.find(c => String(c.id) === String(tc.id));
    return { ...tc, name: client ? client.clientFullName : tc.id };
  });

  // Top 5 ambulances
  const ambCount = {};
  filtered.forEach(g => {
    if (g.aumbulanceId) ambCount[g.aumbulanceId] = (ambCount[g.aumbulanceId] || 0) + 1;
  });
  const topAmbRaw = Object.entries(ambCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id, value]) => ({ id, value }));
  const topAmb = topAmbRaw.map(ta => {
    const ambulance = ambulances.find(a => String(a.id) === String(ta.id));
    return { ...ta, name: ambulance ? ambulance.numberPlate : ta.id };
  });

  // Interventions par businessUnitType
  const interventionsByBU = filtered.reduce((acc, g) => {
    const bu = g.businessUnitType || 'Inconnu';
    acc[bu] = (acc[bu] || 0) + 1;
    return acc;
  }, {});
  const interventionsByBUArr = Object.entries(interventionsByBU).map(([bu, count]) => ({ bu, count }));

  // Interventions par état de paiement
  const interventionsByEtat = filtered.reduce((acc, g) => {
    const etat = g.etatdePaiment || 'Inconnu';
    acc[etat] = (acc[etat] || 0) + 1;
    return acc;
  }, {});
  const interventionsByEtatArr = Object.entries(interventionsByEtat).map(([etat, count]) => ({ etat, count }));

  // CA TTC par ambulance
  const caTTCByAmbulance = {};
  filtered.forEach(g => {
    if (g.aumbulanceId) {
      caTTCByAmbulance[g.aumbulanceId] = (caTTCByAmbulance[g.aumbulanceId] || 0) + (Number(g.caTTC) || 0);
    }
  });
  const caTTCByAmbulanceArr = Object.entries(caTTCByAmbulance).map(([id, value]) => {
    const ambulance = ambulances.find(a => String(a.id) === String(id));
    return { name: ambulance ? ambulance.numberPlate : id, value };
  });

  // CA Global par businessUnitType
  const caByBU = {};
  filtered.forEach(g => {
    const bu = g.businessUnitType || 'Inconnu';
    caByBU[bu] = (caByBU[bu] || 0) + (Number(g.caTTC) || 0);
  });
  const caByBUArr = Object.entries(caByBU).map(([bu, value]) => ({ bu, value }));

  // Style pour les dropdowns avec checkboxes
  const dropdownStyle = {
    position: 'relative',
    display: 'inline-block',
  };

  const dropdownContentStyle = {
    display: 'block',
    position: 'absolute',
    backgroundColor: '#f9f9f9',
    minWidth: '200px',
    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
    zIndex: 1,
    maxHeight: '300px',
    overflowY: 'auto',
    borderRadius: '4px',
  };

  const dropdownItemStyle = {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f1f1f1',
    },
  };

  const dropdownButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: '200px',
    textAlign: 'left',
    color: '#333',
    fontSize: '1rem',
    fontWeight: 400,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    display: 'block',
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
      <Sidebar />
      <main className="data-main">
        <h2 className="data-title">KPI Globale</h2>
        {/* Filtres */}
        <section className="data-filters">
          <div>
            <label>Date début :</label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
          </div>
          <div>
            <label>Date fin :</label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
          </div>
          <div style={dropdownStyle} className="dropdown-container">
            <label>Ville :</label>
            <button 
              style={dropdownButtonStyle}
              onClick={() => setOpenDropdown(openDropdown === 'ville' ? null : 'ville')}
            >
              {getSelectedText(filterVille, villes)}
            </button>
            {openDropdown === 'ville' && (
              <div style={dropdownContentStyle}>
                {villes.map(v => (
                  <div 
                    key={v.id} 
                    style={dropdownItemStyle}
                    onClick={() => handleMultiSelect(String(v.id), filterVille, setFilterVille)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filterVille.includes(String(v.id))}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    {v.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={dropdownStyle} className="dropdown-container">
            <label>Business Unit :</label>
            <button 
              style={dropdownButtonStyle}
              onClick={() => setOpenDropdown(openDropdown === 'bu' ? null : 'bu')}
            >
              {getSelectedText(filterBU, businessUnits, 'businessUnitType')}
            </button>
            {openDropdown === 'bu' && (
              <div style={dropdownContentStyle}>
                {businessUnits.map(bu => (
                  <div 
                    key={bu.id} 
                    style={dropdownItemStyle}
                    onClick={() => handleMultiSelect(String(bu.id), filterBU, setFilterBU)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filterBU.includes(String(bu.id))}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    {bu.businessUnitType}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={dropdownStyle} className="dropdown-container">
            <label>État paiement :</label>
            <button 
              style={dropdownButtonStyle}
              onClick={() => setOpenDropdown(openDropdown === 'etat' ? null : 'etat')}
            >
              {getSelectedTextEtat(filterEtat, Array.from(new Set(globales.map(g => g.etatdePaiment).filter(Boolean))))}
            </button>
            {openDropdown === 'etat' && (
              <div style={dropdownContentStyle}>
                {Array.from(new Set(globales.map(g => g.etatdePaiment).filter(Boolean))).map(etat => (
                  <div 
                    key={etat} 
                    style={dropdownItemStyle}
                    onClick={() => handleMultiSelect(String(etat), filterEtat, setFilterEtat)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filterEtat.includes(String(etat))}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    {etat}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={dropdownStyle} className="dropdown-container">
            <label>Produit :</label>
            <button 
              style={dropdownButtonStyle}
              onClick={() => setOpenDropdown(openDropdown === 'produit' ? null : 'produit')}
            >
              {getSelectedText(filterProduit, produits)}
            </button>
            {openDropdown === 'produit' && (
              <div style={{...dropdownContentStyle, minWidth: '240px'}}>
                {produits.map(p => (
                  <div 
                    key={p.id} 
                    style={dropdownItemStyle}
                    onClick={() => handleMultiSelect(String(p.id), filterProduit, setFilterProduit)}
                  >
                    <input 
                      type="checkbox" 
                      checked={filterProduit.includes(String(p.id))}
                      onChange={() => {}}
                      style={checkboxStyle}
                    />
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </section>
        {/* KPI Cards */}
        <section className="data-kpis">
          <div className="data-kpi-card">
            <div className="kpi-value kpi-blue">{totalRecords}</div>
            <div className="kpi-label">Enregistrements</div>
          </div>
          <div className="data-kpi-card">
            <div className="kpi-value kpi-green">{totalCAHT.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} DH</div>
            <div className="kpi-label">CA Total HT</div>
          </div>
          <div className="data-kpi-card">
            <div className="kpi-value kpi-green2">{totalCATTC.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} DH</div>
            <div className="kpi-label">CA Total TTC</div>
          </div>
          <div className="data-kpi-card">
            <div className="kpi-value kpi-cyan">{uniqueClients}</div>
            <div className="kpi-label">Clients distincts</div>
          </div>
        </section>
        {/* Graphiques */}
        <section className="data-graphs">
          {/* Interventions par mois */}
          <div className="graph-block">
            <h4>Interventions par mois</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={interventionsByMonthArr} margin={{top:10, right:20, left:0, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* CA par mois */}
          <div className="graph-block">
            <h4>CA par mois</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={caByMonthArr} margin={{top:10, right:20, left:0, bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="caHT" stroke="#43a047" strokeWidth={2} name="CA HT" />
                <Line type="monotone" dataKey="caTTC" stroke="#388e3c" strokeWidth={2} name="CA TTC" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Répartition par ville */}
          <div className="graph-block">
            <h4>Répartition par ville</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repVilleArr} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={(value, name, props) => [`${value} (${getPercent(value, repVilleArr.reduce((a,b)=>a+b.value,0))})`, name]} />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Répartition par produit */}
          <div className="graph-block">
            <h4>Répartition par produit</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repProduitArr} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={(value, name, props) => [`${value} (${getPercent(value, repProduitArr.reduce((a,b)=>a+b.value,0))})`, name]} />
                <Bar dataKey="value" fill="#43a047" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Répartition par état de paiement */}
          <div className="graph-block">
            <h4>Répartition par état de paiement</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={repEtatArr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {repEtatArr.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Top 5 clients */}
          <div className="graph-block">
            <h4>Top 5 clients</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Top 5 ambulances */}
          <div className="graph-block">
            <h4>Top 5 ambulances</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAmb} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#43a047" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Interventions par businessUnitType */}
          <div className="graph-block">
            <h4>Interventions par businessUnitType</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={interventionsByBUArr} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="bu" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8e24aa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Interventions par état de paiement */}
          <div className="graph-block">
            <h4>Interventions par état de paiement</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={interventionsByEtatArr} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="etat" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* CA TTC par ambulance */}
          <div className="graph-block">
            <h4>CA TTC par ambulance</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={caTTCByAmbulanceArr} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip formatter={v => `${v.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} DH`} />
                <Bar dataKey="value" fill="#00bcd4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* CA Global par businessUnitType */}
          <div className="graph-block">
            <h4>CA Global par businessUnitType</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={caByBUArr} dataKey="value" nameKey="bu" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={false} labelLine={false}>
                  {caByBUArr.map((entry, idx) => <Cell key={entry.bu} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `${v.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} DH`} />
                <Legend formatter={(value) => {
                  const entry = caByBUArr.find(e => e.bu === value);
                  if (!entry) return value;
                  const percent = getPercent(entry.value, caByBUArr.reduce((a,b)=>a+b.value,0));
                  return `${value}: ${percent}`;
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Data; 