const db = require('../config/db');

// Récupérer tous les ambulanciers
const getAllAmbulanciers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Ambulanciers WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un ambulancier par ID
const getAmbulancierById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Ambulanciers WHERE id = ? AND destroyTime IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ambulancier non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un nouvel ambulancier
const createAmbulancier = async (req, res) => {
  try {
    const { name, phone, ville, email } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO Ambulanciers (name, phone, ville, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [name || null, phone || null, ville || null, email || null, now, now]
    );
    res.status(201).json({ id: result.insertId, name, phone, ville, email, createdAt: now, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un ambulancier
const updateAmbulancier = async (req, res) => {
  try {
    const { name, phone, ville, email } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Ambulanciers SET name = ?, phone = ?, ville = ?, email = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [name || null, phone || null, ville || null, email || null, now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ambulancier non trouvé' });
    }
    res.json({ id: req.params.id, name, phone, ville, email, updatedAt: now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un ambulancier (soft delete)
const deleteAmbulancier = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query('UPDATE Ambulanciers SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL', [now, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ambulancier non trouvé' });
    }
    res.json({ message: 'Ambulancier supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllAmbulanciers,
  getAmbulancierById,
  createAmbulancier,
  updateAmbulancier,
  deleteAmbulancier
};


