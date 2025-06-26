const db = require('../config/db');

// Récupérer tous les clients avec leurs villes
const getAllClients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, v.name as villeName 
      FROM Clients c 
      LEFT JOIN Villes v ON c.villeId = v.id 
      WHERE c.destroyTime IS NULL
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un client par ID avec sa ville
const getClientById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, v.name as villeName 
      FROM Clients c 
      LEFT JOIN Villes v ON c.villeId = v.id 
      WHERE c.id = ? AND c.destroyTime IS NULL
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un nouveau client
const createClient = async (req, res) => {
  try {
    const { clientFullName, email, villeId } = req.body;
    const now = new Date();

    const [result] = await db.query(
      'INSERT INTO Clients (clientFullName, email, villeId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [clientFullName, email, villeId, now, now]
    );

    res.status(201).json({
      id: result.insertId,
      clientFullName,
      email,
      villeId,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un client
const updateClient = async (req, res) => {
  try {
    const { clientFullName, email, villeId } = req.body;
    const now = new Date();


    const [result] = await db.query(
      'UPDATE Clients SET clientFullName = ?, email = ?, villeId = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [clientFullName, email, villeId, now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json({
      id: req.params.id,
      clientFullName,
      email,
      villeId,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un client (soft delete)
const deleteClient = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'delete Clients  WHERE id = ? ',
      [now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des clients
const searchClients = async (req, res) => {
  try {
    const { query } = req.query;
    const [rows] = await db.query(`
      SELECT c.*, v.name as villeName 
      FROM Clients c 
      LEFT JOIN Villes v ON c.villeId = v.id 
      WHERE (c.clientFullName LIKE ? OR c.email LIKE ?) 
      AND c.destroyTime IS NULL
    `, [`%${query}%`, `%${query}%`]);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  searchClients
}; 