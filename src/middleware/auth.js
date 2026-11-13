const jwt = require('jsonwebtoken');
const Member = require('../models/Member');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.member = await Member.findById(decoded.id).select('-password');

      if (!req.member) {
        return res.status(401).json({ message: 'Member record not found' });
      }

      next();
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
        message: `Forbidden: Access restricted to [${roles.join(', ')}] roles.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };