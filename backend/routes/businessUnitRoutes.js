const express = require('express');
const router = express.Router();
const businessUnitController = require('../controllers/businessUnitController');
const auth = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(auth);

// Routes CRUD pour les business units
router.get('/', businessUnitController.getAllBusinessUnits);
router.get('/:id', businessUnitController.getBusinessUnitById);
router.post('/', businessUnitController.createBusinessUnit);
router.put('/:id', businessUnitController.updateBusinessUnit);
router.delete('/:id', businessUnitController.deleteBusinessUnit);

module.exports = router; 