const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mahathi_secret_key_12345!@#$';

function generateToken(user, isAdmin = false) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: isAdmin ? (user.role || 'admin') : 'user'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalid or expired' });
    }
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
    return res.status(403).json({ message: 'Admin permissions required' });
  }
  next();
}

// Temporary storage for OTP verification
const otpCache = new Map();

function sendMockOTP(phoneOrEmail) {
  // Generate a random 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache.set(phoneOrEmail, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiration
  });
  
  // Log it to console so we can see it in terminal, and return it in API during dev (for ease of use)
  console.log(`[MOCK OTP] Sent code ${code} to ${phoneOrEmail}`);
  return code;
}

function verifyOTP(phoneOrEmail, code) {
  const cached = otpCache.get(phoneOrEmail);
  if (!cached) return false;
  if (Date.now() > cached.expiresAt) {
    otpCache.delete(phoneOrEmail);
    return false;
  }
  if (cached.code === code) {
    otpCache.delete(phoneOrEmail);
    return true;
  }
  return false;
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin,
  sendMockOTP,
  verifyOTP
};
