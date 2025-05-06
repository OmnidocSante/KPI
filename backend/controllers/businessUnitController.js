const db = require('../config/db');

// Récupérer toutes les business units
const getAllBusinessUnits = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM BusinessUnits WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer une business unit par ID
const getBusinessUnitById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM BusinessUnits WHERE id = ? AND destroyTime IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Business Unit non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer une nouvelle business unit
const createBusinessUnit = async (req, res) => {
  try {
    const { businessUnitType } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO BusinessUnits (businessUnitType, createdAt, updatedAt) VALUES (?, ?, ?)',
      [businessUnitType, now, now]
    );
    res.status(201).json({ 
      id: result.insertId, 
      businessUnitType, 
      createdAt: now, 
      updatedAt: now 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour une business unit
const updateBusinessUnit = async (req, res) => {
  try {
    const { businessUnitType } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'UPDATE BusinessUnits SET businessUnitType = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [businessUnitType, now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Business Unit non trouvée' });
    }
    res.json({ 
      id: req.params.id, 
      businessUnitType, 
      updatedAt: now 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une business unit (soft delete)
const deleteBusinessUnit = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE BusinessUnits SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Business Unit non trouvée' });
    }
    res.json({ message: 'Business Unit supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllBusinessUnits,
  getBusinessUnitById,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit
}; 