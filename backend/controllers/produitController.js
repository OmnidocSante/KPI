const db = require('../config/db');

// Récupérer tous les produits avec leurs business units
const getAllProduits = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, b.businessUnitType 
      FROM Produits p 
      LEFT JOIN BusinessUnits b ON p.businessUnitId = b.id 
      WHERE p.destroyTime IS NULL
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un produit par ID
const getProduitById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, b.businessUnitType 
      FROM Produits p 
      LEFT JOIN BusinessUnits b ON p.businessUnitId = b.id 
      WHERE p.id = ? AND p.destroyTime IS NULL
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Créer un nouveau produit
const createProduit = async (req, res) => {
  try {
    const { name, price, quantity, businessUnitId } = req.body;
    const now = new Date();

    // Vérifier si le business unit existe
    if (businessUnitId) {
      const [businessUnit] = await db.query(
        'SELECT id FROM BusinessUnits WHERE id = ? AND destroyTime IS NULL',
        [businessUnitId]
      );
      if (businessUnit.length === 0) {
        return res.status(400).json({ message: 'Business Unit non trouvé' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO Produits (name, price, quantity, businessUnitId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [name, price, quantity, businessUnitId, now, now]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      price,
      quantity,
      businessUnitId,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un produit
const updateProduit = async (req, res) => {
  try {
    const { name, price, quantity, businessUnitId } = req.body;
    const now = new Date();

    // Vérifier si le business unit existe
    if (businessUnitId) {
      const [businessUnit] = await db.query(
        'SELECT id FROM BusinessUnits WHERE id = ? AND destroyTime IS NULL',
        [businessUnitId]
      );
      if (businessUnit.length === 0) {
        return res.status(400).json({ message: 'Business Unit non trouvé' });
      }
    }

    const [result] = await db.query(
      'UPDATE Produits SET name = ?, price = ?, quantity = ?, businessUnitId = ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [name, price, quantity, businessUnitId, now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({
      id: req.params.id,
      name,
      price,
      quantity,
      businessUnitId,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un produit (soft delete)
const deleteProduit = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE Produits SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rechercher des produits
const searchProduits = async (req, res) => {
  try {
    const { query, minPrice, maxPrice, businessUnitId } = req.query;
    let sql = `
      SELECT p.*, b.businessUnitType 
      FROM Produits p 
      LEFT JOIN BusinessUnits b ON p.businessUnitId = b.id 
      WHERE p.destroyTime IS NULL
    `;
    const params = [];

    if (query) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${query}%`);
    }

    if (minPrice) {
      sql += ' AND p.price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      sql += ' AND p.price <= ?';
      params.push(maxPrice);
    }

    if (businessUnitId) {
      sql += ' AND p.businessUnitId = ?';
      params.push(businessUnitId);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour le stock
const updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const now = new Date();

    const [result] = await db.query(
      'UPDATE Produits SET quantity = quantity + ?, updatedAt = ? WHERE id = ? AND destroyTime IS NULL',
      [quantity, now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json({ message: 'Stock mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProduits,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  searchProduits,
  updateStock
}; 