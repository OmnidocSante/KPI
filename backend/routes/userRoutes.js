const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');

// Route d'authentification (publique)
router.post('/login', userController.login);

// Routes protégées par le middleware d'authentification
router.use(verifyToken);

// Route pour vérifier l'authentification
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

// Routes CRUD pour les utilisateurs
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router; 