const express = require('express');
const router = express.Router();
const villeController = require('../controllers/villeController');
const { verifyToken } = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Routes CRUD pour les villes
router.get('/', villeController.getAllVilles);
router.get('/search', villeController.searchVilles);
router.get('/:id', villeController.getVilleById);
router.post('/', villeController.createVille);
router.put('/:id', villeController.updateVille);
router.delete('/:id', villeController.deleteVille);

module.exports = router; 