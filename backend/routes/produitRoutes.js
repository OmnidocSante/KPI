const express = require('express');
const router = express.Router();
const produitController = require('../controllers/produitController');
const { verifyToken } = require('../middleware/auth');

// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Routes CRUD pour les produits
router.get('/', produitController.getAllProduits);
router.get('/search', produitController.searchProduits);
router.get('/:id', produitController.getProduitById);
router.post('/', produitController.createProduit);
router.put('/:id', produitController.updateProduit);
router.delete('/:id', produitController.deleteProduit);

// Route spécifique pour la gestion du stock
router.patch('/:id/stock', produitController.updateStock);

module.exports = router; 