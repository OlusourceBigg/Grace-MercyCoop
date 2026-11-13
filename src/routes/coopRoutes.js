const express = require('express');
const router = express.Router();
const { getSummary, recordDeposit, getTransactions } = require('../controllers/coopController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.post('/deposit', protect, recordDeposit);
router.get('/transactions', protect, getTransactions);

module.exports = router;