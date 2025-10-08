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
    const { 
      number, 
      numberPlate, 
      type, 
      dateAcquisition, 
      montantAchat, 
      materielIntegre, 
      villeActivite, 
      kilometrage, 
      photosVehicule 
    } = req.body;
    
    const now = new Date();
    const [result] = await db.query(
      `INSERT INTO Aumbulances (
        number, 
        numberPlate, 
        type, 
        dateAcquisition, 
        montantAchat, 
        materielIntegre, 
        villeActivite, 
        kilometrage, 
        photosVehicule, 
        createdAt, 
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        number, 
        numberPlate, 
        type, 
        dateAcquisition, 
        montantAchat, 
        materielIntegre, 
        villeActivite, 
        kilometrage, 
        photosVehicule, 
        now, 
        now
      ]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      number, 
      numberPlate,
      type,
      dateAcquisition,
      montantAchat,
      materielIntegre,
      villeActivite,
      kilometrage,
      photosVehicule,
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
    const { 
      number, 
      numberPlate, 
      type, 
      dateAcquisition, 
      montantAchat, 
      materielIntegre, 
      villeActivite, 
      kilometrage, 
      photosVehicule 
    } = req.body;
    
    const now = new Date();
    const [result] = await db.query(
      `UPDATE Aumbulances SET 
        number = ?, 
        numberPlate = ?, 
        type = ?, 
        dateAcquisition = ?, 
        montantAchat = ?, 
        materielIntegre = ?, 
        villeActivite = ?, 
        kilometrage = ?, 
        photosVehicule = ?, 
        updatedAt = ? 
      WHERE id = ? AND destroyTime IS NULL`,
      [
        number, 
        numberPlate, 
        type, 
        dateAcquisition, 
        montantAchat, 
        materielIntegre, 
        villeActivite, 
        kilometrage, 
        photosVehicule, 
        now, 
        req.params.id
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ambulance non trouvée' });
    }
    
    res.json({ 
      id: req.params.id, 
      number, 
      numberPlate,
      type,
      dateAcquisition,
      montantAchat,
      materielIntegre,
      villeActivite,
      kilometrage,
      photosVehicule,
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

// Récupérer une image spécifique d'une ambulance
const getAmbulanceImage = async (req, res) => {
  try {
    const { id, imageIndex } = req.params;
    const [rows] = await db.query(
      'SELECT photosVehicule FROM Aumbulances WHERE id = ? AND destroyTime IS NULL',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ambulance non trouvée' });
    }
    
    const photos = rows[0].photosVehicule;
    if (!photos) {
      return res.status(404).json({ message: 'Aucune photo trouvée' });
    }
    
    // Séparer les images (stockées en base64)
    const imageArray = photos.split('|||');
    const imageIndexNum = parseInt(imageIndex);
    
    if (imageIndexNum < 0 || imageIndexNum >= imageArray.length) {
      return res.status(404).json({ message: 'Index d\'image invalide' });
    }
    
    const imageData = imageArray[imageIndexNum];
    
    // Extraire le type MIME et les données base64
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: 'Format d\'image invalide' });
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    
    // Convertir base64 en buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Envoyer l'image avec le bon type MIME
    res.set({
      'Content-Type': mimeType,
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000' // Cache 1 an
    });
    
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  deleteAmbulance,
  getAmbulanceImage
}; 