import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur, fetchVilles } from '../services/api';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => { if (!message) return; const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [message, onClose]);
  if (!message) return null;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, minWidth: 320, background: type === 'success' ? '#4caf50' : '#f44336', color: 'white', padding: '1rem 1.5rem', borderRadius: 8, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.13)' }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: 16, background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }}>×</button>
    </div>
  );
};

const Fournisseurs = () => {
  const [items, setItems] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', tel: '', email: '', address: '', villeId: '' });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [fs, vs] = await Promise.all([fetchFournisseurs(), fetchVilles()]);
      setItems(fs.data);
      setVilles(vs.data);
    } catch (e) {
      setNotification({ message: 'Erreur de chargement', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditItem(null); setForm({ name: '', tel: '', email: '', address: '', villeId: '' }); setShowModal(true); };
  const openEdit = (i) => { setEditItem(i); setForm({ name: i.name || '', tel: i.tel || '', email: i.email || '', address: i.address || '', villeId: i.villeId || '' }); setShowModal(true); };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) { await updateFournisseur(editItem.id, form); setNotification({ message: 'Fournisseur modifié', type: 'success' }); }
      else { await createFournisseur(form); setNotification({ message: 'Fournisseur ajouté', type: 'success' }); }
      setShowModal(false);
      setEditItem(null);
      load();
    } catch (e) { setNotification({ message: 'Erreur enregistrement', type: 'error' }); }
  };

  const del = async (id) => { try { await deleteFournisseur(id); setNotification({ message: 'Fournisseur supprimé', type: 'success' }); setDeleteId(null); load(); } catch { setNotification({ message: 'Erreur suppression', type:'error' }); } };

  const filtered = items.filter(i => (i.name || '').toLowerCase().includes(search.toLowerCase()) || (i.villeName || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', gap:12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin:0, fontSize:'1.25rem', color:'#2c3e50' }}>🏭 Fournisseurs</h2>
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
                    Total: {filtered.length} {filtered.length <= 1 ? 'fournisseur' : 'fournisseurs'}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex:1, height:34, border:'1px solid #e3e6f0', borderRadius:6, padding:'0 10px' }} />
                  <button onClick={openAdd} style={{ background:'linear-gradient(45deg,#1976d2,#2196f3)', color:'#fff', border:'none', height:34, padding:'0 12px', borderRadius:6, fontWeight:600, cursor:'pointer',width:'10%' }}>+ Ajouter</button>
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
                      <th style={{ minWidth: 320, width: 380 }}>Nom</th>
                      <th>Téléphone</th>
                      <th>Email</th>
                      <th>Adresse</th>
                      <th>Ville</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan="6">Aucun fournisseur.</td></tr>
                      ) : filtered.map(i => (
                        <tr key={i.id}>
                          <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'clip', minWidth: 320, maxWidth: 520 }}>{i.name}</td>
                        <td>{i.tel || '-'}</td>
                        <td>{i.email || '-'}</td>
                        <td>{i.address || '-'}</td>
                        <td>{i.villeName || '-'}</td>
                        <td>
                          <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', flexWrap:'nowrap' }}>
                            <button onClick={() => openEdit(i)} title="Modifier" style={{ width:32, height:32, minWidth:32, minHeight:32, boxSizing:'border-box', lineHeight:'32px', padding:0, borderRadius:'50%', background:'#e8f1fe', color:'#0b63c5', border:'1px solid #90caf9', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>✏️</button>
                            <button onClick={() => setDeleteId(i.id)} title="Supprimer" style={{ width:32, height:32, minWidth:32, minHeight:32, boxSizing:'border-box', lineHeight:'32px', padding:0, borderRadius:'50%', background:'#fdecec', color:'#c62828', border:'1px solid #f4b4b4', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>🗑️</button>
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
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem' }}>
            <div style={{ background:'#fff', padding:'1.5rem', borderRadius:12, width:'100%', maxWidth:600 }}>
              <h3 style={{ marginTop:0 }}>{editItem ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</h3>
              <form onSubmit={submit}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:12 }}>
                  <div className="form-group"><label>Nom *</label><input value={form.name} onChange={e=>setForm({ ...form, name:e.target.value })} required /></div>
                  <div className="form-group"><label>Téléphone</label><input value={form.tel} onChange={e=>setForm({ ...form, tel:e.target.value })} /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({ ...form, email:e.target.value })} /></div>
                  <div className="form-group" style={{ gridColumn:'1 / -1' }}><label>Adresse</label><input value={form.address} onChange={e=>setForm({ ...form, address:e.target.value })} /></div>
                  <div className="form-group"><label>Ville</label>
                    <select value={form.villeId} onChange={e=>setForm({ ...form, villeId:e.target.value })}>
                      <option value="">--</option>
                      {villes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:16 }}>
                  <button type="button" onClick={()=>setShowModal(false)} style={{ background:'#e2e8f0', border:'none', borderRadius:8, padding:'8px 12px', fontWeight:600, cursor:'pointer' }}>Annuler</button>
                  <button type="submit" className="submit-btn" style={{ background:'#1976d2', color:'#fff' }}>{editItem ? 'Enregistrer' : 'Ajouter'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteId && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 }}>
            <div style={{ background:'#fff', padding:32, borderRadius:12, minWidth:320, maxWidth:400 }}>
              <h3>Confirmer la suppression</h3>
              <p>Voulez-vous vraiment supprimer ce fournisseur ?</p>
              <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end', gap:12 }}>
                <button className="submit-btn" style={{ background:'#1976d2', color:'#fff' }} onClick={()=>setDeleteId(null)}>Annuler</button>
                <button onClick={()=>del(deleteId)} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:8, padding:'0.7rem 1.2rem', fontWeight:'bold', cursor:'pointer' }}>Supprimer</button>
              </div>
            </div>
          </div>
        )}

        <Notification message={notification.message} type={notification.type} onClose={()=>setNotification({ message:'', type:'' })} />
      </main>
    </div>
  );
};

export default Fournisseurs;
