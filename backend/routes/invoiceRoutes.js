const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  listInvoices,
  listPaidInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  markPaid,
  softDelete,
  unpayInvoice
} = require('../controllers/invoiceController');

router.use(verifyToken);

router.get('/', listInvoices);
router.get('/paid', listPaidInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/pay', markPaid);
router.patch('/:id/unpay', unpayInvoice);
router.delete('/:id', softDelete);

module.exports = router;


