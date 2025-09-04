const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { prisma } = require('../lib/prisma');
const assessmentService = require('../services/assessmentService');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

// GET /api/assessments - List assessments
router.get('/', async (req, res) => {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        child: {
          select: { id: true, name: true, age: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

// GET /api/assessments/questions - Get sample assessment questions
router.get('/questions', (req, res) => {
  const questions = assessmentService.getSampleQuestions();
  res.json({ questions });
});

// POST /api/assessments - Create new assessment (leveling quiz)
router.post('/', [
  body('childId')
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array')
], handleValidationErrors, async (req, res) => {
  try {
    const { childId, answers } = req.body;

    // Check if child exists
    const child = await prisma.child.findUnique({
      where: { id: childId }
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    // Calculate score and level
    const result = assessmentService.calculateScore(answers);
    
    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        childId,
        score: result.score,
        level: result.level,
        answers: answers
      }
    });

    res.status(201).json({ 
      assessment,
      message: `Assessment completed! Level: ${result.level}, Score: ${result.score}%`
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

module.exports = router;
