#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const AssessmentService = require('../../src/services/assessmentService');
const PlanService = require('../../src/services/planService');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedQuestions() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await prisma.learningSession.deleteMany();
    await prisma.learningPlanDay.deleteMany();
    await prisma.learningPlan.deleteMany();
    await prisma.assessment.deleteMany();
    await prisma.child.deleteMany();
    await prisma.guardian.deleteMany();

    // Create sample guardians
    console.log('👨‍👩‍👧‍👦 Creating sample guardians...');
    const guardians = await Promise.all([
      prisma.guardian.create({
        data: { name: 'Sarah Johnson', email: 'sarah@example.com', relationship: 'mother' }
      }),
      prisma.guardian.create({
        data: { name: 'Mike Rodriguez', email: 'mike@example.com', relationship: 'father' }
      }),
      prisma.guardian.create({
        data: { name: 'Lisa Chen', email: 'lisa@example.com', relationship: 'parent' }
      })
    ]);

    // Create sample children
    console.log('👶 Creating sample children...');
    const children = await Promise.all([
      prisma.child.create({
        data: { name: 'Emma Johnson', age: 8, language: 'english', guardianId: guardians[0].id }
      }),
      prisma.child.create({
        data: { name: 'Liam Rodriguez', age: 10, language: 'english', guardianId: guardians[1].id }
      }),
      prisma.child.create({
        data: { name: 'Sophia Chen', age: 9, language: 'english', guardianId: guardians[2].id }
      }),
      prisma.child.create({
        data: { name: 'Noah Williams', age: 11, language: 'english' }
      }),
      prisma.child.create({
        data: { name: 'Olivia Davis', age: 12, language: 'english' }
      })
    ]);

    console.log(`✅ Created ${children.length} children`);

    // Create assessments and plans for each child
    for (const child of children) {
      console.log(`📝 Creating assessment for ${child.name}...`);
      
      // Random score and determine level
      const score = Math.floor(Math.random() * 100);
      const level = AssessmentService.determineLevel(score);

      // Create assessment
      const assessment = await prisma.assessment.create({
        data: {
          childId: child.id,
          score,
          level,
          answers: [
            { questionId: 1, selectedAnswer: 'Yellow', correctAnswer: 'Yellow', isCorrect: true },
            { questionId: 2, selectedAnswer: 'Cat', correctAnswer: 'Cat', isCorrect: true },
            { questionId: 3, selectedAnswer: '7', correctAnswer: '7', isCorrect: score > 50 }
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
      console.log(`📚 Creating learning plan for ${child.name}...`);
      
      const plan = await PlanService.createPlan(child.id, level);

      console.log(`✅ Created plan for ${child.name}`);
    }

    // Final statistics
    const stats = await Promise.all([
      prisma.guardian.count(),
      prisma.child.count(),
      prisma.assessment.count(),
      prisma.learningPlan.count(),
      prisma.learningPlanDay.count()
    ]);

    const [totalGuardians, totalChildren, totalAssessments, totalPlans, totalPlanDays] = stats;

    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Database Statistics:');
    console.log(`   - Guardians: ${totalGuardians}`);
    console.log(`   - Children: ${totalChildren}`);
    console.log(`   - Assessments: ${totalAssessments}`);
    console.log(`   - Learning Plans: ${totalPlans}`);
    console.log(`   - Plan Days: ${totalPlanDays}`);
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
  seedQuestions();
}

module.exports = { seedQuestions };
