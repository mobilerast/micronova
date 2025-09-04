#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedQuestions() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data in correct order
    console.log('🗑️ Clearing existing data...');
    await prisma.answer.deleteMany();
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();
    await prisma.planDay.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.assessmentSession.deleteMany();
    await prisma.child.deleteMany();
    await prisma.guardian.deleteMany();

    // Create sample guardians
    console.log('👨‍👩‍👧‍👦 Creating sample guardians...');
    const guardians = await Promise.all([
      prisma.guardian.create({
        data: { 
          name: 'Sarah Johnson', 
          email: 'sarah@example.com', 
          phone: '+1-555-0101' 
        }
      }),
      prisma.guardian.create({
        data: { 
          name: 'Mike Rodriguez', 
          email: 'mike@example.com', 
          phone: '+1-555-0102' 
        }
      }),
      prisma.guardian.create({
        data: { 
          name: 'Lisa Chen', 
          email: 'lisa@example.com', 
          phone: null 
        }
      })
    ]);

    // Create sample children
    console.log('👶 Creating sample children...');
    const children = await Promise.all([
      prisma.child.create({
        data: { 
          name: 'Emma Johnson', 
          age: 8, 
          nativeLanguage: 'english', 
          guardianId: guardians[0].id 
        }
      }),
      prisma.child.create({
        data: { 
          name: 'Liam Rodriguez', 
          age: 10, 
          nativeLanguage: 'spanish', 
          guardianId: guardians[1].id 
        }
      }),
      prisma.child.create({
        data: { 
          name: 'Sophia Chen', 
          age: 9, 
          nativeLanguage: 'mandarin', 
          guardianId: guardians[2].id 
        }
      })
    ]);

    console.log(`✅ Created ${children.length} children`);

    // Create sample questions
    console.log('❓ Creating sample questions...');
    const questions = await Promise.all([
      // A0 Level Questions
      prisma.question.create({
        data: {
          slug: 'colors-sun',
          text: 'What color is the sun?',
          ageMin: 8,
          ageMax: 10,
          scope: 'vocab',
          levelHint: 'A0',
          options: {
            create: [
              { text: 'Blue', isCorrect: false },
              { text: 'Yellow', isCorrect: true },
              { text: 'Green', isCorrect: false },
              { text: 'Purple', isCorrect: false }
            ]
          }
        }
      }),
      prisma.question.create({
        data: {
          slug: 'animals-cat',
          text: 'Which animal says "meow"?',
          ageMin: 8,
          ageMax: 12,
          scope: 'vocab',
          levelHint: 'A0',
          options: {
            create: [
              { text: 'Dog', isCorrect: false },
              { text: 'Cat', isCorrect: true },
              { text: 'Bird', isCorrect: false },
              { text: 'Fish', isCorrect: false }
            ]
          }
        }
      }),
      // A1 Level Questions
      prisma.question.create({
        data: {
          slug: 'time-week',
          text: 'How many days are in a week?',
          ageMin: 9,
          ageMax: 13,
          scope: 'vocab',
          levelHint: 'A1',
          options: {
            create: [
              { text: '5', isCorrect: false },
              { text: '6', isCorrect: false },
              { text: '7', isCorrect: true },
              { text: '8', isCorrect: false }
            ]
          }
        }
      }),
      prisma.question.create({
        data: {
          slug: 'seasons-after-winter',
          text: 'Which season comes after winter?',
          ageMin: 10,
          ageMax: 13,
          scope: 'vocab',
          levelHint: 'A1',
          options: {
            create: [
              { text: 'Summer', isCorrect: false },
              { text: 'Fall', isCorrect: false },
              { text: 'Spring', isCorrect: true },
              { text: 'Winter', isCorrect: false }
            ]
          }
        }
      }),
      // A2 Level Questions
      prisma.question.create({
        data: {
          slug: 'science-spider-legs',
          text: 'How many legs does a spider have?',
          ageMin: 11,
          ageMax: 13,
          scope: 'vocab',
          levelHint: 'A2',
          options: {
            create: [
              { text: '6', isCorrect: false },
              { text: '8', isCorrect: true },
              { text: '10', isCorrect: false },
              { text: '4', isCorrect: false }
            ]
          }
        }
      }),
      prisma.question.create({
        data: {
          slug: 'geography-earth',
          text: 'What planet do we live on?',
          ageMin: 10,
          ageMax: 13,
          scope: 'vocab',
          levelHint: 'A2',
          options: {
            create: [
              { text: 'Mars', isCorrect: false },
              { text: 'Venus', isCorrect: false },
              { text: 'Earth', isCorrect: true },
              { text: 'Jupiter', isCorrect: false }
            ]
          }
        }
      })
    ]);

    console.log(`✅ Created ${questions.length} questions with options`);

    // Create sample assessment sessions and plans for each child
    for (const child of children) {
      console.log(`📝 Creating assessment session for ${child.name}...`);
      
      // Create assessment session
      const session = await prisma.assessmentSession.create({
        data: {
          childId: child.id,
          status: 'FINISHED',
          score: Math.floor(Math.random() * 100),
          finishedAt: new Date()
        }
      });

      // Create some sample answers
      const sampleQuestions = questions.slice(0, 3); // Use first 3 questions
      for (const question of sampleQuestions) {
        const correctOption = await prisma.option.findFirst({
          where: { questionId: question.id, isCorrect: true }
        });
        
        await prisma.answer.create({
          data: {
            sessionId: session.id,
            questionId: question.id,
            optionId: correctOption.id,
            correct: Math.random() > 0.3 // 70% correct rate
          }
        });
      }

      console.log(`📊 Assessment session created for ${child.name}`);

      // Create learning plan
      console.log(`📚 Creating learning plan for ${child.name}...`);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 60);
      
      const plan = await prisma.plan.create({
        data: {
          childId: child.id,
          startsOn: startDate,
          endsOn: endDate,
          band: ['A0', 'A1', 'A2'][Math.floor(Math.random() * 3)]
        }
      });

      // Create sample plan days (first 5 days)
      for (let dayIndex = 1; dayIndex <= 5; dayIndex++) {
        await prisma.planDay.create({
          data: {
            planId: plan.id,
            dayIndex,
            vocabTask: {
              word: 'example',
              definition: 'A sample word',
              options: ['example', 'sample', 'demo', 'test'],
              correctAnswer: 'example'
            },
            readingTask: {
              title: 'Daily Reading',
              content: 'This is a sample reading passage.',
              question: 'What is this about?',
              options: ['reading', 'writing', 'math', 'science'],
              correctAnswer: 'reading'
            },
            speakingTask: {
              prompt: 'Tell me about your favorite color.',
              expectedLength: '1-2 sentences'
            },
            listeningTask: {
              audioUrl: 'https://example.com/audio.mp3',
              question: 'What did you hear?',
              options: ['music', 'speech', 'noise', 'silence'],
              correctAnswer: 'speech'
            },
            minutesEstimate: 15
          }
        });
      }

      console.log(`✅ Created plan with 5 sample days for ${child.name}`);
    }

    // Final statistics
    const stats = await Promise.all([
      prisma.guardian.count(),
      prisma.child.count(),
      prisma.question.count(),
      prisma.option.count(),
      prisma.assessmentSession.count(),
      prisma.answer.count(),
      prisma.plan.count(),
      prisma.planDay.count()
    ]);

    const [
      totalGuardians, 
      totalChildren, 
      totalQuestions, 
      totalOptions,
      totalSessions, 
      totalAnswers,
      totalPlans, 
      totalPlanDays
    ] = stats;

    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Database Statistics:');
    console.log(`   - Guardians: ${totalGuardians}`);
    console.log(`   - Children: ${totalChildren}`);
    console.log(`   - Questions: ${totalQuestions}`);
    console.log(`   - Options: ${totalOptions}`);
    console.log(`   - Assessment Sessions: ${totalSessions}`);
    console.log(`   - Answers: ${totalAnswers}`);
    console.log(`   - Plans: ${totalPlans}`);
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
