const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { getHrEmployees } = require('../utils/hrEmployees');

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// HR-Forms owns credentials/roles for everyone at the company (Admin, HR,
// Management, ...). This app keeps three levels — Admin and Management pass
// through as-is (both get full ticket visibility, see ticketRoutes.js),
// everything else collapses to local user.
function mapHrRoleToLocal(hrRole) {
  if (hrRole === 'Admin') return 'admin';
  if (hrRole === 'Management') return 'management';
  return 'user';
}

// Department isn't part of the login identity HR-Forms hands back — it
// only lives in the separate onboarding registry (same one the ticket CC
// picker reads). Looked up fresh at login rather than cached on the User
// doc, same as role, so a department change in HR-Forms takes effect on
// next login without a migration. Failing open to '' (not throwing) if
// HR-Forms's onboarding endpoint is down — department-gated pages then
// just fall back to role-only access rather than blocking login entirely.
async function lookupDepartment(email) {
  try {
    const employees = await getHrEmployees();
    return employees.find(e => e.email === email)?.dept || '';
  } catch {
    return '';
  }
}

function signToken(user, department) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role, department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '12h' }
  );
}

function toPublicUser(user, department) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, department };
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

  const department = await lookupDepartment(email);

  res.json({ success: true, token: signToken(user, department), user: toPublicUser(user, department) });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ success: false, error: 'Account no longer exists' });
  const department = await lookupDepartment(user.email);
  res.json({ success: true, user: toPublicUser(user, department) });
}));

module.exports = router;
