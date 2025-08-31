// lib/quiz/questions.ts - Optimized version
import { QuizQuestion, QuizOption } from '@/types/quiz';
import { validateQuizBalance } from '@/lib/quiz/utils';

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    text: "When you get paid, what do you do first?",
    options: [
      {
        id: 1,
        text: "Panic about bills, then avoid checking your account",
        question: "When you get paid, what do you do first?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Make a wishlist of things to buy",
        question: "When you get paid, what do you do first?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Set aside money for rent and essentials, then see what’s left",
        question: "When you get paid, what do you do first?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Allocate money into savings/investments automatically",
        question: "When you get paid, what do you do first?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 2,
    text: "How do you decide if you can “afford” something?",
    options: [
      {
        id: 1,
        text: "If I don’t look, I can’t feel guilty",
        question: "How do you decide if you can “afford” something?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "If I want it, I’ll figure it out later",
        question: "How do you decide if you can “afford” something?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "If I can pay for it and still meet my other needs",
        question: "How do you decide if you can “afford” something?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "If it fits into my budgeted category this month",
        question: "How do you decide if you can “afford” something?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 3,
    text: "What’s your biggest financial fear?",
    options: [
      {
        id: 1,
        text: "Opening my bank app",
        question: "What’s your biggest financial fear?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Having to say “no” to fun",
        question: "What’s your biggest financial fear?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Getting stuck in debt I can’t get out of",
        question: "What’s your biggest financial fear?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Missing an opportunity because I wasn’t prepared",
        question: "What’s your biggest financial fear?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 4,
    text: "What’s your relationship with credit cards?",
    options: [
      {
        id: 1,
        text: "I maxed one out and stopped looking at it",
        question: "What’s your relationship with credit cards?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "It’s how I fund my lifestyle for now",
        question: "What’s your relationship with credit cards?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "I use it for emergencies and small purchases only",
        question: "What’s your relationship with credit cards?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I use it for points and pay in full every month",
        question: "What’s your relationship with credit cards?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 5,
    text: "You have to pay $150 for something unexpected this week. What happens?",
    options: [
      {
        id: 1,
        text: "I freak out, maybe delay rent or skip groceries",
        question: "You have to pay $150 for something unexpected this week. What happens?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "I swipe and worry later",
        question: "You have to pay $150 for something unexpected this week. What happens?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "I shift around my priorities, cancel plans if needed",
        question: "You have to pay $150 for something unexpected this week. What happens?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I already had an “unexpected” budget category for this",
        question: "You have to pay $150 for something unexpected this week. What happens?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 6,
    text: "How do you feel when friends talk about money?",
    options: [
      {
        id: 1,
        text: "Embarrassed — I feel behind",
        question: "How do you feel when friends talk about money?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Defensive — I say “YOLO” and change the subject",
        question: "How do you feel when friends talk about money?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Curious — I like hearing how others manage",
        question: "How do you feel when friends talk about money?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Confident — I often give tips",
        question: "How do you feel when friends talk about money?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 7,
    text: "What’s your strategy around student loans or debt?",
    options: [
      {
        id: 1,
        text: "Hope it sorts itself out",
        question: "What’s your strategy around student loans or debt?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "I don’t worry unless I get a collections call",
        question: "What’s your strategy around student loans or debt?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "I make payments and track how long I have",
        question: "What’s your strategy around student loans or debt?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I have a payoff timeline and know the interest rates",
        question: "What’s your strategy around student loans or debt?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 8,
    text: "Your checking account hits $50. What do you do?",
    options: [
      {
        id: 1,
        text: "Ignore it and wait until payday",
        question: "Your checking account hits $50. What do you do?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Still go out that night — I’ll figure it out",
        question: "Your checking account hits $50. What do you do?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Delay plans and tighten spending",
        question: "Your checking account hits $50. What do you do?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Move money from savings if needed, with a note to rebalance",
        question: "Your checking account hits $50. What do you do?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 9,
    text: "What’s your approach to rent and bills with roommates/partners?",
    options: [
      {
        id: 1,
        text: "I sometimes forget and scramble to pay",
        question: "What’s your approach to rent and bills with roommates/partners?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "They usually remind me",
        question: "What’s your approach to rent and bills with roommates/partners?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "I track due dates and communicate openly",
        question: "What’s your approach to rent and bills with roommates/partners?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I build systems (split apps, auto-reminders) so it’s seamless",
        question: "What’s your approach to rent and bills with roommates/partners?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 10,
    text: "When you imagine your future, financially, you:",
    options: [
      {
        id: 1,
        text: "Can’t think that far ahead",
        question: "When you imagine your future, financially, you:",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Think it’ll work out — somehow",
        question: "When you imagine your future, financially, you:",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Want stability and freedom",
        question: "When you imagine your future, financially, you:",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Envision building wealth and options",
        question: "When you imagine your future, financially, you:",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 11,
    text: "If you had to survive for one month on $100, what’s your plan?",
    options: [
      {
        id: 1,
        text: "Freeze up and hope someone helps",
        question: "If you had to survive for one month on $100, what’s your plan?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Spend it fast and worry later",
        question: "If you had to survive for one month on $100, what’s your plan?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Plan meals, cut expenses, and budget tightly",
        question: "If you had to survive for one month on $100, what’s your plan?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Source side gigs, negotiate, and make it stretch",
        question: "If you had to survive for one month on $100, what’s your plan?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 12,
    text: "How do you feel when you compare your finances to others?",
    options: [
      {
        id: 1,
        text: "Ashamed and hopeless",
        question: "How do you feel when you compare your finances to others?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Motivated to fake it ‘til I make it",
        question: "How do you feel when you compare your finances to others?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Inspired to get better",
        question: "How do you feel when you compare your finances to others?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Proud of my progress and staying in my lane",
        question: "How do you feel when you compare your finances to others?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 13,
    text: "You get a job offer. What matters most?",
    options: [
      {
        id: 1,
        text: "Just having income",
        question: "You get a job offer. What matters most?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "The salary headline",
        question: "You get a job offer. What matters most?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "The full benefits and job security",
        question: "You get a job offer. What matters most?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Growth potential, healthcare, and retirement match",
        question: "You get a job offer. What matters most?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 14,
    text: "Do you know how much money you spent last month?",
    options: [
      {
        id: 1,
        text: "No, I don’t want to know",
        question: "Do you know how much money you spent last month?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Rough estimate, but I don’t track",
        question: "Do you know how much money you spent last month?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Yes, I check in monthly",
        question: "Do you know how much money you spent last month?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Yes, and I have categories for each type of expense",
        question: "Do you know how much money you spent last month?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 15,
    text: "Which of these quotes speaks to you the most?",
    options: [
      {
        id: 1,
        text: "“If I ignore it, maybe it’ll go away.”",
        question: "Which of these quotes speaks to you the most?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "“Money comes, money goes. Life’s short.”",
        question: "Which of these quotes speaks to you the most?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "“You have to spend wisely to live freely.”",
        question: "Which of these quotes speaks to you the most?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "“Build now so you don’t scramble later.”",
        question: "Which of these quotes speaks to you the most?",
        archetype: "Architect",
        points: 4
      }
    ]
  }
];

// Validate the quiz structure when this module is loaded
validateQuizBalance(quizQuestions);

// Export function to check quiz integrity
export function validateQuizIntegrity() {
  const issues: string[] = [];
  
  quizQuestions.forEach((question, qIndex) => {
    // Check question structure
    if (!question.id || !question.text || !question.options) {
      issues.push(`❌ Question ${qIndex + 1}: Missing required fields`);
    }
    
    if (question.options.length !== 4) {
      issues.push(`❌ Question ${qIndex + 1}: Should have exactly 4 options`);
    }
    
    // Check each option
    question.options.forEach((option, oIndex) => {
      if (!option.text || !option.archetype || !option.points) {
        issues.push(`❌ Q${qIndex + 1}, Option ${oIndex + 1}: Missing text, archetype, or points`);
      }
      
      if (!['Avoider', 'Gambler', 'Realist', 'Architect'].includes(option.archetype)) {
        issues.push(`❌ Q${qIndex + 1}, Option ${oIndex + 1}: Invalid archetype: ${option.archetype}`);
      }
      
      if (typeof option.points !== 'number' || option.points < 1 || option.points > 5) {
        issues.push(`❌ Q${qIndex + 1}, Option ${oIndex + 1}: Points should be 1-5, got: ${option.points}`);
      }
    });
  });
  
  if (issues.length === 0) {
    return { valid: true, issues: [] };
  } else {
    issues.forEach(issue => console.error(issue));
    return { valid: false, issues };
  }
}