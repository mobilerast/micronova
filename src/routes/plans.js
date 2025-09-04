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

// Helper function to generate plan tasks based on band and day
const generateDayTasks = (band, dayIndex) => {
  const weekNumber = Math.ceil(dayIndex / 7);
  const difficulty = Math.min(weekNumber, 8); // Cap at week 8 difficulty
  
  const taskTemplates = {
    A0: {
      vocab: [
        `Learn 3 new words about colors and shapes`,
        `Practice naming family members`,
        `Learn numbers 1-10 with fun activities`,
        `Identify common animals and their sounds`,
        `Practice basic greetings and polite words`
      ],
      reading: [
        `Read a simple 2-sentence story about animals`,
        `Look at pictures and name what you see`,
        `Read simple words: cat, dog, sun, tree`,
        `Match pictures to words`,
        `Read a short story about family`
      ],
      speaking: [
        `Say your name and age clearly`,
        `Tell me your favorite color`,
        `Count from 1 to 5 out loud`,
        `Name three animals you like`,
        `Say "hello" and "goodbye" nicely`
      ],
      listening: [
        `Listen to a short song about colors`,
        `Follow simple directions: "Touch your nose"`,
        `Listen and point to the right picture`,
        `Hear a story and answer: "What animal was it?"`,
        `Listen to numbers and clap the right amount`
      ]
    },
    A1: {
      vocab: [
        `Learn 5 new words about school and home`,
        `Practice days of the week and months`,
        `Learn action words: run, jump, swim, read`,
        `Study weather words: sunny, rainy, cold`,
        `Practice food names and "I like/don't like"`
      ],
      reading: [
        `Read a 4-sentence story about daily life`,
        `Read simple descriptions of people`,
        `Practice reading questions and answers`,
        `Read about different seasons`,
        `Read simple instructions for games`
      ],
      speaking: [
        `Describe what you did yesterday`,
        `Talk about your favorite food`,
        `Explain a simple daily routine`,
        `Describe the weather today`,
        `Tell a friend about your hobby`
      ],
      listening: [
        `Listen to directions for a simple game`,
        `Hear a story and answer 2 questions`,
        `Listen to someone describe their day`,
        `Follow multi-step instructions`,
        `Listen and identify different emotions in speech`
      ]
    },
    A2: {
      vocab: [
        `Learn 7 new words about feelings and emotions`,
        `Practice talking about future plans`,
        `Study comparative words: bigger, smaller, better`,
        `Learn words about different jobs and careers`,
        `Practice expressions for giving opinions`
      ],
      reading: [
        `Read a 6-sentence story about adventure`,
        `Read and understand simple news for kids`,
        `Practice reading different text types: letters, lists`,
        `Read descriptions of places and people`,
        `Read simple instructions for crafts or recipes`
      ],
      speaking: [
        `Explain why you like or dislike something`,
        `Describe a place you want to visit`,
        `Talk about what you want to be when you grow up`,
        `Give simple directions to a friend`,
        `Describe a problem and suggest a solution`
      ],
      listening: [
        `Listen to a longer story and summarize it`,
        `Hear different people talking and identify who said what`,
        `Listen to simple debates and pick a side`,
        `Follow complex instructions with multiple steps`,
        `Listen to descriptions and draw what you hear`
      ]
    }
  };
  
  const templates = taskTemplates[band] || taskTemplates.A1;
  const scopes = ['vocab', 'reading', 'speaking', 'listening'];
  
  const tasks = {};
  scopes.forEach(scope => {
    const scopeTemplates = templates[scope];
    const baseTaskIndex = (dayIndex - 1) % scopeTemplates.length;
    let task = scopeTemplates[baseTaskIndex];
    
    // Add difficulty variations based on week
    if (difficulty > 3) {
      task += ` (Week ${weekNumber}: try to be more detailed!)`;
    }
    
    tasks[`${scope}Task`] = {
      title: `${scope.charAt(0).toUpperCase() + scope.slice(1)} Practice`,
      content: task,
      estimatedMinutes: scope === 'speaking' ? 3 : scope === 'listening' ? 4 : 5
    };
  });
  
  return tasks;
};

