const Member = require('../models/Member');
const Transaction = require('../models/Transaction');

const getSummary = async (req, res) => {
  try {
    const member = await Member.findById(req.member._id).select('-password');
    res.json({
      totalSavings: member.totalSavings,
      monthlyThrift: member.monthlyThrift,
      shareCapital: member.shareCapital,
      specialDeposit: member.specialDeposit,
      kycStatus: member.kycStatus,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const recordDeposit = async (req, res) => {
  try {
    const { type, amount, reference } = req.body;
    if (!type || !amount || !reference) {
      return res.status(400).json({ message: 'Type, amount, and reference are required' });
    }

    const validTypes = ['Savings', 'Thrift', 'ShareCapital', 'SpecialDeposit'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid deposit type' });
    }

    const transaction = await Transaction.create({
      member: req.member._id,
      type,
      amount: Number(amount),
      reference,
      status: 'Success',
      description: `Deposit to ${type}`,
    });

    const fieldMap = {
      Savings: 'totalSavings',
      Thrift: 'monthlyThrift',
      ShareCapital: 'shareCapital',
      SpecialDeposit: 'specialDeposit',
    };

    await Member.findByIdAndUpdate(req.member._id, {
      $inc: { [fieldMap[type]]: Number(amount) },
    });

    res.status(201).json({ message: 'Deposit recorded successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ member: req.member._id }).sort({
      createdAt: -1,
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary, recordDeposit, getTransactions };