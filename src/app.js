const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const indexRoutes = require('./routes/index');
const childrenRoutes = require('./routes/children');
const guardiansRoutes = require('./routes/guardians');
const assessmentRoutes = require('./routes/assessments');
const planRoutes = require('./routes/plans');
const errorHandler = require('./middleware/errorHandler');
const { requireApiKey } = require('./middleware/apiKey');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', indexRoutes);
app.use('/api/children', requireApiKey, childrenRoutes);
app.use('/api/guardians', requireApiKey, guardiansRoutes);
app.use('/api/assessments', requireApiKey, assessmentRoutes);
app.use('/api/plans', requireApiKey, planRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
