const express = require('express');
const { requireApiKey } = require('../middleware/auth');
const { prisma } = require('../utils/db');
const { PlanGenerator } = require('../services/planGenerator');

const router = express.Router();

// All seed routes require API key
router.use(requireApiKey('SEED'));

// POST /api/seed/sample-data - Create sample children and data
router.post('/sample-data', async (req, res) => {
  try {
    console.log('🌱 Starting to seed sample data...');

    // Sample children
    const sampleChildren = [
      { name: 'Emma', age: 8, language: 'english' },
      { name: 'Liam', age: 10, language: 'english' },
      { name: 'Sophia', age: 9, language: 'english' },
      { name: 'Noah', age: 11, language: 'english' },
      { name: 'Olivia', age: 12, language: 'english' }
    ];

    const results = {
      children: [],
      assessments: [],
      plans: []
    };

    for (const childData of sampleChildren) {
      // Create child
      const child = await prisma.child.create({
        data: childData
      });
      results.children.push(child);

      // Create sample assessment
      const score = Math.floor(Math.random() * 100);
      const level = PlanGenerator.determineLevel(score);
      
      const assessment = await prisma.assessment.create({
        data: {
          childId: child.id,
          score,
          level,
          answers: [
            { questionId: 1, selectedAnswer: 'Yellow', correctAnswer: 'Yellow', isCorrect: true },
            { questionId: 2, selectedAnswer: 'Cat', correctAnswer: 'Cat', isCorrect: true },
            { questionId: 3, selectedAnswer: '7', correctAnswer: '7', isCorrect: score > 50 },
            { questionId: 4, selectedAnswer: 'Pencil', correctAnswer: 'Pencil', isCorrect: true }
          ]
        }
      });
      results.assessments.push(assessment);

      // Update child level
      await prisma.child.update({
        where: { id: child.id },
        data: { level }
      });

      // Create learning plan
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 60);

      const plan = await prisma.learningPlan.create({
        data: {
          childId: child.id,
          level,
          startDate,
          endDate,
          isActive: true
        }
      });

      // Generate and create plan days
      const planDays = PlanGenerator.generatePlan(level);
      await prisma.learningPlanDay.createMany({
        data: planDays.map(day => ({
          planId: plan.id,
          dayNumber: day.dayNumber,
          vocabTask: day.vocabTask,
          readingTask: day.readingTask,
          speakingPrompt: day.speakingPrompt
        }))
      });

      results.plans.push(plan);

      // Create some sample sessions for first few days
      const firstFewDays = await prisma.learningPlanDay.findMany({
        where: { planId: plan.id },
        take: 3,
        orderBy: { dayNumber: 'asc' }
      });

      for (const planDay of firstFewDays) {
        await prisma.learningSession.create({
          data: {
            childId: child.id,
            planDayId: planDay.id,
            vocabAnswer: 'Sample answer',
            readingAnswer: 'Sample answer',
            speakingAnswer: 'This is a sample speaking response for the prompt.',
            vocabCorrect: Math.random() > 0.3,
            readingCorrect: Math.random() > 0.2,
            totalTimeMs: Math.floor(Math.random() * 300000) + 60000 // 1-5 minutes
          }
        });
      }
    }

    console.log('✅ Sample data seeded successfully!');
    res.json({
      message: 'Sample data created successfully!',
      summary: {
        children: results.children.length,
        assessments: results.assessments.length,
        plans: results.plans.length,
        totalPlanDays: results.plans.length * 60
      }
    });

  } catch (error) {
    console.error('Error seeding sample data:', error);
    res.status(500).json({ error: 'Failed to seed sample data' });
  }
});

// DELETE /api/seed/clear-all - Clear all data (dangerous!)
router.delete('/clear-all', async (req, res) => {
  try {
    console.log('🗑️ Starting to clear all data...');

    // Delete in correct order due to foreign key constraints
    await prisma.learningSession.deleteMany();
    await prisma.learningPlanDay.deleteMany();
    await prisma.learningPlan.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.child.deleteMany();

    console.log('✅ All data cleared successfully!');
    res.json({ message: 'All data cleared successfully!' });

  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

// GET /api/seed/database-stats - Get database statistics
router.get('/database-stats', async (req, res) => {
  try {
    const stats = await Promise.all([
      prisma.child.count(),
      prisma.assessment.count(),
      prisma.learningPlan.count(),
      prisma.learningPlanDay.count(),
      prisma.learningSession.count()
    ]);

    const [children, assessments, plans, planDays, sessions] = stats;

    res.json({
      stats: {
        children,
        assessments,
        plans,
        planDays,
        sessions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

// POST /api/seed/reset-and-seed - Clear all data and create fresh sample data
router.post('/reset-and-seed', async (req, res) => {
  try {
    console.log('🔄 Starting reset and seed process...');

    // Clear all data first
    await prisma.learningSession.deleteMany();
    await prisma.learningPlanDay.deleteMany();
    await prisma.learningPlan.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.child.deleteMany();

    console.log('🗑️ Data cleared, now seeding...');

    // Use the same logic as sample-data endpoint
    const sampleChildren = [
      { name: 'Emma', age: 8, language: 'english' },
      { name: 'Liam', age: 10, language: 'english' },
      { name: 'Sophia', age: 9, language: 'english' },
      { name: 'Noah', age: 11, language: 'english' },
      { name: 'Olivia', age: 12, language: 'english' }
    ];

    const results = {
      children: [],
      assessments: [],
      plans: []
    };

    for (const childData of sampleChildren) {
      const child = await prisma.child.create({ data: childData });
      results.children.push(child);

      const score = Math.floor(Math.random() * 100);
      const level = PlanGenerator.determineLevel(score);
      
      const assessment = await prisma.assessment.create({
        data: {
          childId: child.id,
          score,
          level,
          answers: [
            { questionId: 1, selectedAnswer: 'Yellow', correctAnswer: 'Yellow', isCorrect: true },
            { questionId: 2, selectedAnswer: 'Cat', correctAnswer: 'Cat', isCorrect: true }
          ]
        }
      });
      results.assessments.push(assessment);

      await prisma.child.update({
        where: { id: child.id },
        data: { level }
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 60);

      const plan = await prisma.learningPlan.create({
        data: {
          childId: child.id,
          level,
          startDate,
          endDate,
          isActive: true
        }
      });

      const planDays = PlanGenerator.generatePlan(level);
      await prisma.learningPlanDay.createMany({
        data: planDays.map(day => ({
          planId: plan.id,
          dayNumber: day.dayNumber,
          vocabTask: day.vocabTask,
          readingTask: day.readingTask,
          speakingPrompt: day.speakingPrompt
        }))
      });

      results.plans.push(plan);
    }

    console.log('✅ Reset and seed completed successfully!');
    res.json({
      message: 'Database reset and seeded successfully!',
      summary: {
        children: results.children.length,
        assessments: results.assessments.length,
        plans: results.plans.length,
        totalPlanDays: results.plans.length * 60
      }
    });

  } catch (error) {
    console.error('Error in reset and seed:', error);
    res.status(500).json({ error: 'Failed to reset and seed database' });
  }
});

module.exports = router;
