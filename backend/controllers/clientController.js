const db = require('../config/db');

// Récupérer tous les clients avec leurs villes et contacts
const getAllClients = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, v.name as villeName,
             c.primaryContactName, c.primaryContactEmail, c.primaryContactPhone, c.primaryContactFunction
      FROM Clients c 
      LEFT JOIN Villes v ON c.villeId = v.id 
      WHERE c.destroyTime IS NULL
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer un client par ID avec sa ville et contacts
const getClientById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.*, v.name as villeName,
             c.primaryContactName, c.primaryContactEmail, c.primaryContactPhone, c.primaryContactFunction
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
    const { 
      clientFullName, 
      email, 
      villeId, 
      primaryContactName, 
      primaryContactEmail, 
      primaryContactPhone, 
      primaryContactFunction 
    } = req.body;
    const now = new Date();

    const [result] = await db.query(
      `INSERT INTO Clients (
        clientFullName, email, villeId, 
        primaryContactName, primaryContactEmail, primaryContactPhone, primaryContactFunction,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientFullName, email, villeId, 
        primaryContactName, primaryContactEmail, primaryContactPhone, primaryContactFunction,
        now, now
      ]
    );

    res.status(201).json({
      id: result.insertId,
      clientFullName,
      email,
      villeId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      primaryContactFunction,
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
    const { 
      clientFullName, 
      email, 
      villeId, 
      primaryContactName, 
      primaryContactEmail, 
      primaryContactPhone, 
      primaryContactFunction 
    } = req.body;
    const now = new Date();

    const [result] = await db.query(
      `UPDATE Clients SET 
        clientFullName = ?, email = ?, villeId = ?, 
        primaryContactName = ?, primaryContactEmail = ?, primaryContactPhone = ?, primaryContactFunction = ?,
        updatedAt = ? 
      WHERE id = ? AND destroyTime IS NULL`,
      [
        clientFullName, email, villeId, 
        primaryContactName, primaryContactEmail, primaryContactPhone, primaryContactFunction,
        now, req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json({
      id: req.params.id,
      clientFullName,
      email,
      villeId,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      primaryContactFunction,
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
      'UPDATE Clients SET destroyTime = ? WHERE id = ?',
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
      SELECT c.*, v.name as villeName,
             c.primaryContactName, c.primaryContactEmail, c.primaryContactPhone, c.primaryContactFunction
      FROM Clients c 
      LEFT JOIN Villes v ON c.villeId = v.id 
      WHERE (c.clientFullName LIKE ? OR c.email LIKE ? OR c.primaryContactName LIKE ?) 
      AND c.destroyTime IS NULL
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer tous les contacts d'un client
const getClientContacts = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM ClientContacts 
      WHERE clientId = ? AND destroyTime IS NULL
      ORDER BY isPrimary DESC, contactName ASC
    `, [req.params.clientId]);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ajouter un contact à un client
const addClientContact = async (req, res) => {
  try {
    const { 
      clientId, 
      contactName, 
      contactEmail, 
      contactPhone, 
      contactFunction, 
      isPrimary 
    } = req.body;
    
    // Log de débogage
    console.log('📝 Données reçues pour ajouter un contact:', {
      clientId,
      contactName,
      contactEmail,
      contactPhone,
      contactFunction,
      isPrimary
    });
    
    const now = new Date();

    // Si c'est le contact principal, mettre à jour les autres contacts
    if (isPrimary) {
      console.log('🔄 Mise à jour des autres contacts (isPrimary = FALSE)');
      await db.query(
        'UPDATE ClientContacts SET isPrimary = FALSE WHERE clientId = ?',
        [clientId]
      );
    }

    console.log('💾 Insertion du nouveau contact...');
    const [result] = await db.query(
      `INSERT INTO ClientContacts (
        clientId, contactName, contactEmail, contactPhone, contactFunction, isPrimary, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [clientId, contactName, contactEmail, contactPhone, contactFunction, isPrimary, now, now]
    );

    console.log('✅ Contact inséré avec succès, ID:', result.insertId);

    res.status(201).json({
      id: result.insertId,
      clientId,
      contactName,
      contactEmail,
      contactPhone,
      contactFunction,
      isPrimary,
      createdAt: now,
      updatedAt: now
    });
  } catch (error) {
    console.error('❌ Erreur dans addClientContact:', error);
    console.error('❌ Message d\'erreur:', error.message);
    console.error('❌ Code d\'erreur:', error.code);
    res.status(500).json({ error: error.message });
  }
};

// Mettre à jour un contact
const updateClientContact = async (req, res) => {
  try {
    const { 
      contactName, 
      contactEmail, 
      contactPhone, 
      contactFunction, 
      isPrimary 
    } = req.body;
    const now = new Date();

    // Si c'est le contact principal, mettre à jour les autres contacts
    if (isPrimary) {
      const [contact] = await db.query('SELECT clientId FROM ClientContacts WHERE id = ?', [req.params.contactId]);
      if (contact.length > 0) {
        await db.query(
          'UPDATE ClientContacts SET isPrimary = FALSE WHERE clientId = ? AND id != ?',
          [contact[0].clientId, req.params.contactId]
        );
      }
    }

    const [result] = await db.query(
      `UPDATE ClientContacts SET 
        contactName = ?, contactEmail = ?, contactPhone = ?, contactFunction = ?, isPrimary = ?, updatedAt = ? 
      WHERE id = ? AND destroyTime IS NULL`,
      [contactName, contactEmail, contactPhone, contactFunction, isPrimary, now, req.params.contactId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contact non trouvé' });
    }

    res.json({
      id: req.params.contactId,
      contactName,
      contactEmail,
      contactPhone,
      contactFunction,
      isPrimary,
      updatedAt: now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprimer un contact
const deleteClientContact = async (req, res) => {
  try {
    const now = new Date();
    const [result] = await db.query(
      'UPDATE ClientContacts SET destroyTime = ? WHERE id = ?',
      [now, req.params.contactId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Contact non trouvé' });
    }

    res.json({ message: 'Contact supprimé avec succès' });
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
  searchClients,
  getClientContacts,
  addClientContact,
  updateClientContact,
  deleteClientContact
}; 