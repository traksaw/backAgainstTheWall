// lib/quiz/questions.ts - Optimized version
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
        points: 4
      },
      {
        id: 2,
        text: "The bigger the risk, the bigger the reward",
        question: "How do you feel about taking financial risks?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Calculated risks are necessary for growth",
        question: "How do you feel about taking financial risks?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I analyze every detail before making a decision",
        question: "How do you feel about taking financial risks?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 2,
    text: "When you have extra money, what's your first instinct?",
    options: [
      {
        id: 1,
        text: "Put it in a high-yield savings account immediately",
        question: "When you have extra money, what's your first instinct?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Look for the next hot investment opportunity",
        question: "When you have extra money, what's your first instinct?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Split it between savings and conservative investments",
        question: "When you have extra money, what's your first instinct?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Research and create an optimal allocation strategy",
        question: "When you have extra money, what's your first instinct?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 3,
    text: "How do you feel about market volatility?",
    options: [
      {
        id: 1,
        text: "It terrifies me - I prefer guaranteed returns",
        question: "How do you feel about market volatility?",
        archetype: "Avoider",
        points: 5
      },
      {
        id: 2,
        text: "It's exciting - volatility creates opportunities",
        question: "How do you feel about market volatility?",
        archetype: "Gambler",
        points: 5
      },
      {
        id: 3,
        text: "It's concerning but manageable with diversification",
        question: "How do you feel about market volatility?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "It's expected - I plan for ups and downs",
        question: "How do you feel about market volatility?",
        archetype: "Architect",
        points: 5
      }
    ]
  },
  {
    id: 4,
    text: "Your investment loses 20% in a month. What do you do?",
    options: [
      {
        id: 1,
        text: "Panic sell everything and put money in CDs",
        question: "Your investment loses 20% in a month. What do you do?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Double down - it's a buying opportunity!",
        question: "Your investment loses 20% in a month. What do you do?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Review my portfolio and make modest adjustments",
        question: "Your investment loses 20% in a month. What do you do?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Stick to my long-term strategy, this was expected",
        question: "Your investment loses 20% in a month. What do you do?",
        archetype: "Architect",
        points: 5
      }
    ]
  },
  {
    id: 5,
    text: "How much of your portfolio would you put in stocks?",
    options: [
      {
        id: 1,
        text: "0-20% - Stocks are too risky for me",
        question: "How much of your portfolio would you put in stocks?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "100%+ - I use margin to amplify gains",
        question: "How much of your portfolio would you put in stocks?",
        archetype: "Gambler",
        points: 5
      },
      {
        id: 3,
        text: "60-80% - Based on my age and risk tolerance",
        question: "How much of your portfolio would you put in stocks?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "80-100% - Historical returns speak for themselves",
        question: "How much of your portfolio would you put in stocks?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 6,
    text: "What's your biggest financial fear?",
    options: [
      {
        id: 1,
        text: "Losing money I've already saved",
        question: "What's your biggest financial fear?",
        archetype: "Avoider",
        points: 5
      },
      {
        id: 2,
        text: "Missing out on the next big opportunity",
        question: "What's your biggest financial fear?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Not having enough for retirement",
        question: "What's your biggest financial fear?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Not optimizing my investment strategy",
        question: "What's your biggest financial fear?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 7,
    text: "How do you research investments?",
    options: [
      {
        id: 1,
        text: "I stick to bank recommendations and CDs",
        question: "How do you research investments?",
        archetype: "Avoider",
        points: 3
      },
      {
        id: 2,
        text: "I follow hot tips and social media buzz",
        question: "How do you research investments?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "I research but also trust professional advisors",
        question: "How do you research investments?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I read financial statements and analyze fundamentals",
        question: "How do you research investments?",
        archetype: "Architect",
        points: 5
      }
    ]
  },
  {
    id: 8,
    text: "What describes your ideal investment timeline?",
    options: [
      {
        id: 1,
        text: "I want access to my money anytime without penalty",
        question: "What describes your ideal investment timeline?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "I'm looking for quick wins in weeks or months",
        question: "What describes your ideal investment timeline?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "I balance short-term needs with long-term goals",
        question: "What describes your ideal investment timeline?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I'm building wealth over 10-30 years methodically",
        question: "What describes your ideal investment timeline?",
        archetype: "Architect",
        points: 5
      }
    ]
  },
  {
    id: 9,
    text: "How do you handle financial stress?",
    options: [
      {
        id: 1,
        text: "I avoid investments that could cause stress",
        question: "How do you handle financial stress?",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Stress means opportunity - I lean into it",
        question: "How do you handle financial stress?",
        archetype: "Gambler",
        points: 3
      },
      {
        id: 3,
        text: "I accept some stress as part of building wealth",
        question: "How do you handle financial stress?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I prepare for stress with detailed contingency plans",
        question: "How do you handle financial stress?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 10,
    text: "What's your view on debt for investments?",
    options: [
      {
        id: 1,
        text: "Never! Debt is dangerous and should be avoided",
        question: "What's your view on debt for investments?",
        archetype: "Avoider",
        points: 5
      },
      {
        id: 2,
        text: "Leverage is a tool to amplify returns",
        question: "What's your view on debt for investments?",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Some debt is okay, like a reasonable mortgage",
        question: "What's your view on debt for investments?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Strategic debt can optimize tax-adjusted returns",
        question: "What's your view on debt for investments?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 11,
    text: "When friends ask for investment advice, you:",
    options: [
      {
        id: 1,
        text: "Tell them to stick with savings accounts and CDs",
        question: "When friends ask for investment advice, you:",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Share the latest hot stock tip you heard about",
        question: "When friends ask for investment advice, you:",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "Suggest they talk to a financial advisor for personalized advice",
        question: "When friends ask for investment advice, you:",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Recommend they start with index funds and educate themselves",
        question: "When friends ask for investment advice, you:",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 12,
    text: "Your approach to emergency funds is:",
    options: [
      {
        id: 1,
        text: "Keep 12+ months of expenses in high-yield savings",
        question: "Your approach to emergency funds is:",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Emergency funds are opportunity cost - invest everything",
        question: "Your approach to emergency funds is:",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "3-6 months expenses, depending on job security",
        question: "Your approach to emergency funds is:",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Precisely 6 months expenses, optimally allocated",
        question: "Your approach to emergency funds is:",
        archetype: "Architect",
        points: 5
      }
    ]
  },
  {
    id: 13,
    text: "How do you feel about cryptocurrency?",
    options: [
      {
        id: 1,
        text: "Too volatile and unregulated - I'll pass",
        question: "How do you feel about cryptocurrency?",
        archetype: "Avoider",
        points: 5
      },
      {
        id: 2,
        text: "The future of money - I'm all in!",
        question: "How do you feel about cryptocurrency?",
        archetype: "Gambler",
        points: 5
      },
      {
        id: 3,
        text: "I'll wait for more regulation and stability",
        question: "How do you feel about cryptocurrency?",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "Interesting technology, deserves small allocation",
        question: "How do you feel about cryptocurrency?",
        archetype: "Architect",
        points: 4
      }
    ]
  },
  {
    id: 14,
    text: "Your reaction to a 'guaranteed' 15% return investment:",
    options: [
      {
        id: 1,
        text: "If it sounds too good to be true, it probably is",
        question: "Your reaction to a 'guaranteed' 15% return investment:",
        archetype: "Avoider",
        points: 4
      },
      {
        id: 2,
        text: "Sign me up! High returns are worth the risk",
        question: "Your reaction to a 'guaranteed' 15% return investment:",
        archetype: "Gambler",
        points: 4
      },
      {
        id: 3,
        text: "I'd be skeptical but investigate with small amounts",
        question: "Your reaction to a 'guaranteed' 15% return investment:",
        archetype: "Realist",
        points: 4
      },
      {
        id: 4,
        text: "I'd research extensively and understand all risks first",
        question: "Your reaction to a 'guaranteed' 15% return investment:",
        archetype: "Architect",
        points: 5
      }
    ]
  },
  {
    id: 15,
    text: "What motivates your financial decisions most?",
    options: [
      {
        id: 1,
        text: "Security and peace of mind above all else",
        question: "What motivates your financial decisions most?",
        archetype: "Avoider",
        points: 5
      },
      {
        id: 2,
        text: "The thrill of potentially huge gains",
        question: "What motivates your financial decisions most?",
        archetype: "Gambler",
        points: 5
      },
      {
        id: 3,
        text: "Balancing growth with manageable risk",
        question: "What motivates your financial decisions most?",
        archetype: "Realist",
        points: 5
      },
      {
        id: 4,
        text: "Maximizing long-term wealth through optimization",
        question: "What motivates your financial decisions most?",
        archetype: "Architect",
        points: 5
      }
    ]
  }
];

// Validate the quiz structure when this module is loaded
console.log('🎯 Quiz Balance Validation:', validateQuizBalance(quizQuestions));

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
    console.log('✅ Quiz integrity check passed!');
    return { valid: true, issues: [] };
  } else {
    console.error('❌ Quiz integrity issues found:');
    issues.forEach(issue => console.error(issue));
    return { valid: false, issues };
  }
}