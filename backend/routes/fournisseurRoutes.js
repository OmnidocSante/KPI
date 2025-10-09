const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fournisseurController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', ctrl.listFournisseurs);
router.get('/:id', ctrl.getFournisseur);
router.post('/', ctrl.createFournisseur);
router.put('/:id', ctrl.updateFournisseur);
router.delete('/:id', ctrl.deleteFournisseur);

module.exports = router;
