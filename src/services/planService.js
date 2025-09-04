const { prisma } = require('../lib/prisma');

// Plan service for generating learning plans
class PlanService {
  
  // Create a new learning plan
  static async createPlan(childId, level) {
    // Deactivate existing plans for this child
    await prisma.learningPlan.updateMany({
      where: { childId, isActive: true },
      data: { isActive: false }
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 60);

    // Generate plan days
    const planDays = this.generatePlanDays(level);

    // Create plan with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the plan
      const plan = await tx.learningPlan.create({
        data: {
          childId,
          level,
          startDate,
          endDate,
          isActive: true
        }
      });

      // Create plan days
      await tx.learningPlanDay.createMany({
        data: planDays.map(day => ({
          planId: plan.id,
          dayNumber: day.dayNumber,
          vocabTask: day.vocabTask,
          readingTask: day.readingTask,
          speakingPrompt: day.speakingPrompt
        }))
      });

      return plan;
    });

    return result;
  }

  // Generate 60 days of plan content
  static generatePlanDays(level) {
    const planConfig = this.getLevelConfig(level);
    const days = [];

    for (let dayNumber = 1; dayNumber <= 60; dayNumber++) {
      days.push({
        dayNumber,
        vocabTask: this.generateVocabTask(level, dayNumber, planConfig),
        readingTask: this.generateReadingTask(level, dayNumber, planConfig),
        speakingPrompt: this.generateSpeakingPrompt(level, dayNumber, planConfig)
      });
    }

    return days;
  }

  // Level configuration
  static getLevelConfig(level) {
    const configs = {
      'A0': {
        themes: ['colors', 'animals', 'family', 'food'],
        complexity: 'basic'
      },
      'A1': {
        themes: ['school', 'weather', 'hobbies', 'clothes'],
        complexity: 'elementary'
      },
      'A2-kids': {
        themes: ['travel', 'nature', 'technology', 'science'],
        complexity: 'intermediate'
      }
    };
    return configs[level] || configs['A0'];
  }

  // Generate vocabulary task
  static generateVocabTask(level, dayNumber, config) {
    const theme = config.themes[dayNumber % config.themes.length];
    
    return {
      word: 'example',
      definition: 'A sample word for demonstration',
      options: ['example', 'sample', 'demo', 'test'],
      correctAnswer: 'example',
      theme
    };
  }

  // Generate reading task
  static generateReadingTask(level, dayNumber, config) {
    const theme = config.themes[dayNumber % config.themes.length];
    
    return {
      title: `Reading about ${theme}`,
      content: `This is a sample reading passage about ${theme}. It is designed for ${level} level learners.`,
      question: `What is this passage about?`,
      options: [theme, 'other topic', 'nothing', 'everything'],
      correctAnswer: theme,
      theme
    };
  }

  // Generate speaking prompt
  static generateSpeakingPrompt(level, dayNumber, config) {
    const theme = config.themes[dayNumber % config.themes.length];
    
    return {
      prompt: `Tell me about your favorite ${theme}.`,
      expectedLength: '1-2 sentences',
      theme,
      hints: [`Think about why you like this ${theme}`]
    };
  }
}

module.exports = PlanService;
