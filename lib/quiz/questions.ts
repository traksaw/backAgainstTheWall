// lib/quiz/questions.ts
import { QuizQuestion } from '@/types/quiz';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "When you receive unexpected money, what's your first instinct?",
    options: [
      { id: 1, text: "Save it immediately for emergencies", archetype: "Avoider", points: 3 },
      { id: 2, text: "Invest it in something with high potential returns", archetype: "Gambler", points: 3 },
      { id: 3, text: "Research the best balanced investment options", archetype: "Realist", points: 3 },
      { id: 4, text: "Create a detailed plan for how to allocate it", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 2,
    question: "How do you feel about taking financial risks?",
    options: [
      { id: 1, text: "I prefer to avoid them entirely", archetype: "Avoider", points: 3 },
      { id: 2, text: "The bigger the risk, the bigger the reward", archetype: "Gambler", points: 3 },
      { id: 3, text: "Calculated risks are necessary for growth", archetype: "Realist", points: 3 },
      { id: 4, text: "I analyze every risk thoroughly before deciding", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 3,
    question: "What's your approach to budgeting?",
    options: [
      { id: 1, text: "I keep things simple and spend conservatively", archetype: "Avoider", points: 3 },
      { id: 2, text: "Budgets are too restrictive for my lifestyle", archetype: "Gambler", points: 3 },
      { id: 3, text: "I track expenses but allow for flexibility", archetype: "Realist", points: 3 },
      { id: 4, text: "I have detailed spreadsheets for everything", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 4,
    question: "When making a major purchase, you:",
    options: [
      { id: 1, text: "Research extensively and often decide not to buy", archetype: "Avoider", points: 3 },
      { id: 2, text: "Go with your gut feeling in the moment", archetype: "Gambler", points: 3 },
      { id: 3, text: "Compare options and make a practical choice", archetype: "Realist", points: 3 },
      { id: 4, text: "Create a detailed cost-benefit analysis", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 5,
    question: "Your ideal investment portfolio would be:",
    options: [
      { id: 1, text: "Mostly savings accounts and bonds", archetype: "Avoider", points: 3 },
      { id: 2, text: "High-growth stocks and cryptocurrency", archetype: "Gambler", points: 3 },
      { id: 3, text: "A balanced mix of stocks and bonds", archetype: "Realist", points: 3 },
      { id: 4, text: "Carefully diversified across multiple asset classes", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 6,
    question: "How do you handle financial setbacks?",
    options: [
      { id: 1, text: "I become more cautious and conservative", archetype: "Avoider", points: 3 },
      { id: 2, text: "I look for the next big opportunity to recover", archetype: "Gambler", points: 3 },
      { id: 3, text: "I adjust my strategy based on what I learned", archetype: "Realist", points: 3 },
      { id: 4, text: "I analyze what went wrong and create a recovery plan", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 7,
    question: "Your relationship with money is best described as:",
    options: [
      { id: 1, text: "A source of security and stability", archetype: "Avoider", points: 3 },
      { id: 2, text: "A tool for exciting opportunities", archetype: "Gambler", points: 3 },
      { id: 3, text: "A means to achieve life goals", archetype: "Realist", points: 3 },
      { id: 4, text: "A system that requires careful management", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 8,
    question: "When friends ask for financial advice, you:",
    options: [
      { id: 1, text: "Suggest they be very careful and conservative", archetype: "Avoider", points: 3 },
      { id: 2, text: "Share exciting investment opportunities you've heard about", archetype: "Gambler", points: 3 },
      { id: 3, text: "Give practical, balanced suggestions", archetype: "Realist", points: 3 },
      { id: 4, text: "Recommend they create a comprehensive financial plan", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 9,
    question: "Your emergency fund should be:",
    options: [
      { id: 1, text: "As large as possible for maximum security", archetype: "Avoider", points: 3 },
      { id: 2, text: "Minimal - money should be working for you", archetype: "Gambler", points: 3 },
      { id: 3, text: "3-6 months of expenses", archetype: "Realist", points: 3 },
      { id: 4, text: "Precisely calculated based on your risk profile", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 10,
    question: "How do you research investments?",
    options: [
      { id: 1, text: "I stick to what I know is safe", archetype: "Avoider", points: 3 },
      { id: 2, text: "I follow trends and hot tips", archetype: "Gambler", points: 3 },
      { id: 3, text: "I read reputable financial sources", archetype: "Realist", points: 3 },
      { id: 4, text: "I conduct thorough fundamental analysis", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 11,
    question: "Your biggest financial fear is:",
    options: [
      { id: 1, text: "Losing what I've already saved", archetype: "Avoider", points: 3 },
      { id: 2, text: "Missing out on the next big opportunity", archetype: "Gambler", points: 3 },
      { id: 3, text: "Not having enough for retirement", archetype: "Realist", points: 3 },
      { id: 4, text: "Making a poorly calculated decision", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 12,
    question: "When markets are volatile, you:",
    options: [
      { id: 1, text: "Move everything to safer investments", archetype: "Avoider", points: 3 },
      { id: 2, text: "See it as a chance to make big gains", archetype: "Gambler", points: 3 },
      { id: 3, text: "Stay the course with your long-term plan", archetype: "Realist", points: 3 },
      { id: 4, text: "Rebalance based on your predetermined strategy", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 13,
    question: "Your approach to retirement planning is:",
    options: [
      { id: 1, text: "Save as much as possible in safe accounts", archetype: "Avoider", points: 3 },
      { id: 2, text: "I'll figure it out when I get closer", archetype: "Gambler", points: 3 },
      { id: 3, text: "Consistent contributions to a 401k and IRA", archetype: "Realist", points: 3 },
      { id: 4, text: "A detailed plan with multiple scenarios", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 14,
    question: "How do you feel about debt?",
    options: [
      { id: 1, text: "I avoid it at all costs", archetype: "Avoider", points: 3 },
      { id: 2, text: "Good debt can accelerate wealth building", archetype: "Gambler", points: 3 },
      { id: 3, text: "Some debt is necessary, but should be managed", archetype: "Realist", points: 3 },
      { id: 4, text: "I optimize debt as part of my overall strategy", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 15,
    question: "Your financial role model would be someone who:",
    options: [
      { id: 1, text: "Built wealth slowly and safely over time", archetype: "Avoider", points: 3 },
      { id: 2, text: "Made bold moves and struck it rich", archetype: "Gambler", points: 3 },
      { id: 3, text: "Achieved financial independence through discipline", archetype: "Realist", points: 3 },
      { id: 4, text: "Mastered complex financial strategies", archetype: "Architect", points: 3 },
    ],
  },
];