// Assessment service for handling quiz logic
class AssessmentService {
  
  // Get sample assessment questions
  static getSampleQuestions() {
    return [
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
  }

  // Calculate score and determine level from answers
  static calculateScore(answers) {
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const score = Math.round((correctAnswers / answers.length) * 100);
    const level = this.determineLevel(score);
    
    return { score, level };
  }

  // Determine level based on score
  static determineLevel(score) {
    if (score >= 0 && score <= 30) return 'A0';
    if (score >= 31 && score <= 65) return 'A1';
    if (score >= 66 && score <= 100) return 'A2-kids';
    return 'A0'; // Default fallback
  }
}

module.exports = AssessmentService;
