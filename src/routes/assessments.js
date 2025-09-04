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

// Helper function to determine band from score
const determineBand = (score) => {
  if (score <= 40) return 'A0';
  if (score <= 75) return 'A1';
  return 'A2';
};

// Helper function to get next question for assessment
const getNextQuestion = async (sessionId, childAge) => {
  try {
    // Get already answered questions in this session
    const answeredQuestions = await prisma.answer.findMany({
      where: { sessionId },
      select: { questionId: true }
    });
    
    const answeredQuestionIds = answeredQuestions.map(a => a.questionId);
    
    // Get count by scope to balance question types
    const scopeCounts = await prisma.answer.groupBy({
      by: ['questionId'],
      where: { sessionId },
      _count: true
    });
    
    // Count questions by scope
    const questions = await prisma.question.findMany({
      where: {
        id: { in: scopeCounts.map(s => s.questionId) }
      },
      select: { scope: true }
    });
    
    const scopeStats = questions.reduce((acc, q) => {
      acc[q.scope] = (acc[q.scope] || 0) + 1;
      return acc;
    }, {});
    
    // Determine which scope to prioritize (speaking should be max 1 in 5)
    const speakingCount = scopeStats.speaking || 0;
    const totalAnswered = answeredQuestions.length;
    const shouldAvoidSpeaking = speakingCount > 0 && totalAnswered < 5;
    
    // Get next question
    const nextQuestion = await prisma.question.findFirst({
      where: {
        id: { notIn: answeredQuestionIds },
        ageMin: { lte: childAge },
        ageMax: { gte: childAge },
        ...(shouldAvoidSpeaking ? { scope: { not: 'speaking' } } : {})
      },
      include: {
        options: {
          select: { id: true, text: true }
        }
      },
      orderBy: [
        { scope: 'asc' }, // Mix scopes
        { createdAt: 'asc' }
      ]
    });
    
    return nextQuestion;
  } catch (error) {
    console.error('Error getting next question:', error);
    return null;
  }
};

// POST /api/assessments/start - Start new assessment session
router.post('/start', [
  body('childId').isUUID().withMessage('Valid child ID required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { childId } = req.body;
    
    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id: childId }
    });
    
    if (!child) {
      return res.status(400).json({ error: 'Child not found' });
    }
    
    // Check for existing active session
    const existingSession = await prisma.assessmentSession.findFirst({
      where: {
        childId,
        status: 'ACTIVE'
      }
    });
    
    if (existingSession) {
      return res.status(400).json({ error: 'Child already has an active assessment session' });
    }
    
    // Create new assessment session
    const session = await prisma.assessmentSession.create({
      data: {
        childId,
        status: 'ACTIVE'
      }
    });
    
    res.status(201).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error starting assessment:', error);
    res.status(500).json({ error: 'Failed to start assessment' });
  }
});

// GET /api/assessments/:sessionId/next - Get next question
router.get('/:sessionId/next', [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists and is active
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        child: true
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }
    
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Assessment session is not active' });
    }
    
    // Get next question
    const question = await getNextQuestion(sessionId, session.child.age);
    
    if (!question) {
      return res.status(200).json({ question: null, message: 'No more questions available' });
    }
    
    res.json({ question });
  } catch (error) {
    console.error('Error getting next question:', error);
    res.status(500).json({ error: 'Failed to get next question' });
  }
});

// POST /api/assessments/:sessionId/answer - Submit answer
router.post('/:sessionId/answer', [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  body('questionId').isUUID().withMessage('Valid question ID required'),
  body('optionId').optional().isUUID().withMessage('Valid option ID required'),
  body('freeText').optional().isString().withMessage('Free text must be a string'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionId, optionId, freeText } = req.body;
    
    // Verify session exists and is active
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }
    
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Assessment session is not active' });
    }
    
    // Get question and correct answer
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true
      }
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Check if already answered
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        sessionId,
        questionId
      }
    });
    
    if (existingAnswer) {
      return res.status(400).json({ error: 'Question already answered' });
    }
    
    // Determine correctness
    let correct = false;
    
    if (question.scope === 'speaking') {
      // For speaking questions, we'll consider any response as correct for now
      correct = freeText && freeText.trim().length > 0;
    } else if (optionId) {
      // For MCQ questions, check if selected option is correct
      const selectedOption = question.options.find(opt => opt.id === optionId);
      correct = selectedOption ? selectedOption.isCorrect : false;
    }
    
    // Create answer record
    await prisma.answer.create({
      data: {
        sessionId,
        questionId,
        optionId: optionId || null,
        correct
      }
    });
    
    res.json({ correct });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// POST /api/assessments/:sessionId/finish - Finish assessment
router.post('/:sessionId/finish', [
  param('sessionId').isUUID().withMessage('Valid session ID required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session exists and is active
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }
    
    if (session.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Assessment session is not active' });
    }
    
    // Get all answers for this session
    const answers = await prisma.answer.findMany({
      where: { sessionId },
      include: {
        question: {
          select: { scope: true }
        }
      }
    });
    
    if (answers.length === 0) {
      return res.status(400).json({ error: 'No answers found for this session' });
    }
    
    // Calculate score (percentage of correct MCQ answers, excluding speaking)
    const mcqAnswers = answers.filter(a => a.question.scope !== 'speaking');
    const correctMcqAnswers = mcqAnswers.filter(a => a.correct);
    const score = mcqAnswers.length > 0 ? Math.round((correctMcqAnswers.length / mcqAnswers.length) * 100) : 0;
    
    // Determine band
    const band = determineBand(score);
    
    // Update session
    const updatedSession = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'FINISHED',
        score,
        finishedAt: new Date()
      }
    });
    
    res.json({ band, score });
  } catch (error) {
    console.error('Error finishing assessment:', error);
    res.status(500).json({ error: 'Failed to finish assessment' });
  }
});

// GET /api/assessments - List assessment sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.assessmentSession.findMany({
      include: {
        child: {
          select: { id: true, name: true, age: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching assessment sessions:', error);
    res.status(500).json({ error: 'Failed to fetch assessment sessions' });
  }
});

module.exports = router;
