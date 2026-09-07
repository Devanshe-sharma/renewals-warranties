const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// HR-Forms owns credentials/roles for everyone at the company (Admin, HR,
// Management, ...). This app only has two levels — map anything HR-Forms
// calls "Admin" to local admin, everyone else to local user.
function mapHrRoleToLocal(hrRole) {
  return hrRole === 'Admin' ? 'admin' : 'user';
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

function toPublicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

// POST /api/auth/sso-login
// Called by this app's own frontend (the /sso-callback page) with the
// one-time code HR-Forms handed back after redirecting here. Exchanges it
// server-to-server for the verified identity, then issues our own local
// session — this app never sees the user's password or HR-Forms's JWT.
router.post('/sso-login', asyncHandler(async (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ success: false, error: 'code is required' });
  }

  const exchangeUrl = process.env.HR_SSO_EXCHANGE_URL;
  const exchangeRes = await fetch(exchangeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-key': process.env.SSO_SERVICE_KEY,
    },
    body: JSON.stringify({ code }),
  });

  if (!exchangeRes.ok) {
    return res.status(401).json({ success: false, error: 'Single sign-on failed — please try logging in again' });
  }

  const { user: identity } = await exchangeRes.json();
  const email = String(identity.email).trim().toLowerCase();

  const user = await User.findOneAndUpdate(
    { email },
    { email, name: identity.name, role: mapHrRoleToLocal(identity.role) },
    { new: true, upsert: true }
  );

  res.json({ success: true, token: signToken(user), user: toPublicUser(user) });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ success: false, error: 'Account no longer exists' });
  res.json({ success: true, user: toPublicUser(user) });
}));

module.exports = router;
