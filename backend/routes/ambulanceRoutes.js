const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulanceController');
const { verifyToken } = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Routes CRUD pour les ambulances
router.get('/', ambulanceController.getAllAmbulances);
router.get('/:id', ambulanceController.getAmbulanceById);
router.post('/', ambulanceController.createAmbulance);
router.put('/:id', ambulanceController.updateAmbulance);
router.delete('/:id', ambulanceController.deleteAmbulance);

module.exports = router; 