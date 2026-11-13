const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
      unique: true,
    },
    memberId: {
      type: String,
      required: true,
      ref: 'Member',
    },
    type: {
      type: String,
      required: true,
    },
    principal: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    tenorMonths: {
      type: Number,
      required: true,
    },
    monthlyDeduction: {
      type: Number,
      required: true,
    },
    guarantors: [
      {
        fullName: String,
        memberId: String,
        status: { type: String, default: 'Pending' },
      },
    ],
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Active', 'Completed', 'Defaulted'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', loanSchema);