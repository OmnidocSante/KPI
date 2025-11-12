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
        etatdePaiment, numTelephone, note, type, valider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        villeId, clientId, aumbulanceId, businessUnitId, produitId, medcienId, infermierId, 
        dateCreation, Ref, caHT, caTTC, fullName, now, now, businessUnitType, 
        etatdePaiment, numTelephone, note, type, 1
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

// Supprimer une globale (soft delete)
const deleteGlobale = async (req, res) => {
  try {
    const now = new Date();
    
    const [result] = await db.query(
      'UPDATE Globales SET destroyTime = ? WHERE id = ? AND destroyTime IS NULL',
      [now, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Globale non trouvée ou déjà supprimée' });
    }

    res.json({ message: 'Globale supprimée avec succès (soft delete)' });
  } catch (error) {
    console.error('Error soft deleting globale:', error);
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

// Restaurer une globale supprimée (soft delete)
const restoreGlobale = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE Globales SET destroyTime = NULL WHERE id = ? AND destroyTime IS NOT NULL',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Globale non trouvée ou pas supprimée' });
    }

    res.json({ message: 'Globale restaurée avec succès' });
  } catch (error) {
    console.error('Error restoring globale:', error);
    res.status(500).json({ error: error.message });
  }
};

// Récupérer toutes les globales supprimées (soft delete)
const getDeletedGlobales = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Globales WHERE destroyTime IS NOT NULL');
    res.json(rows);
  } catch (error) {
    console.error('Error getting deleted globales:', error);
    res.status(500).json({ error: error.message });
  }
};

// Supprimer définitivement une globale (hard delete - pour les administrateurs)
const hardDeleteGlobale = async (req, res) => {
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
    console.error('Error hard deleting globale:', error);
    res.status(500).json({ error: error.message });
  }
};

// Valider une globale (passer valider de 0 à 1)
const validerGlobale = async (req, res) => {
  try {
    const [result] = await db.query(
      'UPDATE Globales SET valider = 1 WHERE id = ? AND destroyTime IS NULL',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Globale non trouvée' });
    }

    res.json({ message: 'Globale validée avec succès' });
  } catch (error) {
    console.error('Error validating globale:', error);
    res.status(500).json({ error: error.message });
  }
};

// Fonction utilitaire pour récupérer ou créer un ID dans une table
const getIdOrCreate = async (table, field, value) => {
  if (!value) return null;
  // Rechercher l'ID existant
  const [rows] = await db.query(`SELECT id FROM ${table} WHERE ${field} = ? AND destroyTime IS NULL`, [value]);
  if (rows.length > 0) return rows[0].id;
  // Créer un nouvel enregistrement si non trouvé
  const [result] = await db.query(`INSERT INTO ${table} (${field}, createdAt, updatedAt) VALUES (?, NOW(), NOW())`, [value]);
  return result.insertId;
};

// Fonction pour normaliser le type de business unit
const normalizeBusinessUnitType = (val) => {
  if (!val) return null;
  const normalized = val.toLowerCase().trim();
  return normalized === 'assurance' ? 'assurance' : normalized;
};

// Importer des globales depuis un fichier JSON
const importGlobalesFromJson = async (req, res) => {
  try {
    const { types } = req.body;
    
    if (!types || !Array.isArray(types)) {
      return res.status(400).json({ 
        error: 'Le format JSON doit contenir un tableau "types" avec les données des globales' 
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < types.length; i++) {
      const item = types[i];
      
      try {
        // Récupérer ou créer les IDs des entités liées
        const villeId = await getIdOrCreate('villes', 'name', item.ville);
        const clientId = await getIdOrCreate('clients', 'clientFullName', item.client);
        
        // Normaliser le type de business unit
        const normalizedBUType = normalizeBusinessUnitType(item.businessUnit);
        const businessUnitId = normalizedBUType ? await getIdOrCreate('businessunits', 'businessUnitType', normalizedBUType) : null;

        // Préparer les données communes
        const now = new Date();
        const dateCreation = item.datecreation ? new Date(item.datecreation) : null;
        const caHT = item.caHT || 0;
        const caTTC = item.caTTC || 0;

        // Déterminer si c'est une prestation de transport (TAM, TAS ou VSL)
        const produitUpper = item.produit ? item.produit.toUpperCase().trim() : '';
        const isTransportPrestation = ['TAM', 'TAS', 'VSL'].includes(produitUpper);
        
        // Si c'est une prestation de transport : ajouter l'ambulance, PAS de médecin/infirmier
        // Si c'est une prestation d'honoraires : ajouter médecin/infirmier, PAS d'ambulance
        let ambulanceId = null;
        let medcienId = null;
        let infermierId = null;
        
        if (isTransportPrestation) {
          // Prestation de transport : seulement l'ambulance
          ambulanceId = item.ambulance ? await getIdOrCreate('aumbulances', 'number', item.ambulance) : null;
        } else {
          // Prestation d'honoraires : médecin ou infirmier
          medcienId = item.medecin ? await getIdOrCreate('medciens', 'name', item.medecin.trim()) : null;
          infermierId = item.infirmier ? await getIdOrCreate('infirmier', 'nom', item.infirmier.trim()) : null;
        }

        // Créer le produit
        const produitId = await getIdOrCreate('produits', 'name', item.produit);
        
        // Insérer la prestation
        const [result] = await db.query(
          `INSERT INTO Globales (
            villeId, clientId, aumbulanceId, businessUnitId, produitId, medcienId, infermierId, 
            dateCreation, Ref, caHT, caTTC, fullName, createdAt, updatedAt, businessUnitType, 
            etatdePaiment, numTelephone, note, type, valider
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            villeId, clientId, ambulanceId, businessUnitId, produitId, medcienId, infermierId, 
            dateCreation, item.Ref, caHT, caTTC, item.fullname, now, now, normalizedBUType, 
            item.etat_paiement, item.numTelephone, item.note, item.type, 0
          ]
        );

        results.push({
          index: i,
          id: result.insertId,
          ref: item.Ref,
          fullname: item.fullname,
          prestation: item.prestation || item.produit,
          ambulance: ambulanceId ? item.ambulance : 'N/A',
          status: 'success'
        });

      } catch (itemError) {
        console.error(`Erreur lors du traitement de l'item ${i}:`, itemError);
        errors.push({
          index: i,
          ref: item.Ref || 'N/A',
          fullname: item.fullname || 'N/A',
          error: itemError.message,
          status: 'error'
        });
      }
    }

    res.status(200).json({
      message: `Traitement terminé: ${results.length} globales créées avec succès, ${errors.length} erreurs`,
      success: results,
      errors: errors,
      summary: {
        total: types.length,
        success: results.length,
        errors: errors.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'import des globales:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'import des globales', 
      details: error.message 
    });
  }
};

module.exports = {
  getAllGlobales,
  getGlobaleById,
  createGlobale,
  updateGlobale,
  deleteGlobale,
  searchGlobales,
  restoreGlobale,
  getDeletedGlobales,
  hardDeleteGlobale,
  importGlobalesFromJson,
  validerGlobale
}; 