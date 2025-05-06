const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(auth);

// Routes CRUD pour les clients
router.get('/', clientController.getAllClients);
router.get('/search', clientController.searchClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router; 