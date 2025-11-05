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
    
    // Parser les prestationsIncluses JSON pour chaque client
    const clientsWithParsedPrestations = rows.map(row => {
      try {
        return {
          ...row,
          prestationsIncluses: row.prestationsIncluses ? (typeof row.prestationsIncluses === 'string' ? JSON.parse(row.prestationsIncluses) : row.prestationsIncluses) : []
        };
      } catch (e) {
        return {
          ...row,
          prestationsIncluses: []
        };
      }
    });
    
    res.json(clientsWithParsedPrestations);
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
    
    // Parser les prestationsIncluses JSON
    let prestationsParsed = [];
    try {
      if (rows[0].prestationsIncluses) {
        prestationsParsed = typeof rows[0].prestationsIncluses === 'string' 
          ? JSON.parse(rows[0].prestationsIncluses) 
          : rows[0].prestationsIncluses;
      }
    } catch (e) {
      prestationsParsed = [];
    }
    
    const client = {
      ...rows[0],
      prestationsIncluses: prestationsParsed
    };
    
    res.json(client);
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
      primaryContactFunction,
      // Nouveaux champs KPI
      typeStructure,
      secteurActivite,
      adresse,
      telephone,
      typeContrat,
      nombreCollaborateurs,
      prestationsIncluses
    } = req.body;
    const now = new Date();

    // Convertir prestationsIncluses en JSON si c'est un tableau
    const prestationsJSON = prestationsIncluses ? JSON.stringify(prestationsIncluses) : null;

    const [result] = await db.query(
      `INSERT INTO Clients (
        clientFullName, email, villeId, 
        primaryContactName, primaryContactEmail, primaryContactPhone, primaryContactFunction,
        typeStructure, secteurActivite, adresse, telephone, typeContrat, nombreCollaborateurs, prestationsIncluses,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientFullName, email, villeId, 
        primaryContactName, primaryContactEmail, primaryContactPhone, primaryContactFunction,
        typeStructure, secteurActivite, adresse, telephone, typeContrat, nombreCollaborateurs, prestationsJSON,
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
      typeStructure,
      secteurActivite,
      adresse,
      telephone,
      typeContrat,
      nombreCollaborateurs,
      prestationsIncluses: prestationsIncluses || [],
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
      primaryContactFunction,
      // Nouveaux champs KPI
      typeStructure,
      secteurActivite,
      adresse,
      telephone,
      typeContrat,
      nombreCollaborateurs,
      prestationsIncluses
    } = req.body;
    const now = new Date();

    // Convertir prestationsIncluses en JSON si c'est un tableau
    const prestationsJSON = prestationsIncluses ? JSON.stringify(prestationsIncluses) : null;

    const [result] = await db.query(
      `UPDATE Clients SET 
        clientFullName = ?, email = ?, villeId = ?, 
        primaryContactName = ?, primaryContactEmail = ?, primaryContactPhone = ?, primaryContactFunction = ?,
        typeStructure = ?, secteurActivite = ?, adresse = ?, telephone = ?, typeContrat = ?, nombreCollaborateurs = ?, prestationsIncluses = ?,
        updatedAt = ? 
      WHERE id = ? AND destroyTime IS NULL`,
      [
        clientFullName, email, villeId, 
        primaryContactName, primaryContactEmail, primaryContactPhone, primaryContactFunction,
        typeStructure, secteurActivite, adresse, telephone, typeContrat, nombreCollaborateurs, prestationsJSON,
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
      typeStructure,
      secteurActivite,
      adresse,
      telephone,
      typeContrat,
      nombreCollaborateurs,
      prestationsIncluses: prestationsIncluses || [],
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

// Rechercher des clients (avec support des nouveaux champs)
const searchClients = async (req, res) => {
  try {
    const { query, typeStructure, secteurActivite, typeContrat, prestation } = req.query;
    
    let sql = `
      SELECT c.*, v.name as villeName,
             c.primaryContactName, c.primaryContactEmail, c.primaryContactPhone, c.primaryContactFunction
      FROM Clients c 
      LEFT JOIN Villes v ON c.villeId = v.id 
      WHERE c.destroyTime IS NULL
    `;
    const params = [];

    if (query) {
      sql += ` AND (c.clientFullName LIKE ? OR c.email LIKE ? OR c.primaryContactName LIKE ? OR c.secteurActivite LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (typeStructure) {
      sql += ` AND c.typeStructure = ?`;
      params.push(typeStructure);
    }

    if (secteurActivite) {
      sql += ` AND c.secteurActivite LIKE ?`;
      params.push(`%${secteurActivite}%`);
    }

    if (typeContrat) {
      sql += ` AND c.typeContrat = ?`;
      params.push(typeContrat);
    }

    if (prestation) {
      sql += ` AND JSON_CONTAINS(c.prestationsIncluses, ?)`;
      params.push(JSON.stringify(prestation));
    }

    const [rows] = await db.query(sql, params);
    
    // Parser les prestationsIncluses JSON
    const rowsWithParsedPrestations = rows.map(row => {
      try {
        return {
          ...row,
          prestationsIncluses: row.prestationsIncluses ? (typeof row.prestationsIncluses === 'string' ? JSON.parse(row.prestationsIncluses) : row.prestationsIncluses) : []
        };
      } catch (e) {
        return {
          ...row,
          prestationsIncluses: []
        };
      }
    });
    
    res.json(rowsWithParsedPrestations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Récupérer les statistiques KPI des clients
const getClientKPIs = async (req, res) => {
  try {
    // Nombre total de clients
    const [totalResult] = await db.query(`
      SELECT COUNT(*) as total FROM Clients WHERE destroyTime IS NULL
    `);
    const totalClients = totalResult[0].total;

    // Répartition par type de structure
    const [byTypeStructure] = await db.query(`
      SELECT typeStructure, COUNT(*) as count 
      FROM Clients 
      WHERE destroyTime IS NULL AND typeStructure IS NOT NULL
      GROUP BY typeStructure
    `);

    // Répartition par secteur d'activité
    const [bySecteur] = await db.query(`
      SELECT secteurActivite, COUNT(*) as count 
      FROM Clients 
      WHERE destroyTime IS NULL AND secteurActivite IS NOT NULL AND secteurActivite != ''
      GROUP BY secteurActivite
      ORDER BY count DESC
      LIMIT 10
    `);

    // Répartition par type de contrat
    const [byContrat] = await db.query(`
      SELECT typeContrat, COUNT(*) as count 
      FROM Clients 
      WHERE destroyTime IS NULL AND typeContrat IS NOT NULL
      GROUP BY typeContrat
    `);

    // Évolution du portefeuille client par mois (compatibilité ONLY_FULL_GROUP_BY)
    const [evolutionByMonth] = await db.query(`
      SELECT month, COUNT(*) AS count
      FROM (
        SELECT DATE_FORMAT(createdAt, '%Y-%m') AS month
        FROM Clients
        WHERE destroyTime IS NULL
      ) AS t
      GROUP BY month
      ORDER BY month ASC
    `);

    // Évolution du portefeuille client par trimestre (compatibilité ONLY_FULL_GROUP_BY)
    const [evolutionByQuarter] = await db.query(`
      SELECT quarter, COUNT(*) AS count
      FROM (
        SELECT CONCAT(YEAR(createdAt), '-Q', QUARTER(createdAt)) AS quarter
        FROM Clients
        WHERE destroyTime IS NULL
      ) AS t
      GROUP BY quarter
      ORDER BY quarter ASC
    `);

    // Évolution du portefeuille client par année (compatibilité ONLY_FULL_GROUP_BY)
    const [evolutionByYear] = await db.query(`
      SELECT year, COUNT(*) AS count
      FROM (
        SELECT YEAR(createdAt) AS year
        FROM Clients
        WHERE destroyTime IS NULL
      ) AS t
      GROUP BY year
      ORDER BY year ASC
    `);

    res.json({
      totalClients,
      byTypeStructure,
      bySecteur,
      byContrat,
      evolutionByMonth,
      evolutionByQuarter,
      evolutionByYear
    });
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
  deleteClientContact,
  getClientKPIs
}; 