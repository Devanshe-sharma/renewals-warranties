const jwt = require('jsonwebtoken');

// Real auth: verifies a JWT this backend issued itself (see routes/auth.js
// POST /api/auth/sso-login). Replaces the old header-trusting version,
// which let anyone become admin by just sending x-user-role: admin.
const authMiddleware = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, name: payload.name, role: payload.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
