const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../lib/prisma');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// GET /api/guardians - List all guardians
router.get('/', async (req, res) => {
  try {
    const guardians = await prisma.guardian.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ guardians });
  } catch (error) {
    console.error('Error fetching guardians:', error);
    res.status(500).json({ error: 'Failed to fetch guardians' });
  }
});

// POST /api/guardians - Create new guardian
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Check if email already exists
    const existingGuardian = await prisma.guardian.findUnique({
      where: { email }
    });
    
    if (existingGuardian) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const guardian = await prisma.guardian.create({
      data: { name, email, phone: phone || null }
    });
    
    res.status(201).json({ guardian });
  } catch (error) {
    console.error('Error creating guardian:', error);
    res.status(500).json({ error: 'Failed to create guardian' });
  }
});

module.exports = router;

// GET /api/guardians/:id - Get guardian by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Guardian ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const guardian = await prisma.guardian.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!guardian) {
      return res.status(404).json({ error: 'Guardian not found' });
    }

    res.json({ guardian });
  } catch (error) {
    console.error('Error fetching guardian:', error);
    res.status(500).json({ error: 'Failed to fetch guardian' });
  }
});

module.exports = router;
