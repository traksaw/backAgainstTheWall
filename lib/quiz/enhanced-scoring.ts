// Analysis of your current quiz setup - let's check if it's balanced

// Current setup from your quiz questions:
// Each question has 4 options, each worth 3 points
// 15 questions total
// Each archetype gets exactly 1 option per question

// Total possible points per archetype: 15 questions × 3 points = 45 points

// This should be balanced, so the issue might be in the tie-breaking logic
// Let me create a better scoring system:

// lib/quiz/enhanced-scoring.ts
export interface QuizScoringResult {
    scores: Record<string, number>
    percentages: Record<string, number>
    winner: string
    isTie: boolean
    tiedArchetypes: string[]
    confidence: number
}

export function calculateEnhancedQuizScores(answers: Record<number, any>): QuizScoringResult {
    const scores = {
        Avoider: 0,
        Gambler: 0,
        Realist: 0,
        Architect: 0
    }

    let totalPoints = 0

    // Calculate raw scores
    Object.values(answers).forEach(answer => {
        if (answer.archetype && answer.points) {
            scores[answer.archetype as keyof typeof scores] += answer.points
            totalPoints += answer.points
        }
    })

    console.log('🎯 Raw scores:', scores)
    console.log('🎯 Total points:', totalPoints)

    // Calculate percentages
    const percentages = {
        Avoider: totalPoints > 0 ? (scores.Avoider / totalPoints) * 100 : 0,
        Gambler: totalPoints > 0 ? (scores.Gambler / totalPoints) * 100 : 0,
        Realist: totalPoints > 0 ? (scores.Realist / totalPoints) * 100 : 0,
        Architect: totalPoints > 0 ? (scores.Architect / totalPoints) * 100 : 0
    }

    console.log('🎯 Percentages:', percentages)

    // Find the highest score(s)
    const sortedEntries = Object.entries(scores).sort(([, a], [, b]) => b - a)
    const highestScore = sortedEntries[0][1]
    const tiedArchetypes = sortedEntries.filter(([, score]) => score === highestScore).map(([archetype]) => archetype)

    console.log('🎯 Sorted scores:', sortedEntries)
    console.log('🎯 Highest score:', highestScore)
    console.log('🎯 Tied archetypes:', tiedArchetypes)

    type Archetype = 'Avoider' | 'Gambler' | 'Realist' | 'Architect'
    let winner: Archetype
    let isTie = tiedArchetypes.length > 1

    if (isTie) {
        console.log('🎯 TIE DETECTED - using tie-breaking logic')

        // Advanced tie-breaking logic
        // 1. If there's a tie, prefer the archetype with more recent selections
        // 2. Add some randomness to prevent always getting the same result
        // 3. Consider the "confidence" of the selection

        const recentAnswers = Object.values(answers).slice(-5) // Last 5 answers
        const recentScores = { Avoider: 0, Gambler: 0, Realist: 0, Architect: 0 }

        recentAnswers.forEach(answer => {
            if (answer.archetype && tiedArchetypes.includes(answer.archetype)) {
                recentScores[answer.archetype as keyof typeof recentScores]++
            }
        })

        console.log('🎯 Recent answer bias:', recentScores)

        // Find which tied archetype has more recent selections
        const recentWinner = Object.entries(recentScores)
            .filter(([archetype]) => tiedArchetypes.includes(archetype))
            .sort(([, a], [, b]) => b - a)[0]

        if (recentWinner && recentWinner[1] > 0) {
            winner = recentWinner[0] as Archetype
            console.log('🎯 Tie broken by recent answers:', winner)
        } else {
            // If still tied, add controlled randomness based on archetype distribution
            const tieBreakingWeights = {
                Avoider: 1.0,
                Gambler: 1.1,   // Slightly favor risk-takers
                Realist: 1.2,   // Favor balanced approach
                Architect: 1.15  // Favor planners
            }

            const weightedScores = tiedArchetypes.map(archetype => ({
                archetype,
                weightedScore: scores[archetype as keyof typeof scores] * tieBreakingWeights[archetype as keyof typeof tieBreakingWeights] * (0.95 + Math.random() * 0.1)
            }))

            winner = weightedScores.sort((a, b) => b.weightedScore - a.weightedScore)[0].archetype as Archetype
            console.log('🎯 Tie broken by weighted randomness:', winner)
        }
    } else {
        winner = tiedArchetypes[0] as Archetype
        console.log('🎯 Clear winner:', winner)
    }

    const winnerScore = scores[winner as keyof typeof scores]
    const otherScores = Object.values(scores).filter(score => score !== winnerScore)
    const avgOtherScore = otherScores.length > 0 ? otherScores.reduce((a, b) => a + b, 0) / otherScores.length : 0
    const confidence = totalPoints > 0 ? Math.min(100, ((winnerScore - avgOtherScore) / totalPoints) * 100 + 50) : 50

    console.log('🎯 Final winner:', winner, 'with confidence:', confidence)

    return {
        scores,
        percentages,
        winner,
        isTie,
        tiedArchetypes,
        confidence: Math.round(confidence)
    }
}

