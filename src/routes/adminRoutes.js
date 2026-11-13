const express = require('express');
const router = express.Router();
const {
  getExecutiveMetrics,
  getPendingLoans,
  processLoanAction,
  getAllMembers,
  updateMemberKyc,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Restrict all sub-routes to Executive and Admin roles
router.use(protect);
router.use(authorize('Executive', 'Admin'));

router.get('/metrics', getExecutiveMetrics);
router.get('/loans/pending', getPendingLoans);
router.post('/loans/action', processLoanAction);
router.get('/members', getAllMembers);
router.post('/members/kyc', updateMemberKyc);

module.exports = router;