const db = require('../config/db');

// Récupérer toutes les ambulances
const getAllAmbulances = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Aumbulances WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer une ambulance par ID
const getAmbulanceById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Aumbulances WHERE id = ? AND destroyTime IS NULL', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ambulance non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer une nouvelle ambulance
const createAmbulance = async (req, res) => {
  try {
    const { numberPlate,type } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO Aumbulances (numberPlate, createdAt, updatedAt,type) VALUES (?, ?, ?,?)',
      [numberPlate, now, now,type]
    );
    res.status(201).json({ 
      id: result.insertId, 
      numberPlate, 
      createdAt: now, 
      updatedAt: now 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour une ambulance
const updateAmbulance = async (req, res) => {
  try {
    const { numberPlate,type } = req.body;
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Aumbulances SET numberPlate = ?, updatedAt = ?,type = ? WHERE id = ? AND destroyTime IS NULL',
      [numberPlate, now, type, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ambulance non trouvée' });
    }
    res.json({ 
      id: req.params.id, 
      numberPlate, 
      type,
      updatedAt: now 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une ambulance (soft delete)
const deleteAmbulance = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Aumbulances SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ambulance non trouvée' });
    }
    res.json({ message: 'Ambulance supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance
}; 