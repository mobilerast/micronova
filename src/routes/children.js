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

// GET /api/children - List all children
router.get('/', async (req, res) => {
  try {
    const children = await prisma.child.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ children });
  } catch (error) {
    console.error('Error fetching children:', error);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// GET /api/children/:id - Get child by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Child ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const child = await prisma.child.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    res.json({ child });
  } catch (error) {
    console.error('Error fetching child:', error);
    res.status(500).json({ error: 'Failed to fetch child' });
  }
});

// POST /api/children - Create new child
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be 1-100 characters'),
  body('age')
    .isInt({ min: 8, max: 13 })
    .withMessage('Age must be between 8 and 13'),
  body('language')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Language must be 2-50 characters')
], handleValidationErrors, async (req, res) => {
  try {
    const { name, age, language } = req.body;
    
    const child = await prisma.child.create({
      data: {
        name,
        age,
        language: language || 'english'
      }
    });

    res.status(201).json({ child });
  } catch (error) {
    console.error('Error creating child:', error);
    res.status(500).json({ error: 'Failed to create child' });
  }
});

module.exports = router;