// POST /api/plans/generate - Generate learning plan
router.post('/generate', [
  body('childId').isUUID().withMessage('Valid child ID required'),
  body('band').optional().isIn(['A0', 'A1', 'A2']).withMessage('Band must be A0, A1, or A2'),
  body('startsOn').optional().isISO8601().withMessage('Start date must be valid ISO date'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { childId, band, startsOn } = req.body;
    
    // Verify child exists
    const child = await prisma.child.findUnique({
      where: { id: childId }
    });
    
    if (!child) {
      return res.status(400).json({ error: 'Child not found' });
    }
    
    let planBand = band;
    
    // If no band provided, get from latest finished assessment
    if (!planBand) {
      const latestSession = await prisma.assessmentSession.findFirst({
        where: {
          childId,
          status: 'FINISHED'
        },
        orderBy: { finishedAt: 'desc' }
      });
      
      if (latestSession && latestSession.score !== null) {
        // Determine band from score
        if (latestSession.score <= 40) planBand = 'A0';
        else if (latestSession.score <= 75) planBand = 'A1';
        else planBand = 'A2';
      } else {
        planBand = 'A0'; // Default for new students
      }
    }
    
    const startDate = startsOn ? new Date(startsOn) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 60);
    
    // Check for existing active plan
    const existingPlan = await prisma.plan.findFirst({
      where: {
        childId,
        endsOn: { gte: new Date() }
      }
    });
    
    if (existingPlan) {
      return res.status(400).json({ error: 'Child already has an active learning plan' });
    }
    
    // Create plan
    const plan = await prisma.plan.create({
      data: {
        childId,
        startsOn: startDate,
        endsOn: endDate,
        band: planBand
      }
    });
    
    // Generate 60 plan days
    const planDays = [];
    for (let dayIndex = 1; dayIndex <= 60; dayIndex++) {
      const tasks = generateDayTasks(planBand, dayIndex);
      planDays.push({
        planId: plan.id,
        dayIndex,
        ...tasks,
        minutesEstimate: Object.values(tasks).reduce((sum, task) => sum + task.estimatedMinutes, 0)
      });
    }
    
    await prisma.planDay.createMany({
      data: planDays
    });
    
    res.status(201).json({ planId: plan.id });
  } catch (error) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Failed to generate learning plan' });
  }
});

// GET /api/plans/:childId/today - Get today's plan
router.get('/:childId/today', [
  param('childId').isUUID().withMessage('Valid child ID required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Get active plan for child
    const plan = await prisma.plan.findFirst({
      where: {
        childId,
        startsOn: { lte: new Date() },
        endsOn: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!plan) {
      return res.status(404).json({ error: 'No active learning plan found for this child' });
    }
    
    // Calculate today's day index
    const today = new Date();
    const startDate = new Date(plan.startsOn);
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const todayIndex = daysDiff + 1;
    
    if (todayIndex < 1 || todayIndex > 60) {
      return res.status(200).json({ 
        message: 'No tasks for today', 
        planDay: null,
        dayIndex: todayIndex,
        planInfo: { startsOn: plan.startsOn, endsOn: plan.endsOn, band: plan.band }
      });
    }
    
    // Get today's plan day
    const planDay = await prisma.planDay.findFirst({
      where: {
        planId: plan.id,
        dayIndex: todayIndex
      }
    });
    
    if (!planDay) {
      return res.status(404).json({ error: 'Today\'s plan not found' });
    }
    
    res.json({ 
      planDay,
      dayIndex: todayIndex,
      planInfo: { 
        startsOn: plan.startsOn, 
        endsOn: plan.endsOn, 
        band: plan.band 
      }
    });
  } catch (error) {
    console.error('Error getting today\'s plan:', error);
    res.status(500).json({ error: 'Failed to get today\'s plan' });
  }
});

// GET /api/plans - List all plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      include: {
        child: {
          select: { id: true, name: true, age: true }
        },
        _count: {
          select: { planDays: true }
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

module.exports = router;
