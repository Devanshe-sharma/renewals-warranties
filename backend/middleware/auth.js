// Middleware to get user from headers (in production, use JWT tokens)
const authMiddleware = (req, res, next) => {
  // Get user info from headers (client sends this)
  const userId = req.headers['x-user-id'];
  const userName = req.headers['x-user-name'];
  const userRole = req.headers['x-user-role'];

  if (!userId || !userName || !userRole) {
    return res.status(401).json({ error: 'Missing user info' });
  }

  req.user = { id: userId, name: userName, role: userRole };
  next();
};

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly };
