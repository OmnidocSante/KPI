const express = require('express');
const router = express.Router();
const {
  getAllAmbulanciers,
  getAmbulancierById,
  createAmbulancier,
  updateAmbulancier,
  deleteAmbulancier
} = require('../controllers/ambulancierController');
const { verifyToken }= require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(verifyToken);
// Protéger les routes si nécessaire
router.get('/', getAllAmbulanciers);
router.get('/:id',getAmbulancierById);
router.post('/', createAmbulancier);
router.put('/:id', updateAmbulancier);
router.delete('/:id', deleteAmbulancier);

module.exports = router;



