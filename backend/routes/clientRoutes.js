const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyToken } = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Routes CRUD pour les clients
router.get('/', clientController.getAllClients);
router.get('/kpis', clientController.getClientKPIs);
router.get('/search', clientController.searchClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

// Routes pour la gestion des contacts
router.get('/:clientId/contacts', clientController.getClientContacts);
router.post('/:clientId/contacts', clientController.addClientContact);
router.put('/contacts/:contactId', clientController.updateClientContact);
router.delete('/contacts/:contactId', clientController.deleteClientContact);

module.exports = router; 