import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchAmbulanciers, createAmbulancier, updateAmbulancier, deleteAmbulancier, fetchVilles } from '../services/api';

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

const Ambulanciers = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVille, setFilterVille] = useState('');
  const [villes, setVilles] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', ville: '', email: '' });

  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [resAmb, resVilles] = await Promise.all([fetchAmbulanciers(), fetchVilles()]);
      setItems(resAmb.data);
      setVilles(Array.isArray(resVilles.data) ? resVilles.data : []);
    } catch (e) {
      setNotification({ message: "Erreur lors du chargement des ambulanciers", type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return items
      .filter(a => !filterVille || String(a.ville || '').toLowerCase() === String(filterVille).toLowerCase())
      .filter(a => (
        (a.name || '').toLowerCase().includes(q) ||
        (a.phone || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.ville || '').toLowerCase().includes(q)
      ));
  }, [items, search, filterVille]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', phone: '', ville: '', email: '' });
    setShowModal(true);
  };

  const openEdit = (it) => {
    setEditItem(it);
    setForm({ name: it.name || '', phone: it.phone || '', ville: it.ville || '', email: it.email || '' });
    setShowModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateAmbulancier(editItem.id, form);
        setNotification({ message: 'Ambulancier mis à jour', type: 'success' });
      } else {
        await createAmbulancier(form);
        setNotification({ message: 'Ambulancier ajouté', type: 'success' });
      }
      setShowModal(false);
      setEditItem(null);
      load();
    } catch (e) {
      setNotification({ message: "Erreur lors de l'enregistrement", type: 'error' });
    }
  };

  const onDelete = async (id) => {
    try {
      await deleteAmbulancier(id);
      setNotification({ message: 'Ambulancier supprimé', type: 'success' });
      setDeleteId(null);
      load();
    } catch (e) {
      setNotification({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem', marginRight: '-2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' , width:'100%'}}>
                <h2 style={{ fontSize: '1.25rem', color: '#2c3e50', margin: 0, whiteSpace:'nowrap' }}>🚑 Ambulanciers
                  <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#64748b', background:'#eef2f7', padding: '1px 6px', borderRadius: 999 }}>{filtered.length}</span>
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flex:1 }}>
                  <div style={{ flex: '2 1 550', position: 'relative', background:'#f8fafc', border:'1px solid #e3e6f0', borderRadius:6, height: 34, width: '550px' }}>
                    <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.4rem 0.75rem', paddingLeft: '2rem', border: 'none', outline:'none', background:'transparent', width:'100%' }} />
                    <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14 }}>🔍</span>
                  </div>
                  <select value={filterVille} onChange={e => setFilterVille(e.target.value)} style={{ padding: '0.3rem 0.55rem', height: 34, borderRadius: 6, border: '1px solid #e3e6f0', background: '#fff', fontSize: '0.9rem', minWidth: 160 }}>
                    <option value="">Toutes les villes</option>
                    {villes.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <button onClick={openAdd} style={{ background: 'linear-gradient(45deg, #1976d2, #2196f3)', color: 'white', border: 'none', width: '14%', padding: '0.45rem 0.9rem', height: 34, borderRadius: 6, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(25, 118, 210, 0.1)', transition: 'all 0.2s ease', marginRight: '2rem' }}>＋ Ajouter un ambulancier</button>
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
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Ville</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan="6">Aucun ambulancier trouvé.</td></tr>
                    ) : filtered.map(a => (
                      <tr key={a.id}>
                        <td>{a.id}</td>
                        <td>{a.name || '-'}</td>
                        <td>{a.phone || '-'}</td>
                        <td>{a.ville || '-'}</td>
                        <td>{a.email || '-'}</td>
                        <td>
                          <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', flexWrap:'nowrap' }}>
                            <button
                              onClick={() => openEdit(a)}
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
                                cursor: 'pointer', fontSize:'16px', fontWeight:600
                              }}
                            >✏️</button>
                            <button
                              onClick={() => setDeleteId(a.id)}
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
                                cursor: 'pointer', fontSize:'16px', fontWeight:600
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

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', borderBottom: '2px solid #f1f3f4', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{editItem ? '✏️ Modifier l\'ambulancier' : '➕ Ajouter un ambulancier'}</h2>
              </div>
              <form onSubmit={onSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Nom</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Ville</label>
                    <select value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}>
                      <option value="">Sélectionner une ville</option>
                      {villes.map(v => (
                        <option key={v.id} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingTop: '1.5rem' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '0.7rem 1.2rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
                  <button type="submit" className="submit-btn" style={{ background: '#1976d2', color: 'white' }}>{editItem ? '💾 Enregistrer' : '➕ Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: 32, borderRadius: 12, minWidth: 320, maxWidth: 400 }}>
              <h3>Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer cet ambulancier ?</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="submit-btn" style={{ background: '#1976d2', color: 'white'}} onClick={() => setDeleteId(null)}>Annuler</button>
                <button onClick={() => onDelete(deleteId)} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, padding: '0.7rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        )}

        <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
      </main>
    </div>
  );
};

export default Ambulanciers;


