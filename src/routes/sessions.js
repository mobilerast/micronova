const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { prisma } = require('../utils/db');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// GET /api/sessions - List learning sessions
router.get('/', [
  query('childId').optional().isInt({ min: 1 }).withMessage('Child ID must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res) => {
  try {
    const { childId, limit = 20 } = req.query;
    
    const where = childId ? { childId: parseInt(childId) } : {};

    const sessions = await prisma.learningSession.findMany({
      where,
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        planDay: {
          select: { 
            id: true, 
            dayNumber: true,
            plan: {
              select: { id: true, level: true }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/sessions/:id - Get session by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Session ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const session = await prisma.learningSession.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        planDay: {
          include: {
            plan: {
              select: { id: true, level: true }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/sessions - Create new learning session
router.post('/', [
  body('childId')
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer'),
  body('planDayId')
    .isInt({ min: 1 })
    .withMessage('Plan day ID must be a positive integer'),
  body('vocabAnswer')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Vocab answer must be max 200 characters'),
  body('readingAnswer')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reading answer must be max 200 characters'),
  body('speakingAnswer')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Speaking answer must be max 5000 characters'),
  body('vocabCorrect')
    .optional()
    .isBoolean()
    .withMessage('Vocab correct must be boolean'),
  body('readingCorrect')
    .optional()
    .isBoolean()
    .withMessage('Reading correct must be boolean'),
  body('totalTimeMs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total time must be non-negative integer')
], handleValidationErrors, async (req, res) => {
  try {
    const {
      childId,
      planDayId,
      vocabAnswer,
      readingAnswer,
      speakingAnswer,
      vocabCorrect,
      readingCorrect,
      totalTimeMs
    } = req.body;

    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id: childId }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Verify plan day exists and belongs to an active plan for this child
    const planDay = await prisma.learningPlanDay.findUnique({
      where: { id: planDayId },
      include: {
        plan: {
          select: { childId: true, isActive: true }
        }
      }
    });

    if (!planDay) {
      return res.status(404).json({ error: 'Plan day not found' });
    }

    if (planDay.plan.childId !== childId) {
      return res.status(403).json({ error: 'Plan day does not belong to this child' });
    }

    if (!planDay.plan.isActive) {
      return res.status(400).json({ error: 'Cannot create session for inactive plan' });
    }

    // Create session
    const session = await prisma.learningSession.create({
      data: {
        childId,
        planDayId,
        vocabAnswer,
        readingAnswer,
        speakingAnswer,
        vocabCorrect,
        readingCorrect,
        totalTimeMs
      },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        planDay: {
          select: {
            id: true,
            dayNumber: true,
            plan: {
              select: { id: true, level: true }
            }
          }
        }
      }
    });

    res.status(201).json({ session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/sessions/child/:childId - Get sessions for specific child
router.get('/child/:childId', [
  param('childId').isInt({ min: 1 }).withMessage('Child ID must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res) => {
  try {
    const childId = parseInt(req.params.childId);
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const sessions = await prisma.learningSession.findMany({
      where: { childId },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        planDay: {
          select: {
            id: true,
            dayNumber: true,
            plan: {
              select: { id: true, level: true }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: limit
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching child sessions:', error);
    res.status(500).json({ error: 'Failed to fetch child sessions' });
  }
});

// GET /api/sessions/child/:childId/stats - Get session statistics for child
router.get('/child/:childId/stats', [
  param('childId').isInt({ min: 1 }).withMessage('Child ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const childId = parseInt(req.params.childId);

    // Get all sessions for child
    const sessions = await prisma.learningSession.findMany({
      where: { childId },
      include: {
        planDay: {
          select: {
            dayNumber: true,
            plan: {
              select: { level: true }
            }
          }
        }
      }
    });

    if (sessions.length === 0) {
      return res.json({
        stats: {
          totalSessions: 0,
          uniqueDaysCompleted: 0,
          vocabAccuracy: 0,
          readingAccuracy: 0,
          averageSessionTime: 0,
          streak: 0
        }
      });
    }

    // Calculate statistics
    const totalSessions = sessions.length;
    const uniqueDaysCompleted = new Set(sessions.map(s => s.planDay.dayNumber)).size;
    
    const vocabSessions = sessions.filter(s => s.vocabCorrect !== null);
    const vocabAccuracy = vocabSessions.length > 0 
      ? Math.round((vocabSessions.filter(s => s.vocabCorrect).length / vocabSessions.length) * 100)
      : 0;

    const readingSessions = sessions.filter(s => s.readingCorrect !== null);
    const readingAccuracy = readingSessions.length > 0
      ? Math.round((readingSessions.filter(s => s.readingCorrect).length / readingSessions.length) * 100)
      : 0;

    const timedSessions = sessions.filter(s => s.totalTimeMs !== null);
    const averageSessionTime = timedSessions.length > 0
      ? Math.round(timedSessions.reduce((sum, s) => sum + s.totalTimeMs, 0) / timedSessions.length / 1000) // Convert to seconds
      : 0;

    // Calculate current streak (consecutive days with sessions)
    const sessionDates = sessions
      .map(s => s.completedAt.toDateString())
      .filter((date, index, arr) => arr.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (sessionDates.includes(today) || sessionDates.includes(yesterday)) {
      let currentDate = sessionDates.includes(today) ? new Date() : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      for (const sessionDate of sessionDates) {
        if (sessionDate === currentDate.toDateString()) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const stats = {
      totalSessions,
      uniqueDaysCompleted,
      vocabAccuracy,
      readingAccuracy,
      averageSessionTime,
      streak
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching child session stats:', error);
    res.status(500).json({ error: 'Failed to fetch child session stats' });
  }
});

// PUT /api/sessions/:id - Update session
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Session ID must be a positive integer'),
  body('vocabAnswer')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Vocab answer must be max 200 characters'),
  body('readingAnswer')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reading answer must be max 200 characters'),
  body('speakingAnswer')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Speaking answer must be max 5000 characters'),
  body('vocabCorrect')
    .optional()
    .isBoolean()
    .withMessage('Vocab correct must be boolean'),
  body('readingCorrect')
    .optional()
    .isBoolean()
    .withMessage('Reading correct must be boolean'),
  body('totalTimeMs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total time must be non-negative integer')
], handleValidationErrors, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const updates = req.body;

    const session = await prisma.learningSession.update({
      where: { id: sessionId },
      data: updates,
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        planDay: {
          select: {
            id: true,
            dayNumber: true,
            plan: {
              select: { id: true, level: true }
            }
          }
        }
      }
    });

    res.json({ session });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Session ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);

    await prisma.learningSession.delete({
      where: { id: sessionId }
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
