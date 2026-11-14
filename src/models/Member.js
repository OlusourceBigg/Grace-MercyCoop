const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['Member', 'Executive', 'Admin'],
      default: 'Member',
    },
    kycStatus: {
      type: String,
      enum: ['Pending', 'Verified Level 1', 'Verified Level 2'],
      default: 'Pending',
    },
    totalSavings: { type: Number, default: 0 },
    monthlyThrift: { type: Number, default: 0 },
    shareCapital: { type: Number, default: 0 },
    specialDeposit: { type: Number, default: 0 },
    expoPushToken: { type: String, default: null },
  },
  { timestamps: true }
);

memberSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

memberSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Member', memberSchema);