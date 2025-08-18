const db = require('../config/db');

// Récupérer tous les infirmiers
const getAllinfirmiers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM infirmier WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un infirmier par ID
const getinfirmierById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM infirmier WHERE id = ? AND destroyTime IS NULL', [req.params.id]);
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
    const { nom, specialty, phone, contact, ville, email } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO infirmier (nom, specialty, phone, contact, ville, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nom, specialty, phone, contact, ville, email, now, now]
    );
    res.status(201).json({
      id: result.insertId,
      nom,
      specialty,
      phone,
      contact,
      ville,
      email,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un infirmier
const updateinfirmier = async (req, res) => {
  try {
    const { nom, specialty, phone, contact, ville, email } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'UPDATE infirmier SET nom = ?, specialty = ?, phone = ?, contact = ?, ville = ?, email = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [nom, specialty, phone, contact, ville, email, now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Infirmier non trouvé' });
    }
    res.json({
      id: req.params.id,
      nom,
      specialty,
      phone,
      contact,
      ville,
      email,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un infirmier (soft delete)
const deleteinfirmier = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE infirmier SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Infirmier non trouvé' });
    }
    res.json({ message: 'Infirmier supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des infirmiers par spécialité
const searchInfirmiersBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;
    const [rows] = await db.query(
      'SELECT * FROM infirmier WHERE specialty LIKE ? AND destroyTime IS NULL',
      [`%${specialty}%`]
    );
    res.json(rows);
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
  searchInfirmiersBySpecialty
}; 