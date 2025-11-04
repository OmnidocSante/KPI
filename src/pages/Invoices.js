import React, { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';
import { fetchInvoices, fetchPaidInvoices, createInvoice, updateInvoice, payInvoice, deleteInvoice, unpayInvoice, fetchFournisseurs } from '../services/api';

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
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [form, setForm] = useState({ number: '', supplier: '', amount: '', invoiceDate: '', terms: 60 });
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [fournisseurs, setFournisseurs] = useState([]);

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

  const loadFournisseurs = async () => {
    try {
      const res = await fetchFournisseurs();
      setFournisseurs(res.data);
    } catch (e) {
      console.error('Erreur lors du chargement des fournisseurs', e);
    }
  };

  useEffect(() => { 
    load(); 
    loadFournisseurs();
  }, []);

  // Vérifier les factures urgentes et afficher des notifications
  useEffect(() => {
    if (items.length === 0) return;
    
    const urgentInvoices = items.filter(i => {
      const days = Number(i.daysLeft);
      return days <= 3 && days >= 0;
    });

    const overdueInvoices = items.filter(i => Number(i.daysLeft) < 0);

    if (overdueInvoices.length > 0) {
      setNotification({
        message: `⚠️ Attention ! ${overdueInvoices.length} facture(s) en retard de paiement`,
        type: 'error'
      });
    } else if (urgentInvoices.length > 0) {
      const mostUrgent = urgentInvoices[0];
      const days = Number(mostUrgent.daysLeft);
      setNotification({
        message: `⏰ Facture ${mostUrgent.number} - ${days === 0 ? "À payer aujourd'hui" : `${days} jour(s) restant(s)`}`,
        type: 'error'
      });
    }
  }, [items]);

  const sorted = useMemo(() => {
    return [...items].sort((x, y) => (x.daysLeft ?? 0) - (y.daysLeft ?? 0));
  }, [items]);

  const openAddModal = () => {
    setEditingInvoice(null);
    setForm({ number: '', supplier: '', amount: '', invoiceDate: '', terms: 60 });
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setForm({
      number: invoice.number || '',
      supplier: invoice.supplier || '',
      amount: invoice.amount || '',
      invoiceDate: invoice.invoiceDate || '',
      terms: invoice.terms || 60
    });
    setShowModal(true);
  };

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
      
      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, payload);
        setNotification({ message: 'Facture modifiée', type: 'success' });
      } else {
        await createInvoice(payload);
        setNotification({ message: 'Facture ajoutée', type: 'success' });
      }
      
      setShowModal(false);
      setEditingInvoice(null);
      setForm({ number: '', supplier: '', amount: '', invoiceDate: '', terms: 60 });
      await load();
    } catch (e) {
      setNotification({ message: editingInvoice ? "Erreur lors de la modification" : "Erreur lors de l'ajout", type: 'error' });
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
        {notification.message && (
          <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            minWidth: 320,
            maxWidth: '90vw',
            padding: '1rem 1.5rem',
            borderRadius: 8,
            background: notification.type === 'success' ? '#4caf50' : '#f44336',
            color: 'white',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <span style={{ flex: 1 }}>{notification.message}</span>
            <button
              onClick={() => setNotification({ message: '', type: '' })}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                padding: 0,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >×</button>
          </div>
        )}
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', gap:12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <h2 style={{ margin:0, fontSize:'1.25rem', color:'#2c3e50' }}>📥 Réception des factures</h2>
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
                    Total: {sorted.length} {sorted.length <= 1 ? 'facture' : 'factures'}
                  </span>
                </div>
                <button onClick={openAddModal} style={{ marginLeft:'auto', background:'linear-gradient(45deg, #1976d2, #2196f3)', color:'#fff', border:'none', height:34, padding:'0 12px', borderRadius:6, fontWeight:600, cursor:'pointer',width:'10%' }}>+ Ajouter</button>
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
                          <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', flexWrap:'nowrap' }}>
                            <button
                              onClick={() => openEditModal(i)}
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
                              onClick={() => markPaidClick(i.id)}
                              title="Marquer payée"
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
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '16px', fontWeight: 600
                              }}
                            >✔️</button>
                            <button
                              onClick={() => deleteClick(i.id)}
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

          <div className="table-section">
            <div className="table-header" style={{ marginBottom:'0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h3 style={{ margin:0, color:'#2c3e50' }}>✅ Factures payées</h3>
                <span style={{
                  background: 'linear-gradient(135deg, #43a047, #66bb6a)',
                  color: 'white',
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  Total: {paid.length} {paid.length <= 1 ? 'facture payée' : 'factures payées'}
                </span>
              </div>
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
                        <div style={{ display:'flex', gap:8, justifyContent:'center', alignItems:'center', flexWrap:'nowrap' }}>
                          <button
                            onClick={() => markUnpaidClick(p.id)}
                            title="Marquer non payée"
                            style={{
                              width: 32,
                              height: 32,
                              background: '#e9f7ef',
                              color: '#1b8f3a',
                              border: '1px solid #a7e3bd',
                              borderRadius: '999px',
                              padding: 0,
                              cursor: 'pointer',
                              fontSize: '16px',
                              fontWeight: 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >↩️</button>
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
              <h3 style={{ marginTop:0 }}>{editingInvoice ? 'Modifier la facture' : 'Ajouter une facture'}</h3>
              <form onSubmit={submit}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
                  <div className="form-group"><label>N°</label><input value={form.number} onChange={e=>setForm({ ...form, number:e.target.value })} required /></div>
                  <div className="form-group">
                    <label>Fournisseur</label>
                    <select value={form.supplier} onChange={e=>setForm({ ...form, supplier:e.target.value })}>
                      <option value="">-- Sélectionner --</option>
                      {fournisseurs.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
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
                  <button type="button" onClick={()=>{setShowModal(false); setEditingInvoice(null);}} style={{ background:'#e2e8f0', border:'none', borderRadius:8, padding:'8px 12px', fontWeight:600, cursor:'pointer' }}>Annuler</button>
                  <button type="submit" className="submit-btn" style={{ background:'#1976d2', color:'#fff' }}>{editingInvoice ? 'Modifier' : 'Ajouter'}</button>
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


