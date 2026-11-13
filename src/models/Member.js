const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Member', 'Executive', 'Admin'],
      default: 'Member',
    },
    kycStatus: {
      type: String,
      enum: ['Pending', 'Verified Level 1', 'Verified Level 2'],
      default: 'Verified Level 2',
    },
    shareCapital: {
      type: Number,
      default: 300000,
    },
    totalSavings: {
      type: Number,
      default: 1850000,
    },
    monthlyThrift: {
      type: Number,
      default: 50000,
    },
    specialDeposit: {
      type: Number,
      default: 150000,
    },
    nextOfKin: {
      fullName: { type: String, default: 'Mrs. Funmilayo Johnson' },
      relationship: { type: String, default: 'Spouse' },
      phone: { type: String, default: '+234 802 000 1122' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Member', memberSchema);