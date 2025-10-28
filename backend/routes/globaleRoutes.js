const express = require('express');
const router = express.Router();
const globaleController = require('../controllers/globaleController');
const { verifyToken } = require('../middleware/auth');

router.post('/import/json', globaleController.importGlobalesFromJson);
// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Routes CRUD pour les globales
router.get('/', globaleController.getAllGlobales);
router.get('/search', globaleController.searchGlobales);
router.get('/deleted/list', globaleController.getDeletedGlobales);
router.get('/:id', globaleController.getGlobaleById);
router.post('/', globaleController.createGlobale);
router.put('/:id', globaleController.updateGlobale);
router.delete('/:id', globaleController.deleteGlobale);

// Nouvelles routes pour la gestion du soft delete
router.post('/:id/restore', globaleController.restoreGlobale);
router.delete('/:id/hard', globaleController.hardDeleteGlobale);

// Route pour valider une globale
router.post('/:id/valider', globaleController.validerGlobale);

module.exports = router; 