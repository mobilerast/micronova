const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    app: process.env.APP_NAME || 'Micronova',
    timestamp: new Date().toISOString() 
  });
});

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Micronova API',
    version: '1.0.0',
    endpoints: {
      children: '/api/children',
      guardians: '/api/guardians',
      assessments: '/api/assessments',
      plans: '/api/plans'
    },
    docs: '/docs/QUICKSTART.md'
  });
});

// 404 Handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = router;
