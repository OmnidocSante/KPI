const db = require('../config/db');

// Récupérer toutes les villes
const getAllVilles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Villes WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer une ville par ID
const getVilleById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Villes WHERE id = ? AND destroyTime IS NULL',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer une nouvelle ville
const createVille = async (req, res) => {
  try {
    const { name, codePostal } = req.body;
    const now = new Date();

    // Vérifier si la ville existe déjà
    const [existingVille] = await db.query(
      'SELECT id FROM Villes WHERE name = ? AND codePostal = ? AND destroyTime IS NULL',
      [name, codePostal]
    );
    if (existingVille.length > 0) {
      return res.status(400).json({ message: 'Cette ville existe déjà' });
    }

    const [result] = await db.query(
      'INSERT INTO Villes (name, codePostal, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [name, codePostal, now, now]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      codePostal,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour une ville
const updateVille = async (req, res) => {
  try {
    const { name, codePostal } = req.body;
    const now = new Date();

    // Vérifier si la ville existe déjà pour un autre ID
    const [existingVille] = await db.query(
      'SELECT id FROM Villes WHERE name = ? AND codePostal = ? AND id != ? AND destroyTime IS NULL',
      [name, codePostal, req.params.id]
    );
    if (existingVille.length > 0) {
      return res.status(400).json({ message: 'Cette ville existe déjà' });
    }

    const [result] = await db.query(
      'UPDATE Villes SET name = ?, codePostal = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [name, codePostal, now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }

    res.json({
      id: req.params.id,
      name,
      codePostal,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une ville (soft delete)
const deleteVille = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Villes SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ville non trouvée' });
    }

    res.json({ message: 'Ville supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des villes
const searchVilles = async (req, res) => {
  try {
    const { query } = req.query;
    let sql = 'SELECT * FROM Villes WHERE destroyTime IS NULL';
    const params = [];

    if (query) {
      sql += ' AND (name LIKE ? OR codePostal LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllVilles,
  getVilleById,
  createVille,
  updateVille,
  deleteVille,
  searchVilles
}; 