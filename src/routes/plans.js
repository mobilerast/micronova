const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { prisma } = require('../utils/db');
const { PlanGenerator } = require('../services/planGenerator');

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
        },
        _count: {
          select: { days: true }
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

// GET /api/plans/:id - Get plan by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Plan ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const plan = await prisma.learningPlan.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        days: {
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
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

    // Deactivate existing plans for this child
    await prisma.learningPlan.updateMany({
      where: { childId, isActive: true },
      data: { isActive: false }
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 60);

    // Generate plan days
    const planDays = PlanGenerator.generatePlan(level);

    // Create plan with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the plan
      const plan = await tx.learningPlan.create({
        data: {
          childId,
          level,
          startDate,
          endDate,
          isActive: true
        }
      });

      // Create plan days
      const days = await tx.learningPlanDay.createMany({
        data: planDays.map(day => ({
          planId: plan.id,
          dayNumber: day.dayNumber,
          vocabTask: day.vocabTask,
          readingTask: day.readingTask,
          speakingPrompt: day.speakingPrompt
        }))
      });

      return { plan, daysCreated: days.count };
    });

    res.status(201).json({ 
      plan: result.plan,
      message: `60-day learning plan created with ${result.daysCreated} days!`
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// GET /api/plans/child/:childId - Get plans for specific child
router.get('/child/:childId', [
  param('childId').isInt({ min: 1 }).withMessage('Child ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const childId = parseInt(req.params.childId);

    const plans = await prisma.learningPlan.findMany({
      where: { childId },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        _count: {
          select: { days: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ plans });
  } catch (error) {
    console.error('Error fetching child plans:', error);
    res.status(500).json({ error: 'Failed to fetch child plans' });
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
        },
        sessions: {
          orderBy: { completedAt: 'desc' },
          take: 1 // Most recent session for this day
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

// GET /api/plans/:id/progress - Get plan progress
router.get('/:id/progress', [
  param('id').isInt({ min: 1 }).withMessage('Plan ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);

    const plan = await prisma.learningPlan.findUnique({
      where: { id: planId },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        days: {
          include: {
            sessions: {
              select: {
                id: true,
                completedAt: true,
                vocabCorrect: true,
                readingCorrect: true
              }
            }
          }
        }
      }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Calculate progress statistics
    const totalDays = plan.days.length;
    const completedDays = plan.days.filter(day => day.sessions.length > 0).length;
    const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

    // Calculate accuracy statistics
    const allSessions = plan.days.flatMap(day => day.sessions);
    const vocabAccuracy = allSessions.length > 0 
      ? Math.round((allSessions.filter(s => s.vocabCorrect).length / allSessions.length) * 100)
      : 0;
    const readingAccuracy = allSessions.length > 0
      ? Math.round((allSessions.filter(s => s.readingCorrect).length / allSessions.length) * 100)
      : 0;

    const progress = {
      plan: {
        id: plan.id,
        level: plan.level,
        startDate: plan.startDate,
        endDate: plan.endDate,
        isActive: plan.isActive
      },
      child: plan.child,
      stats: {
        totalDays,
        completedDays,
        progressPercentage,
        vocabAccuracy,
        readingAccuracy,
        totalSessions: allSessions.length
      }
    };

    res.json({ progress });
  } catch (error) {
    console.error('Error fetching plan progress:', error);
    res.status(500).json({ error: 'Failed to fetch plan progress' });
  }
});

// DELETE /api/plans/:id - Delete plan (admin only)
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Plan ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const planId = parseInt(req.params.id);

    await prisma.learningPlan.delete({
      where: { id: planId }
    });

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Plan not found' });
    }
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;
