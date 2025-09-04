const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../lib/prisma');
const planService = require('../services/planService');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// GET /api/plans - List all learning plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.learningPlan.findMany({
      include: {
        child: {
          select: { id: true, name: true, age: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

// POST /api/plans - Create new learning plan
router.post('/', [
  body('childId')
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer'),
  body('level')
    .isIn(['A0', 'A1', 'A2-kids'])
    .withMessage('Level must be A0, A1, or A2-kids')
], handleValidationErrors, async (req, res) => {
  try {
    const { childId, level } = req.body;

    // Check if child exists
    const child = await prisma.child.findUnique({
      where: { id: childId }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Generate plan
    const plan = await planService.createPlan(childId, level);

    res.status(201).json({ 
      plan,
      message: `60-day learning plan created!`
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// GET /api/plans/:id/day/:dayNumber - Get specific day from plan
router.get('/:id/day/:dayNumber', [
  param('id').isInt({ min: 1 }).withMessage('Plan ID must be a positive integer'),
  param('dayNumber').isInt({ min: 1, max: 60 }).withMessage('Day number must be between 1 and 60')
], handleValidationErrors, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    const dayNumber = parseInt(req.params.dayNumber);

    const planDay = await prisma.learningPlanDay.findUnique({
      where: {
        planId_dayNumber: {
          planId,
          dayNumber
        }
      },
      include: {
        plan: {
          include: {
            child: {
              select: { id: true, name: true, age: true }
            }
          }
        }
      }
    });

    if (!planDay) {
      return res.status(404).json({ error: 'Plan day not found' });
    }

    res.json({ planDay });
  } catch (error) {
    console.error('Error fetching plan day:', error);
    res.status(500).json({ error: 'Failed to fetch plan day' });
  }
});

module.exports = router;
