// lib/quiz/questions.ts
import { QuizQuestion, QuizOption } from '@/types/quiz';
import { validateQuizBalance } from '@/lib/quiz/utils';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    text: "How do you feel about taking financial risks?",
    options: [
      {
        id: 1,
        text: "I prefer to avoid them entirely",
        question: "How do you feel about taking financial risks?",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "The bigger the risk, the bigger the reward",
        question: "How do you feel about taking financial risks?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Calculated risks are necessary for growth",
        question: "How do you feel about taking financial risks?",
        archetype: "Realist",
        points: 3
      }
    ]
  },
  {
    id: 2,
    text: "If you had extra money to invest, what would you do?",
    options: [
      {
        id: 1,
        text: "Invest it in something with high potential returns",
        question: "If you had extra money to invest, what would you do?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 2,
        text: "Research the best balanced investment options",
        question: "If you had extra money to invest, what would you do?",
        archetype: "Realist",
        points: 3
      },
      {
        id: 3,
        text: "Create a detailed plan for how to allocate it",
        question: "If you had extra money to invest, what would you do?",
        archetype: "Architect",
        points: 3
      },
      {
        id: 4,
        text: "Put it in a high-yield savings account",
        question: "If you had extra money to invest, what would you do?",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 5,
        text: "Donate it to a cause I care about",
        question: "If you had extra money to invest, what would you do?",
        archetype: "Avoider",
        points: 3
      }
    ]
  },
  {
    id: 3,
    text: "When making a major purchase, you:",
    options: [
      {
        id: 1,
        text: "Research extensively and often decide not to buy",
        question: "When making a major purchase, you:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "Go with your gut feeling in the moment",
        question: "When making a major purchase, you:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Compare options and make a practical choice",
        question: "When making a major purchase, you:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Create a detailed cost-benefit analysis",
        question: "When making a major purchase, you:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 4,
    text: "Your ideal investment portfolio would be:",
    options: [
      {
        id: 1,
        text: "Mostly savings accounts and bonds",
        question: "Your ideal investment portfolio would be:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "High-growth stocks and cryptocurrency",
        question: "Your ideal investment portfolio would be:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "A balanced mix of stocks and bonds",
        question: "Your ideal investment portfolio would be:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Carefully diversified across multiple asset classes",
        question: "Your ideal investment portfolio would be:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 5,
    text: "How do you handle financial setbacks?",
    options: [
      {
        id: 1,
        text: "I become more cautious and conservative",
        question: "How do you handle financial setbacks?",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "I look for the next big opportunity to recover",
        question: "How do you handle financial setbacks?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "I adjust my strategy based on what I learned",
        question: "How do you handle financial setbacks?",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "I analyze what went wrong and create a recovery plan",
        question: "How do you handle financial setbacks?",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 6,
    text: "Your relationship with money is best described as:",
    options: [
      {
        id: 1,
        text: "A source of security and stability",
        question: "Your relationship with money is best described as:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "A tool for exciting opportunities",
        question: "Your relationship with money is best described as:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "A means to achieve life goals",
        question: "Your relationship with money is best described as:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "A system that requires careful management",
        question: "Your relationship with money is best described as:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 7,
    text: "When friends ask for financial advice, you:",
    options: [
      {
        id: 1,
        text: "Suggest they be very careful and conservative",
        question: "When friends ask for financial advice, you:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "Share exciting investment opportunities you've heard about",
        question: "When friends ask for financial advice, you:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Give practical, balanced suggestions",
        question: "When friends ask for financial advice, you:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Recommend they create a comprehensive financial plan",
        question: "When friends ask for financial advice, you:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 8,
    text: "Your emergency fund should be:",
    options: [
      {
        id: 1,
        text: "As large as possible for maximum security",
        question: "Your emergency fund should be:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "Minimal - money should be working for you",
        question: "Your emergency fund should be:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "3-6 months of expenses",
        question: "Your emergency fund should be:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Precisely calculated based on your risk profile",
        question: "Your emergency fund should be:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 9,
    text: "How do you research investments?",
    options: [
      {
        id: 1,
        text: "I stick to what I know is safe",
        question: "How do you research investments?",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "I follow trends and hot tips",
        question: "How do you research investments?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "I read reputable financial sources",
        question: "How do you research investments?",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "I conduct thorough fundamental analysis",
        question: "How do you research investments?",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 10,
    text: "Your biggest financial fear is:",
    options: [
      {
        id: 1,
        text: "Losing what I've already saved",
        question: "Your biggest financial fear is:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "Missing out on the next big opportunity",
        question: "Your biggest financial fear is:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Not having enough for retirement",
        question: "Your biggest financial fear is:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Making a poorly calculated decision",
        question: "Your biggest financial fear is:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 11,
    text: "When markets are volatile, you:",
    options: [
      {
        id: 1,
        text: "Move everything to safer investments",
        question: "When markets are volatile, you:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "See it as a chance to make big gains",
        question: "When markets are volatile, you:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Stay the course with your long-term plan",
        question: "When markets are volatile, you:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Rebalance based on your predetermined strategy",
        question: "When markets are volatile, you:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 12,
    text: "Your approach to retirement planning is:",
    options: [
      {
        id: 1,
        text: "Save as much as possible in safe accounts",
        question: "Your approach to retirement planning is:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "I'll figure it out when I get closer",
        question: "Your approach to retirement planning is:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Consistent contributions to a 401k and IRA",
        question: "Your approach to retirement planning is:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "A detailed plan with multiple scenarios",
        question: "Your approach to retirement planning is:",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 13,
    text: "How do you feel about debt?",
    options: [
      {
        id: 1,
        text: "I avoid it at all costs",
        question: "How do you feel about debt?",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "Good debt can accelerate wealth building",
        question: "How do you feel about debt?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Some debt is necessary, but should be managed",
        question: "How do you feel about debt?",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "I optimize debt as part of my overall strategy",
        question: "How do you feel about debt?",
        archetype: "Architect",
        points: 3
      }
    ]
  },
  {
    id: 14,
    text: "Your financial role model would be someone who:",
    options: [
      {
        id: 1,
        text: "Built wealth slowly and safely over time",
        question: "Your financial role model would be someone who:",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "Made bold moves and struck it rich",
        question: "Your financial role model would be someone who:",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "Achieved financial independence through discipline",
        question: "Your financial role model would be someone who:",
        archetype: "Realist",
        points: 3
      },
      {
        id: 4,
        text: "Mastered complex financial strategies",
        question: "Your financial role model would be someone who:",
        archetype: "Architect",
        points: 3
      }
    ]
  }
];

console.log(validateQuizBalance(quizQuestions)); // should print per-archetype totals