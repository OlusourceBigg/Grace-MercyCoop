const Member = require('../models/Member');
const jwt = require('jsonwebtoken');
const { sendTermiiSMS } = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'grace_mercy_default_secret_2026', {
    expiresIn: '30d',
  });
};

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const memberExists = await Member.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }],
    });

    if (memberExists) {
      return res.status(400).json({ message: 'Member with this email or phone already exists' });
    }

    const memberCount = await Member.countDocuments();
    const memberId = `GM-2026-${String(memberCount + 101).padStart(3, '0')}`;

    const member = await Member.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      password,
      memberId,
      role: 'Member',
    });

    // Send SMS Notification
    await sendTermiiSMS(
      phone,
      `Welcome to Grace & Mercy Coop, ${fullName}! Your Member ID is ${memberId}.`
    );

    res.status(201).json({
      _id: member._id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      memberId: member.memberId,
      role: member.role,
      token: generateToken(member._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const member = await Member.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { memberId: identifier.toUpperCase() },
        { phone: identifier },
      ],
    });

    if (member && (await member.matchPassword(password))) {
      res.json({
        _id: member._id,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        memberId: member.memberId,
        role: member.role,
        kycStatus: member.kycStatus,
        token: generateToken(member._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const member = await Member.findById(req.member._id).select('-password');
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  registerMember: register,
  loginMember: login,
};