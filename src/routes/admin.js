const express = require('express');
const { requireApiKey } = require('../middleware/apiKey');
const { seedDatabase } = require('../scripts/seed');

const router = express.Router();

// POST /api/admin/seed - Seed database (API key required)
router.post('/seed', requireApiKey, async (req, res) => {
  try {
    console.log('🔧 Admin seed request received');
    await seedDatabase();
    res.json({ 
      message: 'Database seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in admin seed:', error);
    res.status(500).json({ 
      error: 'Failed to seed database',
      details: error.message
    });
  }
});

module.exports = router;
