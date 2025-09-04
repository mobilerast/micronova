const express = require('express');
const { body, param, validationResult } = require('express-validator');
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

// GET /api/assessments/:id - Get assessment by ID
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Assessment ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json({ assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: 'Failed to fetch assessment' });
  }
});

// POST /api/assessments - Create new assessment (leveling quiz)
router.post('/', [
  body('childId')
    .isInt({ min: 1 })
    .withMessage('Child ID must be a positive integer'),
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers must be a non-empty array'),
  body('answers.*.questionId')
    .isInt({ min: 1 })
    .withMessage('Question ID must be a positive integer'),
  body('answers.*.selectedAnswer')
    .notEmpty()
    .withMessage('Selected answer is required'),
  body('answers.*.correctAnswer')
    .notEmpty()
    .withMessage('Correct answer is required'),
  body('answers.*.isCorrect')
    .isBoolean()
    .withMessage('isCorrect must be boolean')
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

    // Calculate score
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const score = Math.round((correctAnswers / answers.length) * 100);

    // Determine level
    const level = PlanGenerator.determineLevel(score);

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        childId,
        score,
        level,
        answers: answers
      },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        }
      }
    });

    // Update child's level
    await prisma.child.update({
      where: { id: childId },
      data: { level }
    });

    res.status(201).json({ 
      assessment,
      message: `Assessment completed! Level: ${level}, Score: ${score}%`
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
});

// GET /api/assessments/child/:childId - Get assessments for specific child
router.get('/child/:childId', [
  param('childId').isInt({ min: 1 }).withMessage('Child ID must be a positive integer')
], handleValidationErrors, async (req, res) => {
  try {
    const childId = parseInt(req.params.childId);

    const assessments = await prisma.assessment.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
      include: {
        child: {
          select: { id: true, name: true, age: true }
        }
      }
    });

    res.json({ assessments });
  } catch (error) {
    console.error('Error fetching child assessments:', error);
    res.status(500).json({ error: 'Failed to fetch child assessments' });
  }
});

// Sample assessment questions endpoint
router.get('/sample/questions', (req, res) => {
  const sampleQuestions = [
    {
      id: 1,
      question: "What color is the sun?",
      options: ["Blue", "Yellow", "Green", "Purple"],
      correctAnswer: "Yellow",
      difficulty: "A0"
    },
    {
      id: 2,
      question: "Which animal says 'meow'?",
      options: ["Dog", "Cat", "Bird", "Fish"],
      correctAnswer: "Cat",
      difficulty: "A0"
    },
    {
      id: 3,
      question: "How many days are in a week?",
      options: ["5", "6", "7", "8"],
      correctAnswer: "7",
      difficulty: "A1"
    },
    {
      id: 4,
      question: "What do we use to write on paper?",
      options: ["Spoon", "Pencil", "Plate", "Shoe"],
      correctAnswer: "Pencil",
      difficulty: "A0"
    },
    {
      id: 5,
      question: "Which season comes after winter?",
      options: ["Summer", "Fall", "Spring", "Winter"],
      correctAnswer: "Spring",
      difficulty: "A1"
    },
    {
      id: 6,
      question: "What do bees make?",
      options: ["Milk", "Honey", "Cheese", "Bread"],
      correctAnswer: "Honey",
      difficulty: "A1"
    },
    {
      id: 7,
      question: "How many legs does a spider have?",
      options: ["6", "8", "10", "4"],
      correctAnswer: "8",
      difficulty: "A2-kids"
    },
    {
      id: 8,
      question: "What planet do we live on?",
      options: ["Mars", "Venus", "Earth", "Jupiter"],
      correctAnswer: "Earth",
      difficulty: "A2-kids"
    }
  ];

  res.json({ questions: sampleQuestions });
});

module.exports = router;
