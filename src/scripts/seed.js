#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const { PlanGenerator } = require('../services/planGenerator');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.learningSession.deleteMany();
    await prisma.learningPlanDay.deleteMany();
    await prisma.learningPlan.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.child.deleteMany();

    // Create sample children
    console.log('👶 Creating sample children...');
    const children = await Promise.all([
      prisma.child.create({
        data: { name: 'Emma Thompson', age: 8, language: 'english' }
      }),
      prisma.child.create({
        data: { name: 'Liam Rodriguez', age: 10, language: 'english' }
      }),
      prisma.child.create({
        data: { name: 'Sophia Chen', age: 9, language: 'english' }
      }),
      prisma.child.create({
        data: { name: 'Noah Williams', age: 11, language: 'english' }
      }),
      prisma.child.create({
        data: { name: 'Olivia Johnson', age: 12, language: 'english' }
      })
    ]);

    console.log(`✅ Created ${children.length} children`);

    // Create assessments and plans for each child
    for (const child of children) {
      console.log(`📝 Creating assessment for ${child.name}...`);
      
      // Random score and determine level
      const score = Math.floor(Math.random() * 100);
      const level = PlanGenerator.determineLevel(score);

      // Create assessment
      const assessment = await prisma.assessment.create({
        data: {
          childId: child.id,
          score,
          level,
          answers: [
            { questionId: 1, selectedAnswer: 'Yellow', correctAnswer: 'Yellow', isCorrect: true },
            { questionId: 2, selectedAnswer: 'Cat', correctAnswer: 'Cat', isCorrect: true },
            { questionId: 3, selectedAnswer: '7', correctAnswer: '7', isCorrect: score > 50 },
            { questionId: 4, selectedAnswer: 'Pencil', correctAnswer: 'Pencil', isCorrect: score > 30 }
          ]
        }
      });

      // Update child with level
      await prisma.child.update({
        where: { id: child.id },
        data: { level }
      });

      console.log(`📊 Assessment created: Score ${score}%, Level ${level}`);

      // Create learning plan
      console.log(`📚 Creating 60-day learning plan for ${child.name}...`);
      
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

      // Generate plan days
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

      console.log(`✅ Created plan with 60 days for ${child.name}`);

      // Create some sample sessions for the first few days
      const firstDays = await prisma.learningPlanDay.findMany({
        where: { planId: plan.id },
        take: Math.floor(Math.random() * 5) + 1, // 1-5 days
        orderBy: { dayNumber: 'asc' }
      });

      for (const planDay of firstDays) {
        await prisma.learningSession.create({
          data: {
            childId: child.id,
            planDayId: planDay.id,
            vocabAnswer: 'Sample answer',
            readingAnswer: 'Sample reading answer',
            speakingAnswer: 'This is a sample speaking response.',
            vocabCorrect: Math.random() > 0.2, // 80% correct rate
            readingCorrect: Math.random() > 0.25, // 75% correct rate
            totalTimeMs: Math.floor(Math.random() * 240000) + 60000 // 1-4 minutes
          }
        });
      }

      console.log(`🎯 Created ${firstDays.length} sample sessions for ${child.name}`);
    }

    // Final statistics
    const stats = await Promise.all([
      prisma.child.count(),
      prisma.assessment.count(),
      prisma.learningPlan.count(),
      prisma.learningPlanDay.count(),
      prisma.learningSession.count()
    ]);

    const [totalChildren, totalAssessments, totalPlans, totalPlanDays, totalSessions] = stats;

    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Database Statistics:');
    console.log(`   - Children: ${totalChildren}`);
    console.log(`   - Assessments: ${totalAssessments}`);
    console.log(`   - Learning Plans: ${totalPlans}`);
    console.log(`   - Plan Days: ${totalPlanDays}`);
    console.log(`   - Learning Sessions: ${totalSessions}`);
    console.log('\n🚀 Ready to start the Micronova backend!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
