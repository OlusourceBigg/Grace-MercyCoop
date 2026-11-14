const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'Savings',
        'Thrift',
        'ShareCapital',
        'SpecialDeposit',
        'LoanRepayment',
        'LoanDisbursement',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    reference: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ['Pending', 'Success', 'Failed'],
      default: 'Success',
    },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);