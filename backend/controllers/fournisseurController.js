const db = require('../config/db');

const listFournisseurs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, v.name AS villeName
      FROM Fournisseurs f
      LEFT JOIN Villes v ON f.villeId = v.id
      WHERE f.destroyTime IS NULL
      ORDER BY f.createdAt DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getFournisseur = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Fournisseurs WHERE id = ? AND destroyTime IS NULL', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const createFournisseur = async (req, res) => {
  try {
    const { name, tel, email, address, villeId } = req.body;
    if (!name) return res.status(400).json({ message: 'name est requis' });
    const now = new Date();
    const [r] = await db.query(
      'INSERT INTO Fournisseurs (name, tel, email, address, villeId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, tel || null, email || null, address || null, villeId || null, now, now]
    );
    res.status(201).json({ id: r.insertId, name, tel, email, address, villeId, createdAt: now, updatedAt: now });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateFournisseur = async (req, res) => {
  try {
    const { name, tel, email, address, villeId } = req.body;
    if (!name) return res.status(400).json({ message: 'name est requis' });
    const now = new Date();
    const [r] = await db.query(
      'UPDATE Fournisseurs SET name=?, tel=?, email=?, address=?, villeId=?, updatedAt=? WHERE id=? AND destroyTime IS NULL',
      [name, tel || null, email || null, address || null, villeId || null, now, req.params.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    res.json({ id: req.params.id, name, tel, email, address, villeId, updatedAt: now });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteFournisseur = async (req, res) => {
  try {
    const now = new Date();
    const [r] = await db.query('UPDATE Fournisseurs SET destroyTime=? WHERE id=? AND destroyTime IS NULL', [now, req.params.id]);
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    res.json({ message: 'Fournisseur supprimé' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  listFournisseurs,
  getFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur
};
