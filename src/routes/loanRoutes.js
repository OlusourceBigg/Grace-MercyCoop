const express = require('express');
const router = express.Router();
const { applyLoan, getMemberLoans } = require('../controllers/loanController');
const { protect } = require('../middleware/auth');

router.post('/apply', protect, applyLoan);
router.get('/', protect, getMemberLoans);

module.exports = router;