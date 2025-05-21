const db = require('../config/db');

// Récupérer tous les infirmiers
const getAllinfirmiers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM infirmier ');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un infirmier par ID
const getinfirmierById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM infirmier WHERE id = ? ', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Infirmier non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un nouvel infirmier
const createinfirmier = async (req, res) => {
  try {
    const { nom } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO infirmier (nom, created_at) VALUES (?, ?)',
      [nom, now]
    );
    res.status(201).json({
      id: result.insertId,
      nom,
      created_at: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un infirmier
const updateinfirmier = async (req, res) => {
  try {
    const { nom } = req.body;
    const [result] = await db.query(
      'UPDATE infirmier SET nom = ? WHERE id = ? ',
      [nom, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Infirmier non trouvé' });
    }
    res.json({
      id: req.params.id,
      nom
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un infirmier
const deleteinfirmier = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM infirmier WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Infirmier non trouvé' });
    }
    res.json({ message: 'Infirmier supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  getAllinfirmiers,
  getinfirmierById,
  createinfirmier,
  updateinfirmier,
  deleteinfirmier,

}; 