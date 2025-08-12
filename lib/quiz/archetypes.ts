// lib/quiz/archetypes.ts
import { ArchetypeResult, Archetype } from '@/types/quiz';

export const archetypeResults: Record<Archetype, ArchetypeResult> = {
  Avoider: {
    archetype: "Avoider",
    summary:
      "You prioritize financial security and prefer to minimize risk, even if it means missing potential opportunities.",
    strengths: ["Strong emergency fund", "Debt-free lifestyle", "Consistent saving habits"],
    blindSpots: ["May miss growth opportunities", "Inflation risk", "Over-conservative approach"],
    reflectionQuestion: "How might your desire for security be limiting your financial growth?",
    filmCharacterTieIn:
      "Like Samara at the beginning, you value safety above all else. Watch how her journey unfolds when security isn't enough.",
    exploration: {
      description:
        "As an Avoider, you excel at building financial stability but may benefit from gradually expanding your comfort zone. Your cautious nature is a strength that can be balanced with calculated growth strategies.",
      tips: [
        "Start with low-risk investments like index funds",
        "Set aside a small 'opportunity fund' for calculated risks",
        "Educate yourself about inflation and its long-term effects",
        "Consider dollar-cost averaging for gradual market exposure",
      ],
      resources: [
        "Books: 'The Bogleheads' Guide to Investing'",
        "Podcasts: 'The Investors Podcast'",
        "Tools: Personal Capital for tracking net worth",
        "Courses: Khan Academy's Personal Finance",
      ],
      nextSteps: [
        "Calculate your true risk tolerance",
        "Research low-cost index funds",
        "Set up automatic investing with small amounts",
        "Consider working with a fee-only financial advisor",
      ],
    },
  },
  Gambler: {
    archetype: "Gambler",
    summary: "You're willing to take big risks for potentially big rewards, driven by optimism and opportunity.",
    strengths: ["High growth potential", "Adaptable to opportunities", "Not paralyzed by fear"],
    blindSpots: ["Lack of diversification", "Emotional decision making", "Insufficient emergency planning"],
    reflectionQuestion: "When has your risk-taking served you well, and when has it backfired?",
    filmCharacterTieIn:
      "You share Marcus's bold approach to financial opportunities. See where his confidence leads him.",
    exploration: {
      description:
        "As a Gambler, your willingness to take risks can lead to significant rewards, but balancing this with prudent planning will help you sustain long-term success. Your optimism is an asset when channeled strategically.",
      tips: [
        "Implement the 'core and satellite' investment strategy",
        "Never invest more than you can afford to lose in high-risk ventures",
        "Build an emergency fund before taking big risks",
        "Set stop-loss limits to protect against major losses",
      ],
      resources: [
        "Books: 'A Random Walk Down Wall Street'",
        "Podcasts: 'Chat with Traders'",
        "Tools: Portfolio rebalancing calculators",
        "Communities: Bogleheads forum for balanced perspectives",
      ],
      nextSteps: [
        "Assess your current risk exposure",
        "Create a diversified 'boring' foundation portfolio",
        "Limit speculative investments to 5-10% of total portfolio",
        "Build a 6-month emergency fund before high-risk investing",
      ],
    },
  },
  Realist: {
    archetype: "Realist",
    summary: "You take a balanced, practical approach to money, understanding both risks and rewards.",
    strengths: ["Balanced portfolio", "Long-term thinking", "Practical decision making"],
    blindSpots: ["May lack conviction", "Could miss exceptional opportunities", "Sometimes too middle-ground"],
    reflectionQuestion: "How do you decide when to be more aggressive or more conservative?",
    filmCharacterTieIn:
      "Like Elena, you seek balance between security and growth. Discover what happens when balance isn't enough.",
    exploration: {
      description:
        "As a Realist, you have the advantage of seeing both sides of financial decisions. Your balanced approach serves you well, but occasionally taking a stronger stance can accelerate your progress toward financial goals.",
      tips: [
        "Use the 'barbell strategy' - safe core with targeted aggressive positions",
        "Regularly review and rebalance your portfolio",
        "Set specific triggers for when to be more aggressive or conservative",
        "Consider life-cycle investing based on your age and goals",
      ],
      resources: [
        "Books: 'The Intelligent Investor' by Benjamin Graham",
        "Podcasts: 'The Meb Faber Research Podcast'",
        "Tools: Morningstar's Portfolio X-Ray",
        "Advisors: Fee-only financial planners",
      ],
      nextSteps: [
        "Define your specific financial goals and timelines",
        "Create decision-making criteria for portfolio adjustments",
        "Consider working with a fee-only financial advisor",
        "Set up automatic rebalancing for your investments",
      ],
    },
  },
  Architect: {
    archetype: "Architect",
    summary:
      "You approach finances systematically, with detailed planning and thorough analysis guiding every decision.",
    strengths: ["Comprehensive planning", "Data-driven decisions", "Risk management"],
    blindSpots: ["Analysis paralysis", "Over-complexity", "May miss time-sensitive opportunities"],
    reflectionQuestion: "How do you balance thorough planning with the need to act quickly?",
    filmCharacterTieIn:
      "You embody David's methodical approach to building wealth. Watch what happens when the plan meets reality.",
    exploration: {
      description:
        "As an Architect, your systematic approach to finances is a significant strength. Your challenge is to balance thorough analysis with timely action, ensuring your detailed plans translate into real-world results.",
      tips: [
        "Set decision deadlines to avoid analysis paralysis",
        "Create 'good enough' criteria for investment decisions",
        "Automate routine financial tasks to focus on strategy",
        "Build flexibility into your financial plans",
      ],
      resources: [
        "Books: 'Your Money or Your Life' by Vicki Robin",
        "Software: Personal Capital, YNAB for detailed tracking",
        "Podcasts: 'The White Coat Investor'",
        "Tools: Monte Carlo simulation calculators",
      ],
      nextSteps: [
        "Simplify your investment strategy to reduce complexity",
        "Set up automated investing to reduce decision fatigue",
        "Create contingency plans for different market scenarios",
        "Schedule regular portfolio reviews with specific action items",
      ],
    },
  },
};