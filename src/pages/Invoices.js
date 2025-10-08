import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchInvoices, fetchPaidInvoices, createInvoice, payInvoice, deleteInvoice, unpayInvoice } from '../services/api';

const badge = (days) => {
  if (days === 3 || days === 2 || days === 1) {
    const colors = { 3: '#fff3cd', 2: '#ffe8a1', 1: '#ffd7d7' };
    return <span style={{ background: colors[days], border: '1px solid #ddd', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>J-{days}</span>;
  }
  if (days < 0) return <span style={{ background:'#ffd7d7', border:'1px solid #ddd', padding:'2px 8px', borderRadius:12, fontSize:12 }}>En retard</span>;
  return <span style={{ background:'#eaf3ff', border:'1px solid #ddd', padding:'2px 8px', borderRadius:12, fontSize:12 }}>J-{days}</span>;
};

const Invoices = () => {
  const [items, setItems] = useState([]);
  const [paid, setPaid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ number: '', supplier: '', amount: '', invoiceDate: '', terms: 60 });
  const [notification, setNotification] = useState({ message: '', type: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([fetchInvoices(), fetchPaidInvoices()]);
      setItems(a.data);
      setPaid(b.data);
    } catch (e) {
      setNotification({ message: "Erreur de chargement des factures", type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => {
    return [...items].sort((x, y) => (x.daysLeft ?? 0) - (y.daysLeft ?? 0));
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        number: form.number,
        supplier: form.supplier || null,
        amount: parseFloat(form.amount || '0') || 0,
        invoiceDate: form.invoiceDate,
        terms: Number(form.terms)
      };
      await createInvoice(payload);
      setShowModal(false);
      setForm({ number: '', supplier: '', amount: '', invoiceDate: '', terms: 60 });
      await load();
      setNotification({ message: 'Facture ajoutée', type: 'success' });
    } catch (e) {
      setNotification({ message: "Erreur lors de l'ajout", type: 'error' });
    }
  };

  const markPaidClick = async (id) => {
    try { await payInvoice(id); await load(); } catch { setNotification({ message:'Erreur paiement', type:'error' }); }
  };

  const deleteClick = async (id) => {
    try { await deleteInvoice(id); await load(); } catch { setNotification({ message:'Erreur suppression', type:'error' }); }
  };

  const markUnpaidClick = async (id) => {
    try { await unpayInvoice(id); await load(); } catch { setNotification({ message:'Erreur annulation paiement', type:'error' }); }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', gap:12 }}>
                <h2 style={{ margin:0, fontSize:'1.25rem', color:'#2c3e50' }}>📥 Réception des factures
                  <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#64748b', background:'#eef2f7', padding: '1px 6px', borderRadius: 999 }}>{sorted.length}</span>
                </h2>
                <button onClick={() => setShowModal(true)} style={{ marginLeft:'auto', background:'linear-gradient(45deg, #1976d2, #2196f3)', color:'#fff', border:'none', height:34, padding:'0 12px', borderRadius:6, fontWeight:600, cursor:'pointer' }}>+ Ajouter</button>
              </div>
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fournisseur</th>
                      <th>Date facture</th>
                      <th>Échéance</th>
                      <th>Jours restants</th>
                      <th>Montant</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr><td colSpan="7">Aucune facture.</td></tr>
                    ) : sorted.map(i => (
                      <tr key={i.id}>
                        <td>{i.number}</td>
                        <td>{i.supplier || '-'}</td>
                        <td>{i.invoiceDate}</td>
                        <td>{i.dueDate}</td>
                        <td>{badge(Number(i.daysLeft))}</td>
                        <td>{i.amount}</td>
                        <td>
                          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                            <button onClick={() => markPaidClick(i.id)} className="submit-btn" style={{ background:'#28a745' }}> payée</button>
                            <button onClick={() => deleteClick(i.id)} style={{ background:'#dc2626', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', fontWeight:600, cursor:'pointer' }}>Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="table-section">
            <div className="table-header" style={{ marginBottom:'0.5rem' }}>
              <h3 style={{ margin:0, color:'#2c3e50' }}>✅ Factures payées
                <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#64748b', background:'#eef2f7', padding: '1px 6px', borderRadius: 999 }}>{paid.length}</span>
              </h3>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Fournisseur</th>
                    <th>Date</th>
                    <th>Payée le</th>
                    <th>Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paid.length === 0 ? (
                    <tr><td colSpan="6">Aucune facture payée.</td></tr>
                  ) : paid.map(p => (
                    <tr key={p.id}>
                      <td>{p.number}</td>
                      <td>{p.supplier || '-'}</td>
                      <td>{p.invoiceDate}</td>
                      <td>{p.paidAt?.slice(0,10) || '-'}</td>
                      <td>{p.amount}</td>
                      <td>
                        <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                          <button onClick={() => markUnpaidClick(p.id)} className="submit-btn" style={{ background:'#f44336', color:'#fff', border:'none', borderRadius:8, padding:'6px 10px', fontWeight:600, cursor:'pointer', minWidth:90 }}>Non payée</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showModal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000, padding:'1rem' }}>
            <div style={{ background:'#fff', padding:'1.5rem', borderRadius:12, width:'100%', maxWidth:600 }}>
              <h3 style={{ marginTop:0 }}>Ajouter une facture</h3>
              <form onSubmit={submit}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
                  <div className="form-group"><label>N°</label><input value={form.number} onChange={e=>setForm({ ...form, number:e.target.value })} required /></div>
                  <div className="form-group"><label>Fournisseur</label><input value={form.supplier} onChange={e=>setForm({ ...form, supplier:e.target.value })} /></div>
                  <div className="form-group"><label>Montant</label><input type="number" step="0.01" value={form.amount} onChange={e=>setForm({ ...form, amount:e.target.value })} required /></div>
                  <div className="form-group"><label>Date facture</label><input type="date" value={form.invoiceDate} onChange={e=>setForm({ ...form, invoiceDate:e.target.value })} required /></div>
                  <div className="form-group"><label>Conditions</label>
                    <select value={form.terms} onChange={e=>setForm({ ...form, terms:e.target.value })}>
                      <option value={60}>60 jours</option>
                      <option value={120}>120 jours</option>
                    </select>
                  </div>
                </div>
                <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:16 }}>
                  <button type="button" onClick={()=>setShowModal(false)} style={{ background:'#e2e8f0', border:'none', borderRadius:8, padding:'8px 12px', fontWeight:600, cursor:'pointer' }}>Annuler</button>
                  <button type="submit" className="submit-btn" style={{ background:'#1976d2', color:'#fff' }}>Ajouter</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Invoices;


