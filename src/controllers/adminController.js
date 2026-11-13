const Member = require('../models/Member');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { sendSMS } = require('../services/notificationService');

// @desc    Get cooperative overview metrics for executive board
// @route   GET /api/admin/metrics
const getExecutiveMetrics = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments();
    const pendingLoansCount = await Loan.countDocuments({ status: 'Pending' });
    const activeLoans = await Loan.find({ status: 'Active' });

    const totalLoanPortfolio = activeLoans.reduce((sum, item) => sum + item.balance, 0);

    const members = await Member.find().select('totalSavings shareCapital specialDeposit');
    const totalThriftLiquidity = members.reduce(
      (sum, m) => sum + (m.totalSavings || 0) + (m.shareCapital || 0) + (m.specialDeposit || 0),
      0
    );

    res.json({
      totalMembers,
      pendingLoansCount,
      totalLoanPortfolio,
      totalThriftLiquidity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending loan applications for board review
// @route   GET /api/admin/loans/pending
const getPendingLoans = async (req, res) => {
  try {
    const pendingLoans = await Loan.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(pendingLoans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or Reject a Loan Application with SMS Dispatch
// @route   POST /api/admin/loans/action
const processLoanAction = async (req, res) => {
  try {
    const { loanId, action, rejectionReason } = req.body;

    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    if (loan.status !== 'Pending') {
      return res.status(400).json({ message: `Loan is already marked as ${loan.status}` });
    }

    const applicant = await Member.findOne({ memberId: loan.memberId });

    if (action === 'Approved') {
      loan.status = 'Active';
      await loan.save();

      const transactionId = 'TXN-' + Math.floor(1000 + Math.random() * 9000);
      await Transaction.create({
        transactionId,
        memberId: loan.memberId,
        title: 'Loan Disbursement (' + loan.loanId + ')',
        category: 'Loan',
        amount: loan.principal,
        type: 'credit',
        status: 'Approved',
      });

      // Dispatch SMS to applicant
      if (applicant) {
        const approvalMsg = `Congratulations ${applicant.fullName}! Your loan request of NGN ${loan.principal.toLocaleString()} (Ref: ${loan.loanId}) has been APPROVED by the Executive Board and disbursed to your account.`;
        sendSMS(applicant.phone, approvalMsg);
      }

      return res.json({ message: 'Loan approved and facility activated successfully.', loan });
    } else {
      loan.status = 'Rejected';
      await loan.save();

      // Dispatch Rejection SMS
      if (applicant) {
        const rejectionMsg = `Notice: Your loan application ${loan.loanId} has been declined by the Executive Committee. Reason: ${rejectionReason || 'Guarantor verification or credit policy limits.'}`;
        sendSMS(applicant.phone, rejectionMsg);
      }

      return res.json({
        message: 'Loan application rejected by executive committee.',
        reason: rejectionReason || 'Criteria not met',
        loan,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get member roster for KYC audits
// @route   GET /api/admin/members
const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().select('-password').sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update member KYC tier
// @route   POST /api/admin/members/kyc
const updateMemberKyc = async (req, res) => {
  try {
    const { memberId, kycStatus } = req.body;
    const member = await Member.findOne({ memberId });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.kycStatus = kycStatus;
    await member.save();

    // Send KYC Verified SMS
    const kycMsg = `Grace & Mercy KYC Update: Member ${member.fullName}, your profile has been upgraded to ${kycStatus}. You now have full access to higher credit limits and voting privileges.`;
    sendSMS(member.phone, kycMsg);

    res.json({ message: `Member KYC updated to ${kycStatus}`, member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExecutiveMetrics,
  getPendingLoans,
  processLoanAction,
  getAllMembers,
  updateMemberKyc,
};