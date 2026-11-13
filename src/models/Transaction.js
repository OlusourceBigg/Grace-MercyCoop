const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    memberId: {
      type: String,
      required: true,
      ref: 'Member',
    },
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Savings', 'Loan', 'Share Capital', 'Special Savings', 'Dividend'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Approved',
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);