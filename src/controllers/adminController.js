const Member = require('../models/Member');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const { sendTermiiSMS, sendExpoPushNotification } = require('../services/notificationService');

const getExecutiveMetrics = async (req, res) => {
  try {
    const totalMembers = await Member.countDocuments({ role: 'Member' });
    const pendingLoans = await Loan.countDocuments({ status: 'Pending' });

    const savingsAggregate = await Member.aggregate([
      {
        $group: {
          _id: null,
          totalSavings: { $sum: '$totalSavings' },
          totalThrift: { $sum: '$monthlyThrift' },
          totalShareCapital: { $sum: '$shareCapital' },
        },
      },
    ]);

    const metrics = savingsAggregate[0] || {
      totalSavings: 0,
      totalThrift: 0,
      totalShareCapital: 0,
    };

    res.json({
      totalMembers,
      pendingLoans,
      ...metrics,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ status: 'Pending' })
      .populate('member', 'fullName memberId phone email totalSavings')
      .sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processLoanAction = async (req, res) => {
  try {
    const { loanId, action, rejectionReason } = req.body;
    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'Approved' or 'Rejected'" });
    }

    const loan = await Loan.findById(loanId).populate('member');
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    loan.status = action;
    loan.approvedBy = req.member._id;
    if (action === 'Rejected') {
      loan.rejectionReason = rejectionReason || 'Criteria not met';
    }
    await loan.save();

    // Notify Member
    const smsMsg =
      action === 'Approved'
        ? `Dear ${loan.member.fullName}, your loan request of NGN ${loan.amount} has been APPROVED.`
        : `Dear ${loan.member.fullName}, your loan request of NGN ${loan.amount} was not approved. Reason: ${loan.rejectionReason}`;

    await sendTermiiSMS(loan.member.phone, smsMsg);
    if (loan.member.expoPushToken) {
      await sendExpoPushNotification(
        loan.member.expoPushToken,
        `Loan ${action}`,
        `Your loan request of NGN ${loan.amount} was ${action.toLowerCase()}.`
      );
    }

    res.json({ message: `Loan ${action} successfully`, loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().select('-password').sort({ createdAt: -1 });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMemberKyc = async (req, res) => {
  try {
    const { memberId, kycStatus } = req.body;
    const member = await Member.findByIdAndUpdate(memberId, { kycStatus }, { new: true }).select(
      '-password'
    );
    res.json(member);
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