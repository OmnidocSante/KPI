const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chargeController');
const { verifyToken } = require('../middleware/auth');

//router.use(verifyToken);

// Catégories
router.get('/categories', ctrl.getCategories);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// Charges
router.get('/', ctrl.listCharges);
router.get('/:id', ctrl.getCharge);
router.post('/', ctrl.createCharge);
router.put('/:id', ctrl.updateCharge);
router.delete('/:id', ctrl.deleteCharge);
router.post('/autoroute', ctrl.autorouteCharge);
router.post('/carburant', ctrl.carburantCharge);

// Échéances
router.get('/:chargeId/installments', ctrl.listInstallments);
router.patch('/installments/:installmentId/pay', ctrl.markInstallmentPaid);
router.patch('/installments/:installmentId/unpay', ctrl.markInstallmentUnpaid);

module.exports = router;


