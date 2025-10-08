const db = require('../config/db');

// List unpaid invoices ordered by remaining days
const listInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.*, 
        DATEDIFF(i.dueDate, CURDATE()) AS daysLeft
      FROM Invoices i
      WHERE i.destroyTime IS NULL AND i.isPaid = 0
      ORDER BY daysLeft ASC, i.dueDate ASC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// List paid invoices
const listPaidInvoices = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.* FROM Invoices i
      WHERE i.destroyTime IS NULL AND i.isPaid = 1
      ORDER BY i.paidAt DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getInvoice = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Invoices WHERE id=? AND destroyTime IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Facture non trouvée' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { number, supplier, amount, invoiceDate, terms } = req.body; // terms: 60 | 120
    if (!number || !amount || !invoiceDate || !terms) {
      return res.status(400).json({ message: 'number, amount, invoiceDate, terms requis' });
    }
    const now = new Date();
    // dueDate = invoiceDate + terms (jours)
    const due = new Date(invoiceDate);
    due.setDate(due.getDate() + Number(terms));
    const dueDate = due.toISOString().slice(0,10);
    const [r] = await db.query(
      `INSERT INTO Invoices (number, supplier, amount, invoiceDate, terms, dueDate, isPaid, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [number, supplier || null, amount, invoiceDate, terms, dueDate, now, now]
    );
    res.status(201).json({ id: r.insertId, dueDate });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const markPaid = async (req, res) => {
  try {
    const now = new Date();
    const [r] = await db.query('UPDATE Invoices SET isPaid=1, paidAt=?, updatedAt=? WHERE id=? AND destroyTime IS NULL', [now, now, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Facture non trouvée' });
    res.json({ message: 'Facture marquée payée' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const unpayInvoice = async (req, res) => {
  try {
    const [result] = await db.query('UPDATE Invoices SET isPaid = 0, paidAt = NULL WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Facture non trouvée' });
    res.json({ message: 'Facture marquée non payée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const softDelete = async (req, res) => {
  try {
    const now = new Date();
    const [r] = await db.query('UPDATE Invoices SET destroyTime=? WHERE id=? AND destroyTime IS NULL', [now, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Facture non trouvée' });
    res.json({ message: 'Facture supprimée' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  listInvoices,
  listPaidInvoices,
  getInvoice,
  createInvoice,
  markPaid,
  unpayInvoice,
  softDelete
};


