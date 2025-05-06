const express = require('express');
const router = express.Router();
const medecinController = require('../controllers/medecinController');
const auth = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(auth);

// Routes CRUD pour les médecins
router.get('/', medecinController.getAllMedecins);
router.get('/search', medecinController.searchMedecinsBySpecialty);
router.get('/:id', medecinController.getMedecinById);
router.post('/', medecinController.createMedecin);
router.put('/:id', medecinController.updateMedecin);
router.delete('/:id', medecinController.deleteMedecin);

module.exports = router; 