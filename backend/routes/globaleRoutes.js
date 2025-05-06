const express = require('express');
const router = express.Router();
const globaleController = require('../controllers/globaleController');
const auth = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(auth);

// Routes CRUD pour les globales
router.get('/', globaleController.getAllGlobales);
router.get('/search', globaleController.searchGlobales);
router.get('/:id', globaleController.getGlobaleById);
router.post('/', globaleController.createGlobale);
router.put('/:id', globaleController.updateGlobale);
router.delete('/:id', globaleController.deleteGlobale);

module.exports = router; 