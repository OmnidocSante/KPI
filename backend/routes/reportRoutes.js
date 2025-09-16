const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const reportCtrl = require('../controllers/reportController');

router.use(verifyToken);

router.get('/profit', reportCtrl.getProfit);

module.exports = router;


