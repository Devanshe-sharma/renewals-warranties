require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const employeeRoutes = require('./routes/employeeRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const renewalRoutes = require('./routes/newrenewalRoutes');
const updaterenewalRoute = require('./routes/updaterenewalRoute');
const statusRulesRoutes = require('./routes/statusRulesRoutes');

const app = express();


app.use(cors());
app.use(express.json());


app.use('/api/employee', employeeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/renewals', renewalRoutes);
app.use('/api/renewal-events', updaterenewalRoute);
app.use('/api/status-rules', statusRulesRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.get('/', (req, res) => res.send('Renewals API running'));



const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
