const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'grace_mercy_default_secret_2026'
      );
      req.member = await Member.findById(decoded.id).select('-password');

      if (!req.member) {
        return res.status(401).json({ message: 'User not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.member || !roles.includes(req.member.role)) {
      return res.status(403).json({
        message: `Forbidden: role '${req.member ? req.member.role : 'None'}' does not have access`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };