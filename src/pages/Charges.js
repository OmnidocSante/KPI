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
  payChargeInstallment
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
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [filterType, setFilterType] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editChargeItem, setEditChargeItem] = useState(null);
  const [form, setForm] = useState({
    label: '',
    categoryId: '',
    type: 'recurring',
    priceType: 'monthly',
    unitPrice: '',
    periodCount: '',
    startDate: '',
    endDate: '',
    amount: '',
    variableDate: '',
    notes: ''
  });

  const [deleteId, setDeleteId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });

  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [installments, setInstallments] = useState([]);

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

  useEffect(() => {
    loadCategories();
    loadCharges();
  }, []);

  const openAddModal = () => {
    setEditChargeItem(null);
    setForm({
      label: '', categoryId: '', type: 'recurring', priceType: 'monthly', unitPrice: '', periodCount: '', startDate: '', endDate: '', amount: '', variableDate: '', notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (charge) => {
    setEditChargeItem(charge);
    setForm({
      label: charge.label || '',
      categoryId: charge.categoryId || '',
      type: charge.type || 'recurring',
      priceType: charge.priceType || 'monthly',
      unitPrice: charge.unitPrice || '',
      periodCount: charge.periodCount || '',
      startDate: toYMD(charge.startDate),
      endDate: toYMD(charge.endDate),
      amount: charge.amount || '',
      variableDate: toYMD(charge.variableDate),
      notes: charge.notes || ''
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
      const payload = form.type === 'recurring'
        ? {
            label: form.label,
            categoryId: form.categoryId || null,
            type: 'recurring',
            priceType: form.priceType,
            unitPrice: parseFloat(form.unitPrice || '0') || 0,
            periodCount: parseInt(form.periodCount || '0', 10) || 0,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            notes: form.notes || null
          }
        : {
            label: form.label,
            categoryId: form.categoryId || null,
            type: 'variable',
            amount: parseFloat(form.amount || '0') || 0,
            variableDate: form.variableDate || null,
            notes: form.notes || null
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

  const filteredCharges = useMemo(() => {
    const s = (search || '').toLowerCase();
    return charges
      .filter(c => !filterCategoryId || String(c.categoryId) === String(filterCategoryId))
      .filter(c => !filterType || c.type === filterType)
      .filter(c => (c.label || '').toLowerCase().includes(s) || (c.categoryName || '').toLowerCase().includes(s));
  }, [charges, search, filterCategoryId, filterType]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-container">
          <div className="table-section">
            <div className="table-header" style={{ marginBottom: '1rem', marginRight: '-2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' , width:'100%'}}>
                <h2 style={{ fontSize: '1.25rem', color: '#2c3e50', margin: 0, whiteSpace:'nowrap' }}>💸 Liste des charges
                  <span style={{ marginLeft: 8, fontSize: '0.85rem', color: '#64748b', background:'#eef2f7', padding: '1px 6px', borderRadius: 999 }}>{filteredCharges.length}</span>
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flex:1 }}>
                  <div style={{
                    flex: '2 1 550',
                    position: 'relative',
                    background:'#f8fafc',
                    border:'1px solid #e3e6f0',
                    borderRadius:6,
                    height: 34,
                    width: '550px'
                  }}>
                    <input
                      type="text"
                      placeholder="Rechercher une charge..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        paddingLeft: '2rem',
                        border: 'none',
                        outline:'none',
                        background:'transparent',
                        width:'100%'
                      }}
                    />
                    <span style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', fontSize:14 }}>🔍</span>
                  </div>
                  <select
                    value={filterCategoryId}
                    onChange={e => setFilterCategoryId(e.target.value)}
                    style={{ padding: '0.3rem 0.55rem', height: 34, borderRadius: 6, border: '1px solid #e3e6f0', background: '#fff', fontSize: '0.9rem', minWidth: 160 }}
                  >
                    <option value="">Toutes catégories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    style={{ padding: '0.3rem 0.55rem', height: 34, borderRadius: 6, border: '1px solid #e3e6f0', background: '#fff', fontSize: '0.9rem', minWidth: 130 }}
                  >
                    <option value="">Tous types</option>
                    <option value="recurring">Récurrente</option>
                    <option value="variable">Variable</option>
                  </select>
                  <button
                    onClick={async () => {
                      const name = prompt('Nom de la nouvelle catégorie:');
                      if (!name || !name.trim()) return;
                      try {
                        await createChargeCategory({ name: name.trim() });
                        await loadCategories();
                        setNotification({ message: 'Catégorie ajoutée', type: 'success' });
                      } catch (e) {
                        setNotification({ message: "Erreur lors de l'ajout de la catégorie", type: 'error' });
                      }
                    }}
                    style={{ background:'transparent', border:'none', color:'#0b63c5', textDecoration:'underline', fontWeight:700, cursor:'pointer', padding:'0 4px', height:34, whiteSpace:'nowrap' }}
                    title="Créer une nouvelle catégorie"
                  >+ Catégorie</button>
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
                      marginRight: '2rem'
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
                      <th>Libellé</th>
                      <th>Catégorie</th>
                      <th>Type</th>
                      <th>Détails</th>
                      <th>Dates</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCharges.length === 0 ? (
                      <tr><td colSpan="7">Aucune charge trouvée.</td></tr>
                    ) : filteredCharges.map(c => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.label}</td>
                        <td>{c.categoryName || '-'}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, background: c.type === 'recurring' ? '#f1f8e9' : '#fff3e0', border: '1px solid #ddd' }}>
                            {c.type === 'recurring' ? 'Récurrente' : 'Variable'}
                          </span>
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
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => openEditModal(c)}
                              title="Modifier"
                              style={{
                                width: 'auto',
                                whiteSpace: 'nowrap',
                                background: '#e8f1fe',
                                color: '#0b63c5',
                                border: '1px solid #90caf9',
                                borderRadius: '999px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600
                              }}
                            >✏️ Modifier</button>
                            {c.type === 'recurring' && (
                              <button
                                onClick={() => openInstallments(c)}
                                title="Échéances"
                                style={{
                                  width: 'auto',
                                  whiteSpace: 'nowrap',
                                  background: '#e9f7ef',
                                  color: '#1b8f3a',
                                  border: '1px solid #a7e3bd',
                                  borderRadius: '999px',
                                  padding: '6px 10px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: 600
                                }}
                              >📅 Échéances</button>
                            )}
                            <button
                              onClick={() => setDeleteId(c.id)}
                              title="Supprimer"
                              style={{
                                width: 'auto',
                                whiteSpace: 'nowrap',
                                background: '#fdecec',
                                color: '#c62828',
                                border: '1px solid #f4b4b4',
                                borderRadius: '999px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600
                              }}
                            >🗑️ Supprimer</button>
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
            <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ marginBottom: '1.5rem', textAlign: 'center', borderBottom: '2px solid #f1f3f4', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{editChargeItem ? '✏️ Modifier la charge' : '➕ Ajouter une nouvelle charge'}</h2>
              </div>

              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>Libellé *</label>
                      <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} required />
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
                      <label>Type</label>
                      <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                        <option value="recurring">Récurrente</option>
                        <option value="variable">Variable</option>
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
                        <div className="form-group">
                          <label>Date</label>
                          <input type="date" value={form.variableDate} onChange={e => setForm({ ...form, variableDate: e.target.value })} />
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
                <h2 style={{ margin: 0 }}>📅 Échéances — {selectedCharge?.label}</h2>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.length === 0 ? (
                      <tr><td colSpan="4">Aucune échéance.</td></tr>
                    ) : installments.map(i => (
                      <tr key={i.id}>
                        <td>{formatFr(i.dueDate)}</td>
                        <td>{i.amount}</td>
                        <td>{i.isPaid ? 'Payée' : 'À payer'}</td>
                        <td>
                          {!i.isPaid && (
                            <button onClick={() => handlePayInstallment(i.id)} className="submit-btn" style={{ background: '#28a745' }}>Marquer payée</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <button onClick={() => setShowInstallmentsModal(false)} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '0.7rem 1.2rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
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


