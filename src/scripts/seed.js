#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedDatabase() {
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
        data: { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1-555-0101' }
      }),
      prisma.guardian.create({
        data: { name: 'Mike Rodriguez', email: 'mike@example.com', phone: '+1-555-0102' }
      }),
      prisma.guardian.create({
        data: { name: 'Lisa Chen', email: 'lisa@example.com', phone: null }
      })
    ]);

    // Create sample children
    console.log('👶 Creating sample children...');
    const children = await Promise.all([
      prisma.child.create({
        data: { name: 'Emma Johnson', age: 8, nativeLanguage: 'english', guardianId: guardians[0].id }
      }),
      prisma.child.create({
        data: { name: 'Liam Rodriguez', age: 10, nativeLanguage: 'spanish', guardianId: guardians[1].id }
      }),
      prisma.child.create({
        data: { name: 'Sophia Chen', age: 9, nativeLanguage: 'mandarin', guardianId: guardians[2].id }
      }),
      prisma.child.create({
        data: { name: 'Noah Williams', age: 11, nativeLanguage: 'english', guardianId: guardians[0].id }
      }),
      prisma.child.create({
        data: { name: 'Olivia Johnson', age: 12, nativeLanguage: 'english', guardianId: guardians[1].id }
      })
    ]);

    console.log(`✅ Created ${children.length} children`);

    // Create comprehensive question bank (15-20 questions across scopes and levels)
    console.log('❓ Creating question bank...');
    const questions = await Promise.all([
      // A0 Vocabulary Questions (Ages 8-10)
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
      prisma.question.create({
        data: {
          slug: 'body-parts-eyes',
          text: 'What do we use to see?',
          ageMin: 8,
          ageMax: 11,
          scope: 'vocab',
          levelHint: 'A0',
          options: {
            create: [
              { text: 'Ears', isCorrect: false },
              { text: 'Eyes', isCorrect: true },
              { text: 'Nose', isCorrect: false },
              { text: 'Mouth', isCorrect: false }
            ]
          }
        }
      }),

      // A0 Grammar Questions
      prisma.question.create({
        data: {
          slug: 'grammar-is-are',
          text: 'Complete: "The cat ___ sleeping"',
          ageMin: 8,
          ageMax: 12,
          scope: 'grammar',
          levelHint: 'A0',
          options: {
            create: [
              { text: 'is', isCorrect: true },
              { text: 'are', isCorrect: false },
              { text: 'am', isCorrect: false },
              { text: 'be', isCorrect: false }
            ]
          }
        }
      }),

      // A1 Vocabulary Questions (Ages 9-12)
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
      prisma.question.create({
        data: {
          slug: 'family-mother-father',
          text: 'Your mother and father are your...',
          ageMin: 8,
          ageMax: 12,
          scope: 'vocab',
          levelHint: 'A1',
          options: {
            create: [
              { text: 'friends', isCorrect: false },
              { text: 'parents', isCorrect: true },
              { text: 'siblings', isCorrect: false },
              { text: 'teachers', isCorrect: false }
            ]
          }
        }
      }),

      // A1 Grammar Questions
      prisma.question.create({
        data: {
          slug: 'grammar-past-simple',
          text: 'Yesterday, I ___ to school.',
          ageMin: 10,
          ageMax: 13,
          scope: 'grammar',
          levelHint: 'A1',
          options: {
            create: [
              { text: 'go', isCorrect: false },
              { text: 'goes', isCorrect: false },
              { text: 'went', isCorrect: true },
              { text: 'going', isCorrect: false }
            ]
          }
        }
      }),

      // A1 Reading Questions
      prisma.question.create({
        data: {
          slug: 'reading-simple-sentence',
          text: 'Read: "The dog runs fast in the park." Where does the dog run?',
          ageMin: 9,
          ageMax: 12,
          scope: 'reading',
          levelHint: 'A1',
          options: {
            create: [
              { text: 'at home', isCorrect: false },
              { text: 'in the park', isCorrect: true },
              { text: 'at school', isCorrect: false },
              { text: 'in the car', isCorrect: false }
            ]
          }
        }
      }),

      // A2 Questions (Ages 11-13)
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
      }),

      // A2 Grammar Questions
      prisma.question.create({
        data: {
          slug: 'grammar-present-perfect',
          text: 'I ___ never been to Paris.',
          ageMin: 11,
          ageMax: 13,
          scope: 'grammar',
          levelHint: 'A2',
          options: {
            create: [
              { text: 'am', isCorrect: false },
              { text: 'have', isCorrect: true },
              { text: 'had', isCorrect: false },
              { text: 'was', isCorrect: false }
            ]
          }
        }
      }),

      // A2 Reading Questions
      prisma.question.create({
        data: {
          slug: 'reading-comprehension',
          text: 'Read: "Maria loves to read books about adventure. She has a big collection of stories about pirates and explorers." What does Maria collect?',
          ageMin: 11,
          ageMax: 13,
          scope: 'reading',
          levelHint: 'A2',
          options: {
            create: [
              { text: 'toys', isCorrect: false },
              { text: 'adventure books', isCorrect: true },
              { text: 'maps', isCorrect: false },
              { text: 'pictures', isCorrect: false }
            ]
          }
        }
      }),

      // Speaking Prompts (no options, for variety)
      prisma.question.create({
        data: {
          slug: 'speaking-favorite-color',
          text: 'Tell me about your favorite color. Why do you like it?',
          ageMin: 8,
          ageMax: 13,
          scope: 'speaking',
          levelHint: 'A0',
          options: {
            create: []
          }
        }
      }),
      prisma.question.create({
        data: {
          slug: 'speaking-family',
          text: 'Describe your family. Who lives in your house?',
          ageMin: 9,
          ageMax: 13,
          scope: 'speaking',
          levelHint: 'A1',
          options: {
            create: []
          }
        }
      }),

      // Listening Questions (simulated)
      prisma.question.create({
        data: {
          slug: 'listening-numbers',
          text: 'Listen: "I have three cats and two dogs." How many pets total?',
          ageMin: 8,
          ageMax: 12,
          scope: 'listening',
          levelHint: 'A1',
          options: {
            create: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: false },
              { text: '5', isCorrect: true },
              { text: '6', isCorrect: false }
            ]
          }
        }
      }),
      prisma.question.create({
        data: {
          slug: 'listening-directions',
          text: 'Listen: "Go straight, then turn left at the park." What should you do at the park?',
          ageMin: 10,
          ageMax: 13,
          scope: 'listening',
          levelHint: 'A2',
          options: {
            create: [
              { text: 'stop', isCorrect: false },
              { text: 'turn right', isCorrect: false },
              { text: 'turn left', isCorrect: true },
              { text: 'go back', isCorrect: false }
            ]
          }
        }
      })
    ]);

    console.log(`✅ Created ${questions.length} questions with options`);

    // Final statistics
    const stats = await Promise.all([
      prisma.guardian.count(),
      prisma.child.count(),
      prisma.question.count(),
      prisma.option.count()
    ]);

    const [totalGuardians, totalChildren, totalQuestions, totalOptions] = stats;

    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Database Statistics:');
    console.log(`   - Guardians: ${totalGuardians}`);
    console.log(`   - Children: ${totalChildren}`);
    console.log(`   - Questions: ${totalQuestions}`);
    console.log(`   - Options: ${totalOptions}`);
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
