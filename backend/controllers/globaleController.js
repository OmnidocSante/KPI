const db = require('../config/db');

// Récupérer toutes les globales
const getAllGlobales = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Globales WHERE destroyTime IS NULL');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer une globale par ID
const getGlobaleById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM Globales WHERE id = ? AND destroyTime IS NULL',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Globale non trouvée' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer une nouvelle globale (structure conforme à la table Globales)
const createGlobale = async (req, res) => {
  try {
    const {
      villeId,
      clientId,
      aumbulanceId,
      businessUnitId,
      produitId,
      medcienId,
      infermierId,
      dateCreation,
      Ref,
      caHT,
      caTTC,
      fullName,
      businessUnitType,
      etatdePaiment,
      numTelephone,
      note,
      type
    } = req.body;

    const now = new Date();

    const [result] = await db.query(
      `INSERT INTO Globales (
        villeId, clientId, aumbulanceId, businessUnitId, produitId, medcienId, infermierId, 
        dateCreation, Ref, caHT, caTTC, fullName, createdAt, updatedAt, businessUnitType, 
        etatdePaiment, numTelephone, note, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        villeId, clientId, aumbulanceId, businessUnitId, produitId, medcienId, infermierId, 
        dateCreation, Ref, caHT, caTTC, fullName, now, now, businessUnitType, 
        etatdePaiment, numTelephone, note, type
      ]
    );

    res.status(201).json({
      id: result.insertId,
      villeId,
      clientId,
      aumbulanceId,
      businessUnitId,
      produitId,
      medcienId,
      infermierId,
      dateCreation,
      Ref,
      caHT,
      caTTC,
      fullName,
      createdAt: now,
      updatedAt: now,
      businessUnitType,
      etatdePaiment,
      numTelephone,
      note,
      type
    });
  } catch (error) {
    console.error('Error creating globale:', error);
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour une globale (structure conforme à la table Globales)
const updateGlobale = async (req, res) => {
  try {
    const {
      villeId,
      clientId,
      aumbulanceId,
      businessUnitId,
      produitId,
      medcienId,
      infermierId,
      dateCreation,
      Ref,
      caHT,
      caTTC,
      fullName,
      businessUnitType,
      etatdePaiment,
      numTelephone,
      note,
      type
    } = req.body;

    const now = new Date();

    const [result] = await db.query(
      `UPDATE Globales SET
        villeId = ?, clientId = ?, aumbulanceId = ?, businessUnitId = ?, produitId = ?, 
        medcienId = ?, infermierId = ?, dateCreation = ?, Ref = ?, caHT = ?, caTTC = ?, 
        fullName = ?, updatedAt = ?, businessUnitType = ?, etatdePaiment = ?, 
        numTelephone = ?, note = ?, type = ?
        WHERE id = ? AND destroyTime IS NULL`,  
      [
        villeId, clientId, aumbulanceId, businessUnitId, produitId, medcienId, infermierId, 
        dateCreation, Ref, caHT, caTTC, fullName, now, businessUnitType, etatdePaiment, 
        numTelephone, note, type, req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Globale non trouvée' });
    }

    res.json({
      id: req.params.id,
      villeId,
      clientId,
      aumbulanceId,
      businessUnitId,
      produitId,
      medcienId,
      infermierId,
      dateCreation,
      Ref,
      caHT,
      caTTC,
      fullName,
      updatedAt: now,
      businessUnitType,
      etatdePaiment,
      numTelephone,
      note,
      type
    });
  } catch (error) {
    console.error('Error updating globale:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer une globale (hard delete)
const deleteGlobale = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM Globales WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Globale non trouvée' });
    }

    res.json({ message: 'Globale supprimée définitivement avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des globales
const searchGlobales = async (req, res) => {
  try {
    const { query, type } = req.query;
    let sql = 'SELECT * FROM Globales WHERE destroyTime IS NULL';
    const params = [];

    if (query) {
      sql += ' AND (name LIKE ? OR value LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllGlobales,
  getGlobaleById,
  createGlobale,
  updateGlobale,
  deleteGlobale,
  searchGlobales
}; 