const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const indexRoutes = require('./routes/index');
const childrenRoutes = require('./routes/children');
const guardiansRoutes = require('./routes/guardians');
const assessmentRoutes = require('./routes/assessments');
const planRoutes = require('./routes/plans');
// const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const { requireApiKey } = require('./middleware/apiKey');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Public routes (no API key required)
app.use('/', indexRoutes);

// Protected routes (API key required)
app.use('/api/guardians', guardiansRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/assessments', assessmentRoutes);
// app.use('/api/plans', requireApiKey, planRoutes);
// app.use('/api/admin', adminRoutes); // Admin routes have their own API key middleware

// Catch-all for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling
app.use(errorHandler);

module.exports = app;
