const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    amount: { type: Number, required: true },
    interestRate: { type: Number, default: 5 },
    durationMonths: { type: Number, required: true },
    monthlyRepayment: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    purpose: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Repaid'],
      default: 'Pending',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);