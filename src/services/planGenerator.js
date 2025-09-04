// Plan Generator Service - Maps score bands to plan difficulty
class PlanGenerator {
  
  // Determine level based on assessment score
  static determineLevel(score) {
    if (score >= 0 && score <= 30) return 'A0';
    if (score >= 31 && score <= 65) return 'A1';
    if (score >= 66 && score <= 100) return 'A2-kids';
    return 'A0'; // Default fallback
  }

  // Generate 60-day learning plan based on level
  static generatePlan(level) {
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
        vocabDifficulty: 'basic',
        readingLength: 'short',
        speakingComplexity: 'simple',
        themes: ['colors', 'animals', 'family', 'food', 'toys', 'body parts']
      },
      'A1': {
        vocabDifficulty: 'elementary',
        readingLength: 'medium',
        speakingComplexity: 'basic',
        themes: ['school', 'weather', 'hobbies', 'clothes', 'house', 'sports']
      },
      'A2-kids': {
        vocabDifficulty: 'intermediate',
        readingLength: 'longer',
        speakingComplexity: 'detailed',
        themes: ['travel', 'nature', 'technology', 'friendship', 'science', 'arts']
      }
    };
    return configs[level] || configs['A0'];
  }

  // Generate vocabulary task
  static generateVocabTask(level, dayNumber, config) {
    const theme = config.themes[dayNumber % config.themes.length];
    const vocabSets = this.getVocabByTheme(theme, config.vocabDifficulty);
    const wordData = vocabSets[dayNumber % vocabSets.length];

    return {
      word: wordData.word,
      definition: wordData.definition,
      options: this.shuffleArray([
        wordData.correct,
        ...wordData.distractors
      ]),
      correctAnswer: wordData.correct,
      theme
    };
  }

  // Generate reading/listening task
  static generateReadingTask(level, dayNumber, config) {
    const theme = config.themes[dayNumber % config.themes.length];
    const readings = this.getReadingByTheme(theme, config.readingLength);
    const reading = readings[dayNumber % readings.length];

    return {
      title: reading.title,
      content: reading.content,
      question: reading.question,
      options: this.shuffleArray([
        reading.correctAnswer,
        ...reading.distractors
      ]),
      correctAnswer: reading.correctAnswer,
      theme
    };
  }

  // Generate speaking prompt
  static generateSpeakingPrompt(level, dayNumber, config) {
    const theme = config.themes[dayNumber % config.themes.length];
    const prompts = this.getSpeakingPrompts(theme, config.speakingComplexity);
    const prompt = prompts[dayNumber % prompts.length];

    return {
      prompt: prompt.text,
      expectedLength: prompt.expectedLength,
      theme,
      hints: prompt.hints || []
    };
  }

  // Vocabulary data by theme
  static getVocabByTheme(theme, difficulty) {
    const vocab = {
      colors: [
        { word: 'red', definition: 'The color of an apple', correct: 'red', distractors: ['blue', 'green', 'yellow'] },
        { word: 'blue', definition: 'The color of the sky', correct: 'blue', distractors: ['red', 'purple', 'orange'] },
        { word: 'green', definition: 'The color of grass', correct: 'green', distractors: ['pink', 'brown', 'white'] }
      ],
      animals: [
        { word: 'cat', definition: 'A small furry pet that says meow', correct: 'cat', distractors: ['dog', 'bird', 'fish'] },
        { word: 'dog', definition: 'A loyal pet that barks', correct: 'dog', distractors: ['cat', 'rabbit', 'mouse'] },
        { word: 'bird', definition: 'An animal that can fly and has wings', correct: 'bird', distractors: ['frog', 'snake', 'spider'] }
      ],
      family: [
        { word: 'mother', definition: 'Your female parent', correct: 'mother', distractors: ['father', 'sister', 'brother'] },
        { word: 'father', definition: 'Your male parent', correct: 'father', distractors: ['mother', 'uncle', 'cousin'] },
        { word: 'sister', definition: 'Your female sibling', correct: 'sister', distractors: ['brother', 'aunt', 'grandmother'] }
      ]
    };
    return vocab[theme] || vocab.colors;
  }

  // Reading data by theme
  static getReadingByTheme(theme, length) {
    const readings = {
      colors: [
        {
          title: 'Rainbow Colors',
          content: 'A rainbow has many beautiful colors. We can see red, orange, yellow, green, blue, and purple. Rainbows appear after it rains when the sun comes out.',
          question: 'When do we see rainbows?',
          correctAnswer: 'After it rains when the sun comes out',
          distractors: ['Only at night', 'When it is snowing', 'During storms']
        }
      ],
      animals: [
        {
          title: 'My Pet Cat',
          content: 'I have a pet cat named Whiskers. She is orange and white. Whiskers likes to play with a ball of yarn and sleep in sunny spots. She purrs when I pet her.',
          question: 'What does Whiskers like to play with?',
          correctAnswer: 'A ball of yarn',
          distractors: ['A bone', 'A stick', 'A frisbee']
        }
      ],
      family: [
        {
          title: 'Family Dinner',
          content: 'Every Sunday, my family has dinner together. Mom cooks delicious food. Dad tells funny jokes. My sister and I help set the table. We all laugh and share stories.',
          question: 'When does the family have dinner together?',
          correctAnswer: 'Every Sunday',
          distractors: ['Every Monday', 'Every Friday', 'Every day']
        }
      ]
    };
    return readings[theme] || readings.colors;
  }

  // Speaking prompts by theme
  static getSpeakingPrompts(theme, complexity) {
    const prompts = {
      colors: [
        { text: 'Tell me about your favorite color. Why do you like it?', expectedLength: '1-2 sentences', hints: ['Think about things that are this color'] },
        { text: 'Describe what colors you see in your room right now.', expectedLength: '2-3 sentences', hints: ['Look around you'] }
      ],
      animals: [
        { text: 'If you could have any pet, what would it be and why?', expectedLength: '2-3 sentences', hints: ['Think about care, size, fun activities'] },
        { text: 'Describe your favorite animal and what it looks like.', expectedLength: '2-3 sentences', hints: ['Size, color, where it lives'] }
      ],
      family: [
        { text: 'Tell me about someone special in your family.', expectedLength: '2-3 sentences', hints: ['What do you do together?'] },
        { text: 'What is your favorite thing to do with your family?', expectedLength: '1-2 sentences', hints: ['Games, trips, activities'] }
      ]
    };
    return prompts[theme] || prompts.colors;
  }

  // Utility: Shuffle array
  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = { PlanGenerator };
