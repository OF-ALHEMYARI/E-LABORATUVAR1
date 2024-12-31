const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const sql = 'SELECT id, username, role FROM users WHERE id = ?';
    const users = await query(sql, [decoded.id]);
    const user = users[0];

    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorizeAdmin
};
