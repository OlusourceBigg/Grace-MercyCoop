const express = require('express');
const router = express.Router();
const { applyLoan, getMemberLoans, checkEligibility } = require('../controllers/loanController');
const { protect } = require('../middleware/auth');

router.get('/eligibility', protect, checkEligibility);
router.post('/apply', protect, applyLoan);
router.get('/', protect, getMemberLoans);

module.exports = router;