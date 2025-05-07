import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar, ResponsiveContainer
} from 'recharts';

const COLORS = ['#1976d2', '#43a047', '#f44336', '#ff9800', '#8e24aa', '#0288d1', '#388e3c', '#e57373', '#00bcd4', '#cddc39'];

const kpiCardStyle = {
  background: '#fff',
  borderRadius: '10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  padding: '2rem',
  minWidth: 220,
  minHeight: 120,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'center',
  margin: '1rem',
};

const filterRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginBottom: '2rem',
  flexWrap: 'wrap',
  alignItems: 'center',
};

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

const Data = () => {
  const [globales, setGlobales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [villes, setVilles] = useState([]);
  const [produits, setProduits] = useState([]);
  const [businessUnits, setBusinessUnits] = useState([]);

  // Filtres
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterVille, setFilterVille] = useState('');
  const [filterBU, setFilterBU] = useState('');
  const [filterProduit, setFilterProduit] = useState('');
  const [filterEtat, setFilterEtat] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [globalesRes, villesRes, produitsRes, buRes] = await Promise.all([
          api.get('/globales'),
          api.get('/villes'),
          api.get('/produits'),
          api.get('/business-units'),
        ]);
        setGlobales(globalesRes.data);
        setVilles(villesRes.data);
        setProduits(produitsRes.data);
        setBusinessUnits(buRes.data);
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
    if (filterVille && String(g.villeId) !== String(filterVille)) return false;
    if (filterBU && String(g.businessUnitId) !== String(filterBU)) return false;
    if (filterProduit && String(g.produitId) !== String(filterProduit)) return false;
    if (filterEtat && String(g.etatdePaiment) !== String(filterEtat)) return false;
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
  const topClients = Object.entries(clientsCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id, value]) => ({ id, value }));

  // Top 5 ambulances
  const ambCount = {};
  filtered.forEach(g => {
    if (g.aumbulanceId) ambCount[g.aumbulanceId] = (ambCount[g.aumbulanceId] || 0) + 1;
  });
  const topAmb = Object.entries(ambCount).sort((a,b) => b[1]-a[1]).slice(0,5).map(([id, value]) => ({ id, value }));

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

  return (
    <div style={{display:'flex'}}>
      <Sidebar />
      <main style={{flex:1, background:'#f6f8fa', minHeight:'100vh', padding:'2rem'}}>
        <h2 style={{fontWeight:'bold', color:'#1976d2', marginBottom:'2rem'}}>KPI Globale</h2>
        {/* Filtres */}
        <div style={filterRowStyle}>
          <div>
            <label>Date début : </label>
            <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
          </div>
          <div>
            <label>Date fin : </label>
            <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
          </div>
          <div>
            <label>Ville : </label>
            <select value={filterVille} onChange={e => setFilterVille(e.target.value)}>
              <option value="">Toutes</option>
              {villes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label>Business Unit : </label>
            <select value={filterBU} onChange={e => setFilterBU(e.target.value)}>
              <option value="">Toutes</option>
              {businessUnits.map(bu => <option key={bu.id} value={bu.id}>{bu.businessUnitType}</option>)}
            </select>
          </div>
          <div>
            <label>Produit : </label>
            <select value={filterProduit} onChange={e => setFilterProduit(e.target.value)}>
              <option value="">Tous</option>
              {produits.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label>État paiement : </label>
            <select value={filterEtat} onChange={e => setFilterEtat(e.target.value)}>
              <option value="">Tous</option>
              {Array.from(new Set(globales.map(g => g.etatdePaiment).filter(Boolean))).map(etat => (
                <option key={etat} value={etat}>{etat}</option>
              ))}
            </select>
          </div>
        </div>
        {/* KPI Cards */}
        <div style={{display:'flex', flexWrap:'wrap', gap:'2rem'}}>
          <div style={kpiCardStyle}>
            <div style={{fontSize:'2.2rem', fontWeight:'bold', color:'#1976d2'}}>{totalRecords}</div>
            <div style={{marginTop:8, color:'#555'}}>Enregistrements</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{fontSize:'2.2rem', fontWeight:'bold', color:'#43a047'}}>{totalCAHT.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</div>
            <div style={{marginTop:8, color:'#555'}}>CA Total HT</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{fontSize:'2.2rem', fontWeight:'bold', color:'#388e3c'}}>{totalCATTC.toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2})} €</div>
            <div style={{marginTop:8, color:'#555'}}>CA Total TTC</div>
          </div>
          <div style={kpiCardStyle}>
            <div style={{fontSize:'2.2rem', fontWeight:'bold', color:'#0288d1'}}>{uniqueClients}</div>
            <div style={{marginTop:8, color:'#555'}}>Clients distincts</div>
          </div>
        </div>
        {/* Graphiques */}
        <div style={{display:'flex', flexWrap:'wrap', gap:'2rem', marginTop:'2.5rem'}}>
          {/* Interventions par mois */}
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 400px', minWidth:350}}>
            <h4 style={{marginBottom:16, color:'#1976d2'}}>Interventions par mois</h4>
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
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 400px', minWidth:350}}>
            <h4 style={{marginBottom:16, color:'#43a047'}}>CA par mois</h4>
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
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#0288d1'}}>Répartition par ville</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={repVilleArr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {repVilleArr.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Répartition par produit */}
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#8e24aa'}}>Répartition par produit</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={repProduitArr} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {repProduitArr.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Répartition par état de paiement */}
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#f44336'}}>Répartition par état de paiement</h4>
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
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#1976d2'}}>Top 5 clients</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="id" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Top 5 ambulances */}
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#43a047'}}>Top 5 ambulances</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topAmb} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="id" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="#43a047" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Interventions par businessUnitType */}
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#8e24aa'}}>Interventions par businessUnitType</h4>
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
          <div style={{background:'#fff', borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.08)', padding:'1.5rem', flex:'1 1 350px', minWidth:320}}>
            <h4 style={{marginBottom:16, color:'#f44336'}}>Interventions par état de paiement</h4>
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
        </div>
      </main>
    </div>
  );
};

export default Data; 