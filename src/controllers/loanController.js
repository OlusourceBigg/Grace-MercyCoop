const Loan = require('../models/Loan');
const Member = require('../models/Member');
const { sendSMS } = require('../services/notificationService');

// @desc    Calculate member borrowing eligibility & active debt constraints
// @route   GET /api/loans/eligibility
const checkEligibility = async (req, res) => {
  try {
    const member = await Member.findById(req.member._id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const maxLimit = member.totalSavings * 2;
    const existingActiveLoans = await Loan.find({
      memberId: member.memberId,
      status: { $in: ['Active', 'Pending'] },
    });

    const currentDebt = existingActiveLoans.reduce((acc, curr) => acc + curr.balance, 0);
    const availableBorrowingPower = Math.max(0, maxLimit - currentDebt);

    const isKYCVerified = member.kycStatus === 'Verified Level 2';
    const hasSufficientSavings = member.totalSavings >= 100000;
    const isEligible = isKYCVerified && hasSufficientSavings && availableBorrowingPower > 0;

    res.json({
      isEligible,
      totalSavings: member.totalSavings,
      maxBorrowingLimit: maxLimit,
      currentDebt,
      availableBorrowingPower,
      activeLoansCount: existingActiveLoans.length,
      kycStatus: member.kycStatus,
      reasons: [
        !isKYCVerified ? 'KYC Level 2 verification required.' : null,
        !hasSufficientSavings ? 'Minimum savings threshold of ₦100,000 not met.' : null,
        availableBorrowingPower <= 0 ? 'Current active loan balance exhausts borrowing limit.' : null,
      ].filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit a loan application & trigger guarantor notifications
// @route   POST /api/loans/apply
const applyLoan = async (req, res) => {
  try {
    const { loanType, amount, tenor, guarantor1, guarantor2 } = req.body;
    const numAmount = parseFloat(amount);
    const numTenor = parseInt(tenor);

    const member = await Member.findById(req.member._id);
    const maxLimit = member.totalSavings * 2;

    if (numAmount > maxLimit) {
      return res.status(400).json({
        message: 'Requested loan exceeds maximum borrowing limit of ₦' + maxLimit.toLocaleString(),
      });
    }

    if (!guarantor1 || !guarantor2) {
      return res.status(400).json({ message: 'Two cooperative guarantors are required' });
    }

    const interest = numAmount * 0.05;
    const monthlyDeduction = Math.round((numAmount + interest) / numTenor);
    const loanId = 'LN-' + Math.floor(1000 + Math.random() * 9000);

    const loan = await Loan.create({
      loanId,
      memberId: member.memberId,
      type: loanType,
      principal: numAmount,
      balance: numAmount,
      tenorMonths: numTenor,
      monthlyDeduction,
      guarantors: [
        { fullName: guarantor1, status: 'Pending' },
        { fullName: guarantor2, status: 'Pending' },
      ],
      status: 'Pending',
    });

    // 1. Notify Applicant via SMS
    const applicantMsg = `Dear ${member.fullName}, your loan request of NGN ${numAmount.toLocaleString()} (${loanId}) has been received and forwarded to the Executive Board for review.`;
    sendSMS(member.phone, applicantMsg);

    // 2. Notify Nominated Guarantors
    const guarantorMsg = `Grace & Mercy Alert: Member ${member.fullName} (${member.memberId}) has nominated you as a guarantor for a credit request of NGN ${numAmount.toLocaleString()} (Ref: ${loanId}). Contact secretariat if unauthorized.`;
    
    // Look up guarantor mobile if they exist in member directory
    const g1Member = await Member.findOne({ fullName: new RegExp(guarantor1.trim(), 'i') });
    if (g1Member) sendSMS(g1Member.phone, guarantorMsg);

    const g2Member = await Member.findOne({ fullName: new RegExp(guarantor2.trim(), 'i') });
    if (g2Member) sendSMS(g2Member.phone, guarantorMsg);

    res.status(201).json({
      message: 'Loan application submitted and notifications dispatched',
      loan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get member loan history
// @route   GET /api/loans
const getMemberLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ memberId: req.member.memberId }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLoan, getMemberLoans, checkEligibility };