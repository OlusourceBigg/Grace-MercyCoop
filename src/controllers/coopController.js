const Member = require('../models/Member');
const Transaction = require('../models/Transaction');
const { sendSMS } = require('../services/notificationService');

// @desc    Get dashboard balances and equity summary
// @route   GET /api/coop/summary
const getSummary = async (req, res) => {
  try {
    const member = await Member.findById(req.member._id);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    res.json({
      fullName: member.fullName,
      memberId: member.memberId,
      kycStatus: member.kycStatus,
      totalSavings: member.totalSavings,
      monthlyThrift: member.monthlyThrift,
      shareCapital: member.shareCapital,
      specialDeposit: member.specialDeposit,
      maxBorrowingLimit: member.totalSavings * 2,
      nextOfKin: member.nextOfKin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record savings or thrift deposit & dispatch credit alert
// @route   POST /api/coop/deposit
const recordDeposit = async (req, res) => {
  try {
    const { amount, category } = req.body;
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    const member = await Member.findById(req.member._id);

    if (category === 'Share Capital') {
      member.shareCapital += numAmount;
    } else if (category === 'Special Savings') {
      member.specialDeposit += numAmount;
    } else {
      member.totalSavings += numAmount;
    }

    await member.save();

    const transactionId = 'TXN-' + Math.floor(1000 + Math.random() * 9000);
    const transaction = await Transaction.create({
      transactionId,
      memberId: member.memberId,
      title: category + ' Deposit',
      category: category === 'Share Capital' ? 'Share Capital' : 'Savings',
      amount: numAmount,
      type: 'credit',
      status: 'Approved',
    });

    // Send Credit Alert SMS
    const smsMessage = `Credit Alert! Your Grace & Mercy account ${member.memberId} has been credited with NGN ${numAmount.toLocaleString()} for ${category}. Total Thrift: NGN ${member.totalSavings.toLocaleString()}. Ref: ${transactionId}`;
    sendSMS(member.phone, smsMessage);

    res.status(201).json({
      message: 'Deposit recorded successfully',
      updatedBalances: {
        totalSavings: member.totalSavings,
        shareCapital: member.shareCapital,
        specialDeposit: member.specialDeposit,
      },
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get member account statement / transactions
// @route   GET /api/coop/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ memberId: req.member.memberId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary, recordDeposit, getTransactions };