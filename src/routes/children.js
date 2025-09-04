const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../lib/prisma');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// POST /api/children - Register a new child
router.post('/', [
  body('guardianId').isInt().withMessage('Guardian ID must be a valid integer'),
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('age').isInt({ min: 5, max: 18 }).withMessage('Age must be between 5 and 18'),
  body('nativeLanguage').trim().notEmpty().withMessage('Native language is required').isLength({ min: 2, max: 30 }).withMessage('Native language must be between 2 and 30 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { guardianId, name, age, nativeLanguage } = req.body;

    // Check if guardian exists
    const guardian = await prisma.guardian.findUnique({
      where: { id: guardianId }
    });

    if (!guardian) {
      return res.status(404).json({ error: 'Guardian not found' });
    }

    // Create new child
    const child = await prisma.child.create({
      data: {
        guardianId,
        name,
        age,
        nativeLanguage
      }
    });

    res.status(201).json({
      message: 'Child registered successfully',
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        nativeLanguage: child.nativeLanguage,
        guardianId: child.guardianId,
        createdAt: child.createdAt
      }
    });
  } catch (error) {
    console.error('Error registering child:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;
