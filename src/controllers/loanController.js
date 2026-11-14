const Loan = require('../models/Loan');
const Member = require('../models/Member');

const checkEligibility = async (req, res) => {
  try {
    const member = await Member.findById(req.member._id);
    const maxLoan = member.totalSavings * 2;
    res.json({
      totalSavings: member.totalSavings,
      maxLoanAmount: maxLoan,
      eligible: member.totalSavings > 10000,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const applyLoan = async (req, res) => {
  try {
    const { amount, durationMonths, purpose } = req.body;
    const member = await Member.findById(req.member._id);

    const maxEligible = member.totalSavings * 2;
    if (amount > maxEligible && maxEligible > 0) {
      return res.status(400).json({
        message: `Requested amount exceeds eligible limit of NGN ${maxEligible}`,
      });
    }

    const interestRate = 5;
    const interest = (amount * (interestRate / 100) * durationMonths) / 12;
    const totalRepayment = Number(amount) + interest;
    const monthlyRepayment = totalRepayment / durationMonths;

    const loan = await Loan.create({
      member: member._id,
      amount,
      interestRate,
      durationMonths,
      monthlyRepayment,
      totalRepayment,
      purpose,
      status: 'Pending',
    });

    res.status(201).json(loan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMemberLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ member: req.member._id }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkEligibility, applyLoan, getMemberLoans };