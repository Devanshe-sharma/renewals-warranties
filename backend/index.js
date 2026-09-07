require('dotenv').config();
require("./cron/renewalReminderCron");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const employeeRoutes = require('./routes/employeeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const renewalRoutes = require('./routes/newrenewalRoutes');
const updaterenewalRoute = require('./routes/updaterenewalRoute');
const statusRulesRoutes = require('./routes/statusRulesRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const authRoutes = require('./routes/authRoutes');
const { authMiddleware } = require('./middleware/auth');

const app = express();

const UPLOAD_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// Public: SSO login (exchanges a one-time code from HR-Forms for a local
// session) — has no session of its own yet, so it can't sit behind authMiddleware.
app.use('/api/auth', authRoutes);

// Everything else requires a real, verified login from here on — previously
// these routes had no auth check at all beyond the client-trusted headers
// on /api/tickets, which anyone could spoof.
app.use('/api/employee', authMiddleware, employeeRoutes);
app.use('/api/categories', authMiddleware, categoryRoutes);
app.use('/api/renewals', authMiddleware, renewalRoutes);
app.use('/api/renewal-events', authMiddleware, updaterenewalRoute);
app.use('/api/status-rules', authMiddleware, statusRulesRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/uploads', authMiddleware, uploadRoutes);
// app.use("/api/test", require("./routes/testMail"));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => res.send('Renewals API running'));



const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