// Enhanced quiz questions with more variety
export const enhancedQuizQuestions = [
    // Keep your existing questions but add some variation in points
    {
        id: 1,
        question: "When you receive unexpected money, what's your first instinct?",
        options: [
            { id: 1, text: "Save it immediately for emergencies", archetype: "Avoider", points: 4 }, // Higher certainty
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
            { id: 2, text: "The bigger the risk, the bigger the reward", archetype: "Gambler", points: 4 }, // Higher certainty
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
            { id: 3, text: "I track expenses but allow for flexibility", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "I have detailed spreadsheets for everything", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 4,
        question: "When making a major purchase, you:",
        options: [
            { id: 1, text: "Research extensively and often decide not to buy", archetype: "Avoider", points: 3 },
            { id: 2, text: "Go with your gut feeling in the moment", archetype: "Gambler", points: 3 },
            { id: 3, text: "Compare options and make a practical choice", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "Create a detailed cost-benefit analysis", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 5,
        question: "Your ideal investment portfolio would be:",
        options: [
            { id: 1, text: "Mostly savings accounts and bonds", archetype: "Avoider", points: 3 },
            { id: 2, text: "High-growth stocks and cryptocurrency", archetype: "Gambler", points: 4 }, // Higher certainty
            { id: 3, text: "A balanced mix of stocks and bonds", archetype: "Realist", points: 3 },
            { id: 4, text: "Carefully diversified across multiple asset classes", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 6,
        question: "How do you handle financial setbacks?",
        options: [
            { id: 1, text: "I become more cautious and conservative", archetype: "Avoider", points: 3 },
            { id: 2, text: "I look for the next big opportunity to recover", archetype: "Gambler", points: 4 }, // Higher certainty
            { id: 3, text: "I analyze what went wrong and adjust my strategy", archetype: "Realist", points: 3 },
            { id: 4, text: "I stick to my long-term plan regardless of setbacks", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 7,
        question: "Your relationship with money is best described as:",
        options: [
            { id: 1, text: "A source of security and stability", archetype: "Avoider", points: 4 }, // Higher certainty
            { id: 2, text: "A tool for exciting opportunities", archetype: "Gambler", points: 3 },
            { id: 3, text: "A means to achieve life goals", archetype: "Realist", points: 3 },
            { id: 4, text: "A system that requires careful management", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 8,
        question: "When faced with a financial decision, you:",
        options: [
            { id: 1, text: "Avoid making a decision until absolutely necessary", archetype: "Avoider", points: 3 },
            { id: 2, text: "Make quick decisions based on intuition", archetype: "Gambler", points: 3 },
            { id: 3, text: "Weigh pros and cons before deciding", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "Follow a structured decision-making process", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 9,
        question: "Your emergency fund should be:",
        options: [
            { id: 1, text: "As large as possible for maximum security", archetype: "Avoider", points: 3 },
            { id: 2, text: "Minimal - money should be working for you", archetype: "Gambler", points: 3 },
            { id: 3, text: "Enough to cover 3-6 months of expenses", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "Part of a comprehensive financial plan", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 10,
        question: "When friends ask for financial advice, you:",
        options: [
            { id: 1, text: "Suggest they be very careful and conservative", archetype: "Avoider", points: 3 },
            { id: 2, text: "Share exciting investment opportunities you've heard about", archetype: "Gambler", points: 3 },
            { id: 3, text: "Give practical, balanced suggestions", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "Recommend they create a comprehensive financial plan", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 11,
        question: "How do you research investments?",
        options: [
            { id: 1, text: "I stick to what I know is safe", archetype: "Avoider", points: 3 },
            { id: 2, text: "I follow trends and hot tips", archetype: "Gambler", points: 3 },
            { id: 3, text: "I read reputable financial sources", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "I conduct thorough fundamental analysis", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 12,
        question: "Your biggest financial fear is:",
        options: [
            { id: 1, text: "Losing what I've already saved", archetype: "Avoider", points: 3 },
            { id: 2, text: "Missing out on the next big opportunity", archetype: "Gambler", points: 3 },
            { id: 3, text: "Not having enough for retirement", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "Making a poorly calculated decision", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 13,
        question: "When markets are volatile, you:",
        options: [
            { id: 1, text: "Move everything to safer investments", archetype: "Avoider", points: 3 },
            { id: 2, text: "See it as a chance to make big gains", archetype: "Gambler", points: 4 }, // Higher certainty
            { id: 3, text: "Stay the course with your long-term plan", archetype: "Realist", points: 3 },
            { id: 4, text: "Rebalance based on your predetermined strategy", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 14,
        question: "Your approach to retirement planning is:",
        options: [
            { id: 1, text: "I don't think about it much", archetype: "Avoider", points: 3 },
            { id: 2, text: "I plan to enjoy life now and worry about retirement later", archetype: "Gambler", points: 3 },
            { id: 3, text: "I have a solid plan in place", archetype: "Realist", points: 4 }, // Higher certainty
            { id: 4, text: "I have a detailed strategy that I review regularly", archetype: "Architect", points: 3 },
        ],
    },
    {
        id: 15,
        question: "How do you feel about debt?",
        options: [
            { id: 1, text: "I avoid it at all costs", archetype: "Avoider", points: 3 },
            { id: 2, text: "I use it strategically to leverage investments", archetype: "Gambler", points: 4 }, // Higher certainty
            { id: 3, text: "I manage it carefully and pay it off regularly", archetype: "Realist", points: 3 },
            { id: 4, text: "I have a detailed debt repayment plan", archetype: "Architect", points: 3 },
        ],
    },
    // Add more strategic questions that help differentiate
    {
        id: 16, // New question
        question: "In a financial crisis, your first reaction is to:",
        options: [
            { id: 1, text: "Panic and move everything to the safest option possible", archetype: "Avoider", points: 4 },
            { id: 2, text: "See it as an opportunity to buy low", archetype: "Gambler", points: 3 },
            { id: 3, text: "Review your portfolio and make measured adjustments", archetype: "Realist", points: 4 },
            { id: 4, text: "Execute your pre-planned crisis response strategy", archetype: "Architect", points: 4 },
        ],
    },
    {
        id: 17, // New question
        question: "Your approach to cryptocurrency is:",
        options: [
            { id: 1, text: "Too risky and volatile for me", archetype: "Avoider", points: 3 },
            { id: 2, text: "The future of money - I'm all in", archetype: "Gambler", points: 4 },
            { id: 3, text: "A small allocation makes sense in a diversified portfolio", archetype: "Realist", points: 4 },
            { id: 4, text: "I'll wait until the technology and regulations mature", archetype: "Architect", points: 3 },
        ],
    }
    // Continue with your existing questions...
]

// Update the scoring function in your quiz logic
export function improvedCalculateQuizScores(answers: Record<number, any>) {
    const result = calculateEnhancedQuizScores(answers)

    // Log detailed results for debugging
    console.log('🎯 QUIZ SCORING COMPLETE:', {
        winner: result.winner,
        scores: result.scores,
        percentages: result.percentages,
        isTie: result.isTie,
        confidence: result.confidence
    })

    return {
        [result.winner]: result.scores[result.winner],
        // Return all scores for debugging
        ...result.scores
    }
}

// Helper function to detect if quiz is giving same results
export function analyzeQuizBias(quizResults: any[]) {
    const archetypeCounts: Record<string, number> = quizResults.reduce((acc: Record<string, number>, result) => {
        acc[result.archetype] = (acc[result.archetype] || 0) + 1
        return acc
    }, {})

    console.log('🎯 Quiz Result Distribution:', archetypeCounts)

    const totalResults = quizResults.length
    const expectedPerArchetype = totalResults / 4

    const bias = Object.entries(archetypeCounts).map(([archetype, count]) => ({
        archetype,
        count,
        percentage: (count / totalResults) * 100,
        bias: count - expectedPerArchetype
    }))

    console.log('🎯 Bias Analysis:', bias)

    return bias
}