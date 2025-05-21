const express = require('express');
const router = express.Router();
const infirmierController = require('../controllers/infermierController');
const { verifyToken } = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Routes CRUD pour les infirmiers
router.get('/', infirmierController.getAllinfirmiers);
router.get('/:id', infirmierController.getinfirmierById);
router.post('/', infirmierController.createinfirmier);
router.put('/:id', infirmierController.updateinfirmier);
router.delete('/:id', infirmierController.deleteinfirmier);

module.exports = router; 