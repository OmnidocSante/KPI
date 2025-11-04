import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { 
  fetchClients, 
  createClient, 
  updateClient, 
  deleteClient,
  fetchClientKPIs,
  fetchVilles
} from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
// Note: jsPDF et jspdf-autotable devront être installés avec: npm install jspdf jspdf-autotable
// Pour l'instant, on utilisera une alternative simple pour l'export PDF

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

const ClientsKPI = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTypeStructure, setFilterTypeStructure] = useState('');
  const [filterSecteur, setFilterSecteur] = useState('');
  const [filterContrat, setFilterContrat] = useState('');
  const [filterPrestation, setFilterPrestation] = useState('');
  
  // États pour les KPI
  const [kpis, setKpis] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    clientFullName: '',
    typeStructure: '',
    secteurActivite: '',
    adresse: '',
    telephone: '',
    email: '',
    typeContrat: '',
    nombreCollaborateurs: '',
    prestationsIncluses: [],
    villeId: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactFunction: ''
  });

  // Options pour les prestations
  const prestationsOptions = [
    'Assistance médicale',
    'Médecine du travail',
    'Téléconsultation',
    'Caution d\'hospitalisation',
    'Actes infirmiers'
  ];

  // Charger les données
  useEffect(() => {
    loadClients();
    loadVilles();
    loadKPIs();
  }, []);

  // Appliquer les filtres
  useEffect(() => {
    let filtered = [...clients];

    if (searchQuery) {
      filtered = filtered.filter(client =>
        (client.clientFullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.secteurActivite || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.typeContrat || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterTypeStructure) {
      filtered = filtered.filter(client => client.typeStructure === filterTypeStructure);
    }

    if (filterSecteur) {
      filtered = filtered.filter(client => 
        (client.secteurActivite || '').toLowerCase().includes(filterSecteur.toLowerCase())
      );
    }

    if (filterContrat) {
      filtered = filtered.filter(client => client.typeContrat === filterContrat);
    }

    if (filterPrestation) {
      filtered = filtered.filter(client => 
        client.prestationsIncluses && 
        Array.isArray(client.prestationsIncluses) &&
        client.prestationsIncluses.includes(filterPrestation)
      );
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, filterTypeStructure, filterSecteur, filterContrat, filterPrestation]);

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

  const loadKPIs = async () => {
    setKpiLoading(true);
    try {
      const res = await fetchClientKPIs();
      setKpis(res.data);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des KPI", type: 'error' });
    }
    setKpiLoading(false);
  };

  const openAddModal = () => {
    setEditClient(null);
    setFormData({
      clientFullName: '',
      typeStructure: '',
      secteurActivite: '',
      adresse: '',
      telephone: '',
      email: '',
      typeContrat: '',
      nombreCollaborateurs: '',
      prestationsIncluses: [],
      villeId: '',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      primaryContactFunction: ''
    });
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditClient(client);
    setFormData({
      clientFullName: client.clientFullName || '',
      typeStructure: client.typeStructure || '',
      secteurActivite: client.secteurActivite || '',
      adresse: client.adresse || '',
      telephone: client.telephone || '',
      email: client.email || '',
      typeContrat: client.typeContrat || '',
      nombreCollaborateurs: client.nombreCollaborateurs || '',
      prestationsIncluses: Array.isArray(client.prestationsIncluses) ? client.prestationsIncluses : [],
      villeId: client.villeId || '',
      primaryContactName: client.primaryContactName || '',
      primaryContactEmail: client.primaryContactEmail || '',
      primaryContactPhone: client.primaryContactPhone || '',
      primaryContactFunction: client.primaryContactFunction || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editClient) {
        await updateClient(editClient.id, formData);
        setNotification({ message: 'Client modifié avec succès', type: 'success' });
      } else {
        await createClient(formData);
        setNotification({ message: 'Client ajouté avec succès', type: 'success' });
      }
      setShowModal(false);
      loadClients();
      loadKPIs();
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
      loadKPIs();
    } catch (e) {
      setNotification({ message: "Erreur lors de la suppression", type: 'error' });
    }
  };

  const handlePrestationChange = (prestation) => {
    setFormData(prev => ({
      ...prev,
      prestationsIncluses: prev.prestationsIncluses.includes(prestation)
        ? prev.prestationsIncluses.filter(p => p !== prestation)
        : [...prev.prestationsIncluses, prestation]
    }));
  };

  // Export Excel
  const handleExportExcel = () => {
    const dataToExport = filteredClients.map(client => ({
      'ID': client.id,
      'Nom / Dénomination': client.clientFullName,
      'Type de structure': client.typeStructure || '',
      'Secteur d\'activité': client.secteurActivite || '',
      'Adresse': client.adresse || '',
      'Téléphone': client.telephone || '',
      'Email': client.email || '',
      'Type de contrat': client.typeContrat || '',
      'Nombre de collaborateurs': client.nombreCollaborateurs || '',
      'Prestations incluses': Array.isArray(client.prestationsIncluses) ? client.prestationsIncluses.join(', ') : '',
      'Ville': client.villeName || '',
      'Date de création': client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'clients_kpi.xlsx');
    setNotification({ message: 'Export Excel réussi', type: 'success' });
  };

  // Export PDF (version simplifiée sans jsPDF)
  const handleExportPDF = () => {
    // Créer un tableau HTML et l'imprimer/enregistrer en PDF via le navigateur
    let htmlContent = `
      <html>
        <head>
          <title>Rapport Clients KPI</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1976d2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1976d2; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Rapport Clients KPI</h1>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          <p><strong>Total clients:</strong> ${filteredClients.length}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Type</th>
                <th>Secteur</th>
                <th>Contrat</th>
                <th>Collaborateurs</th>
                <th>Prestations</th>
              </tr>
            </thead>
            <tbody>
    `;

    filteredClients.forEach(client => {
      htmlContent += `
        <tr>
          <td>${client.id}</td>
          <td>${client.clientFullName || ''}</td>
          <td>${client.typeStructure || ''}</td>
          <td>${client.secteurActivite || ''}</td>
          <td>${client.typeContrat || ''}</td>
          <td>${client.nombreCollaborateurs || ''}</td>
          <td>${Array.isArray(client.prestationsIncluses) ? client.prestationsIncluses.join(', ') : ''}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    setNotification({ message: 'Export PDF réussi (ouvrez la fenêtre d\'impression)', type: 'success' });
  };

  // Couleurs pour les graphiques
  const COLORS = ['#1976d2', '#43a047', '#f57c00', '#7b1fa2', '#c62828', '#00897b'];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          {/* Section KPI */}
          {!kpiLoading && kpis && (
            <div className="table-section" style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '1.5rem' }}>📈 Indicateurs Clés</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2', marginBottom: '0.5rem' }}>
                    {kpis.totalClients}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.95rem', fontWeight: 600 }}>Total clients</div>
                </div>
                
                {kpis.byTypeStructure?.map((item, index) => (
                  <div key={index} style={{ background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: COLORS[index % COLORS.length], marginBottom: '0.5rem' }}>
                      {item.count}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.95rem', fontWeight: 600 }}>{item.typeStructure}</div>
                  </div>
                ))}
              </div>

              {/* Graphiques */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Répartition par type de structure */}
                {kpis.byTypeStructure && kpis.byTypeStructure.length > 0 && (
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#2c3e50', fontWeight: 600 }}>Répartition par type de structure</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={kpis.byTypeStructure}
                          dataKey="count"
                          nameKey="typeStructure"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {kpis.byTypeStructure.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Répartition par secteur */}
                {kpis.bySecteur && kpis.bySecteur.length > 0 && (
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#2c3e50', fontWeight: 600 }}>Répartition par secteur d'activité</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={kpis.bySecteur}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="secteurActivite" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#1976d2" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Répartition par type de contrat */}
                {kpis.byContrat && kpis.byContrat.length > 0 && (
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#2c3e50', fontWeight: 600 }}>Répartition par type de contrat</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={kpis.byContrat}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="typeContrat" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#43a047" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Évolution du portefeuille client */}
                {kpis.evolutionByMonth && kpis.evolutionByMonth.length > 0 && (
                  <div style={{ background: 'white', padding: '1.5rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#2c3e50', fontWeight: 600 }}>Évolution du portefeuille client</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={kpis.evolutionByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#1976d2" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Tableau */}
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', margin: 0 }}>📊 Module Client KPI</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
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
                  onClick={handleExportExcel}
                  style={{
                    background: 'linear-gradient(45deg, #43a047, #66bb6a)',
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
                    boxShadow: '0 2px 4px rgba(67, 160, 71, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  📥 Export Excel
                </button>
                <button 
                  onClick={handleExportPDF}
                  style={{
                    background: 'linear-gradient(45deg, #f57c00, #ff9800)',
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
                    boxShadow: '0 2px 4px rgba(245, 124, 0, 0.1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  📄 Export PDF
                </button>
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

            {/* Filtres avancés */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid #e3e6f0' }}>
              <h3 style={{ marginBottom: '1rem', color: '#2c3e50', fontSize: '1.1rem', fontWeight: 600 }}>🔍 Filtres avancés</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <select
                  value={filterTypeStructure}
                  onChange={e => setFilterTypeStructure(e.target.value)}
                  style={{ 
                    padding: '0.7rem 1rem', 
                    borderRadius: '8px', 
                    border: '1.5px solid #e3e6f0', 
                    fontSize: '0.95rem',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Tous les types</option>
                  <option value="Entreprise">Entreprise</option>
                  <option value="Assurance">Assurance</option>
                  <option value="École">École</option>
                  <option value="Clinique">Clinique</option>
                  <option value="Institution">Institution</option>
                </select>
                <input
                  type="text"
                  placeholder="Secteur d'activité"
                  value={filterSecteur}
                  onChange={e => setFilterSecteur(e.target.value)}
                  style={{ 
                    padding: '0.7rem 1rem', 
                    borderRadius: '8px', 
                    border: '1.5px solid #e3e6f0', 
                    fontSize: '0.95rem',
                    background: '#fff'
                  }}
                />
                <select
                  value={filterContrat}
                  onChange={e => setFilterContrat(e.target.value)}
                  style={{ 
                    padding: '0.7rem 1rem', 
                    borderRadius: '8px', 
                    border: '1.5px solid #e3e6f0', 
                    fontSize: '0.95rem',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Tous les contrats</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="B2B2C">B2B2C</option>
                </select>
                <select
                  value={filterPrestation}
                  onChange={e => setFilterPrestation(e.target.value)}
                  style={{ 
                    padding: '0.7rem 1rem', 
                    borderRadius: '8px', 
                    border: '1.5px solid #e3e6f0', 
                    fontSize: '0.95rem',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Toutes les prestations</option>
                  {prestationsOptions.map(prest => (
                    <option key={prest} value={prest}>{prest}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Chargement...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Type</th>
                      <th>Secteur</th>
                      <th>Contrat</th>
                      <th>Prestations</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length === 0 ? (
                      <tr><td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>Aucun client trouvé.</td></tr>
                    ) : filteredClients.map(client => (
                      <tr key={client.id}>
                        <td>{client.id}</td>
                        <td>{client.clientFullName}</td>
                        <td>{client.typeStructure || '-'}</td>
                        <td>{client.secteurActivite || '-'}</td>
                        <td>{client.typeContrat || '-'}</td>
                        <td>
                          {Array.isArray(client.prestationsIncluses) && client.prestationsIncluses.length > 0
                            ? client.prestationsIncluses.join(', ')
                            : '-'}
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

          {/* Modale ajout/modif */}
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
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
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
                    {editClient ? 'Modifiez les informations du client' : 'Créez un nouveau client avec ses informations KPI'}
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
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        🏢 Informations du client
                      </div>
                      
                      <div style={{ marginTop: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Nom / Dénomination *
                          </label>
                          <input
                            type="text"
                            value={formData.clientFullName}
                            onChange={e => setFormData({ ...formData, clientFullName: e.target.value })}
                            required
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Type de structure *
                          </label>
                          <select
                            value={formData.typeStructure}
                            onChange={e => setFormData({ ...formData, typeStructure: e.target.value })}
                            required
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '2px solid #e2e8f0',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#3182ce'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          >
                            <option value="">Sélectionnez</option>
                            <option value="Entreprise">Entreprise</option>
                            <option value="Assurance">Assurance</option>
                            <option value="École">École</option>
                            <option value="Clinique">Clinique</option>
                            <option value="Institution">Institution</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Secteur d'activité *
                          </label>
                          <input
                            type="text"
                            value={formData.secteurActivite}
                            onChange={e => setFormData({ ...formData, secteurActivite: e.target.value })}
                            required
                            placeholder="Ex: Santé, Éducation, BTP..."
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Adresse *
                          </label>
                          <input
                            type="text"
                            value={formData.adresse}
                            onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                            required
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Téléphone *
                          </label>
                          <input
                            type="tel"
                            value={formData.telephone}
                            onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                            required
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Email *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Type de contrat *
                          </label>
                          <select
                            value={formData.typeContrat}
                            onChange={e => setFormData({ ...formData, typeContrat: e.target.value })}
                            required
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '2px solid #e2e8f0',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#3182ce'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          >
                            <option value="">Sélectionnez</option>
                            <option value="B2B">B2B</option>
                            <option value="B2C">B2C</option>
                            <option value="B2B2C">B2B2C</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Nombre de collaborateurs *
                          </label>
                          <input
                            type="number"
                            value={formData.nombreCollaborateurs}
                            onChange={e => setFormData({ ...formData, nombreCollaborateurs: e.target.value })}
                            required
                            min="0"
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Ville
                          </label>
                          <select
                            value={formData.villeId}
                            onChange={e => setFormData({ ...formData, villeId: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              border: '2px solid #e2e8f0',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxSizing: 'border-box'
                            }}
                            onFocus={e => e.target.style.borderColor = '#3182ce'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          >
                            <option value="">Sélectionnez une ville</option>
                            {villes.map(ville => (
                              <option key={ville.id} value={ville.id}>{ville.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Prestations incluses *
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem', background: 'white', borderRadius: '8px', border: '2px solid #e2e8f0' }}>
                            {prestationsOptions.map(prest => (
                              <label key={prest} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.95rem' }}>
                                <input
                                  type="checkbox"
                                  checked={formData.prestationsIncluses.includes(prest)}
                                  onChange={() => handlePrestationChange(prest)}
                                  style={{ marginRight: '0.5rem', width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                {prest}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Colonne droite - Contact principal */}
                    <div style={{ 
                      padding: '1.5rem', 
                      background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        background: 'linear-gradient(135deg, #3182ce, #2c5aa0)',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        👤 Contact principal
                      </div>
                      
                      <div style={{ marginTop: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Nom du contact
                          </label>
                          <input
                            type="text"
                            value={formData.primaryContactName}
                            onChange={e => setFormData({ ...formData, primaryContactName: e.target.value })}
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Fonction
                          </label>
                          <input
                            type="text"
                            value={formData.primaryContactFunction}
                            onChange={e => setFormData({ ...formData, primaryContactFunction: e.target.value })}
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={formData.primaryContactPhone}
                            onChange={e => setFormData({ ...formData, primaryContactPhone: e.target.value })}
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
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: '0.5rem', 
                            fontWeight: '600', 
                            color: '#2d3748',
                            fontSize: '0.95rem'
                          }}>
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.primaryContactEmail}
                            onChange={e => setFormData({ ...formData, primaryContactEmail: e.target.value })}
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
                    </div>
                  </div>
                  {/* Boutons d'action */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '1rem',
                    paddingTop: '2rem',
                    marginTop: '2rem',
                    flexWrap: 'wrap'
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
                      {editClient ? '💾 Enregistrer' : '➕ Ajouter'}
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
                  <button onClick={() => setDeleteId(null)} style={{ padding: '0.7rem 1.2rem', background: '#e0e0e0', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                    Annuler
                  </button>
                  <button onClick={() => handleDelete(deleteId)} style={{ padding: '0.7rem 1.2rem', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          )}

          <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
        </div>
      </main>
    </div>
  );
};

export default ClientsKPI;

