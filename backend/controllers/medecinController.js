const db = require('../config/db');

// Récupérer tous les médecins
const getAllMedecins = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Medciens WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un médecin par ID
const getMedecinById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Medciens WHERE id = ? AND destroyTime IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un nouveau médecin
const createMedecin = async (req, res) => {
  try {
    const { name, specialty, phone, contact, ville, email } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO Medciens (name, specialty, phone, contact, ville, email, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, specialty, phone, contact, ville, email, now, now]
    );
    res.status(201).json({
      id: result.insertId,
      name,
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

// Mettre à jour un médecin
const updateMedecin = async (req, res) => {
  try {
    const { name, specialty, phone, contact, ville, email } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Medciens SET name = ?, specialty = ?, phone = ?, contact = ?, ville = ?, email = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [name, specialty, phone, contact, ville, email, now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    res.json({
      id: req.params.id,
      name,
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

// Supprimer un médecin (soft delete)
const deleteMedecin = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Medciens SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Médecin non trouvé' });
    }
    res.json({ message: 'Médecin supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des médecins par spécialité
const searchMedecinsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;
    const [rows] = await db.query(
      'SELECT * FROM Medciens WHERE specialty LIKE ? AND destroyTime IS NULL',
      [`%${specialty}%`]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllMedecins,
  getMedecinById,
  createMedecin,
  updateMedecin,
  deleteMedecin,
  searchMedecinsBySpecialty
}; 