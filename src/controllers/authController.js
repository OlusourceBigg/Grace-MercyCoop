const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new member
// @route   POST /api/auth/register
const registerMember = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const memberExists = await Member.findOne({ $or: [{ email }, { phone }] });
    if (memberExists) {
      return res.status(400).json({ message: 'Member with this email or phone already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate Member ID (e.g., GM-2026-482)
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const memberId = 'GM-2026-' + randomSuffix;

    const member = await Member.create({
      memberId,
      fullName,
      email,
      phone,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: member._id,
      memberId: member.memberId,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      token: generateToken(member._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate member & get token
// @route   POST /api/auth/login
const loginMember = async (req, res) => {
  try {
    const { identifier, password } = req.body; // Can be email or phone

    const member = await Member.findOne({
      $or: [{ email: identifier }, { phone: identifier }, { memberId: identifier }],
    });

    if (member && (await bcrypt.compare(password, member.password))) {
      res.json({
        _id: member._id,
        memberId: member.memberId,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        role: member.role,
        kycStatus: member.kycStatus,
        token: generateToken(member._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials or Member ID' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current member profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.member);
};

module.exports = { registerMember, loginMember, getMe };