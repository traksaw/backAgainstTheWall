"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth, AuthProvider } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuiz"
import { SignUpModal } from "@/components/auth/SignUpModal"
import { SignInModal } from "@/components/auth/SignInModal"
import { VideoPlayer } from "@/components/VideoPlayer"
import { QuizHistorySection } from "@/components/QuizHistorySection"
import {
  Play,
  ArrowRight,
  Award,
  Instagram,
  Twitter,
  Facebook,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Shield,
  Target,
  Eye,
  CheckCircle,
  Brain,
  LogOut,
  User,
  BarChart3,
} from "lucide-react"

// Quiz Types and Data
interface QuizQuestion {
  id: number
  question: string
  options: {
    text: string
    archetype: "Avoider" | "Gambler" | "Realist" | "Architect"
    points: number
  }[]
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "When you receive unexpected money, what's your first instinct?",
    options: [
      { text: "Save it immediately for emergencies", archetype: "Avoider", points: 3 },
      { text: "Invest it in something with high potential returns", archetype: "Gambler", points: 3 },
      { text: "Research the best balanced investment options", archetype: "Realist", points: 3 },
      { text: "Create a detailed plan for how to allocate it", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 2,
    question: "How do you feel about taking financial risks?",
    options: [
      { text: "I prefer to avoid them entirely", archetype: "Avoider", points: 3 },
      { text: "The bigger the risk, the bigger the reward", archetype: "Gambler", points: 3 },
      { text: "Calculated risks are necessary for growth", archetype: "Realist", points: 3 },
      { text: "I analyze every risk thoroughly before deciding", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 3,
    question: "What's your approach to budgeting?",
    options: [
      { text: "I keep things simple and spend conservatively", archetype: "Avoider", points: 3 },
      { text: "Budgets are too restrictive for my lifestyle", archetype: "Gambler", points: 3 },
      { text: "I track expenses but allow for flexibility", archetype: "Realist", points: 3 },
      { text: "I have detailed spreadsheets for everything", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 4,
    question: "When making a major purchase, you:",
    options: [
      { text: "Research extensively and often decide not to buy", archetype: "Avoider", points: 3 },
      { text: "Go with your gut feeling in the moment", archetype: "Gambler", points: 3 },
      { text: "Compare options and make a practical choice", archetype: "Realist", points: 3 },
      { text: "Create a detailed cost-benefit analysis", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 5,
    question: "Your ideal investment portfolio would be:",
    options: [
      { text: "Mostly savings accounts and bonds", archetype: "Avoider", points: 3 },
      { text: "High-growth stocks and cryptocurrency", archetype: "Gambler", points: 3 },
      { text: "A balanced mix of stocks and bonds", archetype: "Realist", points: 3 },
      { text: "Carefully diversified across multiple asset classes", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 6,
    question: "How do you handle financial setbacks?",
    options: [
      { text: "I become more cautious and conservative", archetype: "Avoider", points: 3 },
      { text: "I look for the next big opportunity to recover", archetype: "Gambler", points: 3 },
      { text: "I adjust my strategy based on what I learned", archetype: "Realist", points: 3 },
      { text: "I analyze what went wrong and create a recovery plan", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 7,
    question: "Your relationship with money is best described as:",
    options: [
      { text: "A source of security and stability", archetype: "Avoider", points: 3 },
      { text: "A tool for exciting opportunities", archetype: "Gambler", points: 3 },
      { text: "A means to achieve life goals", archetype: "Realist", points: 3 },
      { text: "A system that requires careful management", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 8,
    question: "When friends ask for financial advice, you:",
    options: [
      { text: "Suggest they be very careful and conservative", archetype: "Avoider", points: 3 },
      { text: "Share exciting investment opportunities you've heard about", archetype: "Gambler", points: 3 },
      { text: "Give practical, balanced suggestions", archetype: "Realist", points: 3 },
      { text: "Recommend they create a comprehensive financial plan", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 9,
    question: "Your emergency fund should be:",
    options: [
      { text: "As large as possible for maximum security", archetype: "Avoider", points: 3 },
      { text: "Minimal - money should be working for you", archetype: "Gambler", points: 3 },
      { text: "3-6 months of expenses", archetype: "Realist", points: 3 },
      { text: "Precisely calculated based on your risk profile", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 10,
    question: "How do you research investments?",
    options: [
      { text: "I stick to what I know is safe", archetype: "Avoider", points: 3 },
      { text: "I follow trends and hot tips", archetype: "Gambler", points: 3 },
      { text: "I read reputable financial sources", archetype: "Realist", points: 3 },
      { text: "I conduct thorough fundamental analysis", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 11,
    question: "Your biggest financial fear is:",
    options: [
      { text: "Losing what I've already saved", archetype: "Avoider", points: 3 },
      { text: "Missing out on the next big opportunity", archetype: "Gambler", points: 3 },
      { text: "Not having enough for retirement", archetype: "Realist", points: 3 },
      { text: "Making a poorly calculated decision", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 12,
    question: "When markets are volatile, you:",
    options: [
      { text: "Move everything to safer investments", archetype: "Avoider", points: 3 },
      { text: "See it as a chance to make big gains", archetype: "Gambler", points: 3 },
      { text: "Stay the course with your long-term plan", archetype: "Realist", points: 3 },
      { text: "Rebalance based on your predetermined strategy", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 13,
    question: "Your approach to retirement planning is:",
    options: [
      { text: "Save as much as possible in safe accounts", archetype: "Avoider", points: 3 },
      { text: "I'll figure it out when I get closer", archetype: "Gambler", points: 3 },
      { text: "Consistent contributions to a 401k and IRA", archetype: "Realist", points: 3 },
      { text: "A detailed plan with multiple scenarios", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 14,
    question: "How do you feel about debt?",
    options: [
      { text: "I avoid it at all costs", archetype: "Avoider", points: 3 },
      { text: "Good debt can accelerate wealth building", archetype: "Gambler", points: 3 },
      { text: "Some debt is necessary, but should be managed", archetype: "Realist", points: 3 },
      { text: "I optimize debt as part of my overall strategy", archetype: "Architect", points: 3 },
    ],
  },
  {
    id: 15,
    question: "Your financial role model would be someone who:",
    options: [
      { text: "Built wealth slowly and safely over time", archetype: "Avoider", points: 3 },
      { text: "Made bold moves and struck it rich", archetype: "Gambler", points: 3 },
      { text: "Achieved financial independence through discipline", archetype: "Realist", points: 3 },
      { text: "Mastered complex financial strategies", archetype: "Architect", points: 3 },
    ],
  },
]

const archetypeResults = {
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
}

// This component now uses the auth context properly
function FilmWebsiteContent() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const { latestResult, submitQuiz, updateQuizResult, loading: quizLoading } = useQuiz()

  const [showSignup, setShowSignup] = useState(false)
  const [showSignin, setShowSignin] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [showFilm, setShowFilm] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({})
  const [expandedCreator, setExpandedCreator] = useState<number | null>(null)
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [showQuizHistory, setShowQuizHistory] = useState(false)

  // Shuffle questions on component mount
  useEffect(() => {
    const shuffled = [...quizQuestions].sort(() => Math.random() - 0.5)
    setShuffledQuestions(shuffled)
  }, [])

  const startQuiz = () => {
    setShowWelcome(false)
    setCurrentQuestion(0)
    setQuizAnswers({})
  }

  const handleQuizAnswer = (answer: any) => {
    // Add question text to the answer for better history display
    const enhancedAnswer = {
      ...answer,
      question: shuffledQuestions[currentQuestion]?.question,
    }

    const newAnswers = { ...quizAnswers, [currentQuestion]: enhancedAnswer }
    setQuizAnswers(newAnswers)

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleQuizComplete(newAnswers)
    }
  }

  const handleQuizComplete = async (answers: Record<number, any>) => {
    try {
      const sessionId = Math.random().toString(36).substr(2, 9)
      await submitQuiz(answers, sessionId)
      setShowQuiz(false)
      setShowResults(true)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      // Handle error appropriately
    }
  }

  const handleResultsViewed = async () => {
    if (latestResult && !latestResult.has_viewed_results) {
      try {
        await updateQuizResult(latestResult.id, { has_viewed_results: true })
      } catch (error) {
        console.error("Error updating results viewed:", error)
      }
    }
    setShowResults(false)
    setShowFilm(true)
  }

  const handleFilmComplete = async () => {
    if (latestResult && !latestResult.has_watched_film) {
      try {
        await updateQuizResult(latestResult.id, { has_watched_film: true })
      } catch (error) {
        console.error("Error updating film watched:", error)
      }
    }
    setShowFilm(false)
  }

  const handleVideoError = (error: string) => {
    console.error("Video playback error:", error)
    // Could show a toast notification or other user feedback here
  }

  const getArchetypeIcon = (archetype: string) => {
    switch (archetype) {
      case "Avoider":
        return Shield
      case "Gambler":
        return TrendingUp
      case "Realist":
        return Target
      case "Architect":
        return Eye
      default:
        return Award
    }
  }

  const getNextStep = () => {
    if (!user) return "Sign up to begin your journey"
    if (!latestResult) return "Take the quiz to discover your financial archetype"
    if (!latestResult.has_viewed_results) return "Explore your results"
    if (!latestResult.has_watched_film) return "Watch the film through your archetype lens"
    return "Journey complete! Explore your results anytime"
  }

  const creators = [
    {
      name: "Jenna Lam",
      role: "Producer & Director",
      bio: "Award-winning filmmaker with a passion for stories that explore human psychology and social issues.",
      expandedBio:
        "Jenna brings over a decade of experience in independent filmmaking, with previous work showcased at Sundance and SXSW. Her storytelling is rooted in truth, vulnerability, and cultural nuance.",
      image: "/jenna.jpeg",
    },
    {
      name: "Waskar Paulino",
      role: "Software Engineer",
      bio: "Engineer focused on creative, accessible, and community-first software solutions.",
      expandedBio:
        "Waskar built the interactive experience powering the quiz and results system. He blends storytelling and technology to create tools that feel personal and empowering—especially for communities historically left out of the conversation.",
      image: "/waskar.jpeg",
    },
    {
      name: "Jason Arceo",
      role: "UX/UI Designer",
      bio: "Designer crafting intentional and intuitive user experiences that amplify storytelling.",
      expandedBio:
        "Jason led the interface design for this project, creating a seamless journey from quiz to reflection. His work centers emotion, clarity, and thoughtful interaction design that serves both story and audience.",
      image: "/jason.jpeg",
    },
  ]

  const sponsors = [
    { name: "AAPI Foundation", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Independent Film Grant", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Community Arts Council", logo: "/placeholder.svg?height=60&width=120" },
    { name: "Financial Literacy Initiative", logo: "/placeholder.svg?height=60&width=120" },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B95D38] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* User Menu */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center space-x-4 bg-white rounded-full shadow-lg px-4 py-2 border">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {profile?.first_name} {profile?.last_name}
              </span>
            </div>

            {/* Add Quiz History Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuizHistory(true)}
              className="text-gray-600 hover:text-[#B95D38]/90"
              title="View Quiz History"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-600 hover:text-red-600">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section - Mobile-First Layout */}
      <section className="min-h-screen flex items-center justify-center py-20">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Mobile Layout: Poster First */}
          <div className="flex flex-col lg:hidden space-y-12">
            {/* Film Poster - Mobile Priority */}
            <div className="flex justify-center">
              <div className="relative group w-full max-w-sm">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#B95D38]/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A1147D70-FC71-4DEE-9749-E32CD0A8535D_4_5005_c-9qAxFCjLKUt4bBj5yUosrtWW0UpqVM.jpeg"
                  alt="Back Against the Wall Movie Poster"
                  width={400}
                  height={600}
                  className="w-full h-auto rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>

            {/* Typography Content - Mobile */}
            <div className="space-y-8 text-center">
              <div className="space-y-6">
                <Badge variant="outline" className="border-[#B95D38] text-[#B95D38] px-4 py-2 text-sm font-medium">
                  An Ambitious Short Film
                </Badge>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                  BACK
                  <br />
                  AGAINST
                  <br />
                  <span className="text-[#B95D38]">THE WALL</span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                  When financial pressure mounts,
                  <br />
                  <em className="text-gray-900">who do you become?</em>
                </p>
              </div>

              {/* Core CTA - Mobile */}
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  {!user ? (
                    <div className="flex flex-col gap-3">
                      <Button
                        size="lg"
                        onClick={() => setShowSignup(true)}
                        className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
                      >
                        Sign Up to Begin
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setShowSignin(true)}
                        className="border-2 border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 px-8 py-4 text-lg rounded-full transition-all duration-300 w-full"
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {!latestResult ? (
                        <Button
                          size="lg"
                          onClick={() => {
                            setShowQuiz(true)
                            setShowWelcome(true)
                            setCurrentQuestion(0)
                            setQuizAnswers({})
                          }}
                          className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
                        >
                          <Brain className="w-5 h-5 mr-2" />
                          Take Financial Quiz
                        </Button>
                      ) : !latestResult.has_viewed_results ? (
                        <Button
                          size="lg"
                          onClick={() => setShowResults(true)}
                          className="bg-[#669CCB] hover:bg-[#669CCB]/90 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
                        >
                          <Award className="w-5 h-5 mr-2" />
                          View Your Results
                        </Button>
                      ) : !latestResult.has_watched_film ? (
                        <Button
                          size="lg"
                          onClick={() => setShowFilm(true)}
                          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg w-full"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Watch Film
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Button
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 shadow-lg w-full"
                            disabled
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Journey Complete
                          </Button>
                          <Button
                            size="lg"
                            onClick={() => setShowResults(true)}
                            variant="outline"
                            className="border-2 border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 px-8 py-4 text-lg rounded-full transition-all duration-300 w-full"
                          >
                            Review Results
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Indicator - Mobile */}
                {user && latestResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Quiz</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div
                        className={`flex items-center space-x-2 ${latestResult.has_viewed_results ? "text-green-600" : "text-gray-400"}`}
                      >
                        {latestResult.has_viewed_results ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        <span>Results</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div
                        className={`flex items-center space-x-2 ${latestResult.has_watched_film ? "text-green-600" : "text-gray-400"}`}
                      >
                        {latestResult.has_watched_film ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Film</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  {!user
                    ? "Discover your financial mindset, then watch how it shapes destiny in this powerful short film."
                    : `Welcome back, ${profile?.first_name}! ${getNextStep()}`}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Side by Side */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Typography */}
            <div className="space-y-12 text-center lg:text-left">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge variant="outline" className="border-[#B95D38] text-[#B95D38] px-4 py-2 text-sm font-medium">
                    An Ambitious Short Film
                  </Badge>
                  <h1 className="text-6xl md:text-8xl font-bold leading-tight tracking-tight">
                    BACK
                    <br />
                    AGAINST
                    <br />
                    <span className="text-[#B95D38]">THE WALL</span>
                  </h1>
                </div>

                <p className="text-2xl md:text-3xl text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                  When financial pressure mounts,
                  <br />
                  <em className="text-gray-900">who do you become?</em>
                </p>
              </div>

              {/* Core CTA - Desktop */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  {!user ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        size="lg"
                        onClick={() => setShowSignup(true)}
                        className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        Sign Up to Begin
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setShowSignin(true)}
                        className="border-2 border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 px-8 py-4 text-lg rounded-full transition-all duration-300"
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4">
                      {!latestResult ? (
                        <Button
                          size="lg"
                          onClick={() => {
                            setShowQuiz(true)
                            setShowWelcome(true)
                            setCurrentQuestion(0)
                            setQuizAnswers({})
                          }}
                          className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Brain className="w-5 h-5 mr-2" />
                          Take Financial Quiz
                        </Button>
                      ) : !latestResult.has_viewed_results ? (
                        <Button
                          size="lg"
                          onClick={() => setShowResults(true)}
                          className="bg-[#669CCB] hover:bg-[#669CCB]/90 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Award className="w-5 h-5 mr-2" />
                          View Your Results
                        </Button>
                      ) : !latestResult.has_watched_film ? (
                        <Button
                          size="lg"
                          onClick={() => setShowFilm(true)}
                          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Watch Film
                        </Button>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            size="lg"
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 shadow-lg"
                            disabled
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Journey Complete
                          </Button>
                          <Button
                            size="lg"
                            onClick={() => setShowResults(true)}
                            variant="outline"
                            className="border-2 border-[#B95D38] text-[#B95D38] hover:bg-[#B95D38]/10 px-8 py-4 text-lg rounded-full transition-all duration-300"
                          >
                            Review Results
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Indicator - Desktop */}
                {user && latestResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm">
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Quiz</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div
                        className={`flex items-center space-x-2 ${latestResult.has_viewed_results ? "text-green-600" : "text-gray-400"}`}
                      >
                        {latestResult.has_viewed_results ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Award className="w-4 h-4" />
                        )}
                        <span>Results</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div
                        className={`flex items-center space-x-2 ${latestResult.has_watched_film ? "text-green-600" : "text-gray-400"}`}
                      >
                        {latestResult.has_watched_film ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span>Film</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 max-w-md mx-auto lg:mx-0">
                  {!user
                    ? "Discover your financial mindset, then watch how it shapes destiny in this powerful short film."
                    : `Welcome back, ${profile?.first_name}! ${getNextStep()}`}
                </p>
              </div>
            </div>

            {/* Right: Film Poster - Desktop */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#B95D38]/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/A1147D70-FC71-4DEE-9749-E32CD0A8535D_4_5005_c-9qAxFCjLKUt4bBj5yUosrtWW0UpqVM.jpeg"
                  alt="Back Against the Wall Movie Poster"
                  width={400}
                  height={600}
                  className="rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-12">
            <h2 className="text-lg font-medium text-gray-500 tracking-wide uppercase">Supported By</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-center max-w-4xl mx-auto">
              {sponsors.map((sponsor, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
                >
                  <Image
                    src={sponsor.logo || "/placeholder.svg"}
                    alt={sponsor.name}
                    width={120}
                    height={60}
                    className="object-contain opacity-60 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About the Creators */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Meet the Creators</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The passionate team behind this exploration of financial psychology and human nature.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {creators.map((creator, index) => (
              <div key={index} className="text-center space-y-6 group">
                <div className="relative w-40 h-40 mx-auto rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={creator.image || "/placeholder.svg"}
                    alt={creator.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{creator.name}</h3>
                    <p className="text-[#B95D38] font-medium text-lg">{creator.role}</p>
                  </div>

                  <p className="text-gray-600 leading-relaxed">
                    {expandedCreator === index ? creator.expandedBio : creator.bio}
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedCreator(expandedCreator === index ? null : index)}
                    className="text-[#B95D38] hover:text-[#B95D38]/90 hover:bg-[#B95D38]/10 rounded-full px-6"
                  >
                    {expandedCreator === index ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Read More <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Social */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Interested in screenings, partnerships, or panel discussions? We'd love to connect with sponsors,
                    grantors, and investors.
                  </p>
                </div>

                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      placeholder="Name"
                      className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3"
                    />
                  </div>
                  <Input
                    placeholder="Organization (optional)"
                    className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg py-3"
                  />
                  <Textarea
                    placeholder="Message"
                    rows={5}
                    className="border-gray-300 focus:border-[#B95D38] focus:ring-[#B95D38] rounded-lg resize-none"
                  />
                  <Button className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold w-full py-3 rounded-lg">
                    Send Message
                  </Button>
                </form>
              </div>

              {/* Social & Events */}
              <div className="space-y-12">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Follow Our Journey</h3>
                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 text-gray-600 hover:border-[#B95D38] hover:text-[#B95D38] rounded-full w-12 h-12 bg-transparent"
                    >
                      <Instagram className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 text-gray-600 hover:border-[#B95D38] hover:text-[#B95D38] rounded-full w-12 h-12 bg-transparent"
                    >
                      <Twitter className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-gray-300 text-gray-600 hover:border-[#B95D38] hover:text-[#B95D38] rounded-full w-12 h-12 bg-transparent"
                    >
                      <Facebook className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900">Upcoming Events</h3>
                  <div className="space-y-4">
                    <Card className="border-gray-200 hover:border-[#B95D38] transition-colors duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-[#B95D38]">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">Panel Discussion</span>
                            </div>
                            <h4 className="font-semibold text-gray-900">Financial Psychology & Film</h4>
                            <p className="text-sm text-gray-600">Post-screening discussion with creators</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#B95D38] hover:bg-[#B95D38]/10">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200 hover:border-[#B95D38] transition-colors duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-[#B95D38]">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm font-medium">Private Screening</span>
                            </div>
                            <h4 className="font-semibold text-gray-900">For Investors & Partners</h4>
                            <p className="text-sm text-gray-600">Exclusive viewing and networking</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#B95D38] hover:bg-[#B95D38]/10">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-gray-200">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500">© 2024 Back Against the Wall. All rights reserved.</p>
        </div>
      </footer>

      {/* Auth Modals */}
      <SignUpModal
        open={showSignup}
        onOpenChange={setShowSignup}
        onSwitchToSignIn={() => {
          setShowSignup(false)
          setShowSignin(true)
        }}
        onSuccess={() => {
          setShowQuiz(true)
          setShowWelcome(true)
          setCurrentQuestion(0)
          setQuizAnswers({})
        }}
      />

      <SignInModal
        open={showSignin}
        onOpenChange={setShowSignin}
        onSwitchToSignUp={() => {
          setShowSignin(false)
          setShowSignup(true)
        }}
      />

      {/* Quiz Modal */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-gray-900">Financial Mindset Quiz</DialogTitle>
            <div className="space-y-4 pt-4">
              <Progress
                value={showWelcome ? 0 : ((currentQuestion + 1) / shuffledQuestions.length) * 100}
                className="w-full h-2"
              />
              <p className="text-sm text-gray-600 text-center">
                {showWelcome ? "Ready to begin?" : `Question ${currentQuestion + 1} of ${shuffledQuestions.length}`}
              </p>
            </div>
          </DialogHeader>

          {/* Welcome Screen */}
          {showWelcome && (
            <div className="space-y-6 py-6">
              <div className="text-center space-y-4">
                <p className="text-xl text-gray-700 leading-relaxed">
                  Welcome, {profile?.first_name}! Let's discover your financial personality.
                </p>
                <p className="text-gray-600">
                  Your responses will reveal your financial archetype and help you connect more deeply with the film's
                  characters.
                </p>
              </div>
              <div className="flex justify-center">
                <Button
                  onClick={startQuiz}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold px-8 py-3 rounded-lg"
                >
                  Start Quiz
                </Button>
              </div>
            </div>
          )}

          {/* Quiz Questions */}
          {!showWelcome && shuffledQuestions.length > 0 && currentQuestion < shuffledQuestions.length && (
            <div className="space-y-8 py-6">
              <h3 className="text-xl font-semibold text-center text-gray-800 leading-relaxed">
                {shuffledQuestions[currentQuestion]?.question}
              </h3>
              <div className="space-y-3">
                {shuffledQuestions[currentQuestion]?.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuizAnswer(option)}
                    disabled={quizLoading}
                    className="w-full text-left justify-start p-6 h-auto border-gray-300 hover:border-[#B95D38] hover:bg-[#B95D38]/10 transition-all duration-300 rounded-lg text-wrap"
                  >
                    <span className="text-gray-700">{option.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center text-gray-900">Your Financial Archetype</DialogTitle>
          </DialogHeader>

          {latestResult && (
            <div className="space-y-8 py-6">
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-[#B95D38]/10 rounded-full flex items-center justify-center mx-auto">
                  {(() => {
                    const IconComponent = getArchetypeIcon(latestResult.archetype)
                    return <IconComponent className="w-12 h-12 text-[#B95D38]" />
                  })()}
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-[#B95D38] mb-3">The {latestResult.archetype}</h3>
                  <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
                    {archetypeResults[latestResult.archetype]?.summary}
                  </p>
                </div>
              </div>

              {/* Strengths and Blind Spots */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-700 text-lg">Your Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {archetypeResults[latestResult.archetype]?.strengths.map((strength, index) => (
                        <li key={index} className="text-gray-700 flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-700 text-lg">Potential Blind Spots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {archetypeResults[latestResult.archetype]?.blindSpots.map((blindSpot, index) => (
                        <li key={index} className="text-gray-700 flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          {blindSpot}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-700 text-lg">Reflection Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {archetypeResults[latestResult.archetype]?.reflectionQuestion}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#B95D38]/20 bg-[#B95D38]/10">
                <CardHeader>
                  <CardTitle className="text-[#B95D38] text-lg">Your Film Connection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {archetypeResults[latestResult.archetype]?.filmCharacterTieIn}
                  </p>
                </CardContent>
              </Card>

              {/* Exploration Section */}
              <Card className="border-[#669CCB]/20 bg-[#669CCB]/10">
                <CardHeader>
                  <CardTitle className="text-[#669CCB] text-xl flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Explore Your {latestResult.archetype} Mindset
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 leading-relaxed">
                    {archetypeResults[latestResult.archetype]?.exploration.description}
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-[#669CCB] mb-3">Actionable Tips</h4>
                      <ul className="space-y-2">
                        {archetypeResults[latestResult.archetype]?.exploration.tips.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-[#669CCB] mr-2">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#669CCB] mb-3">Recommended Resources</h4>
                      <ul className="space-y-2">
                        {archetypeResults[latestResult.archetype]?.exploration.resources.map((resource, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-[#669CCB] mr-2">•</span>
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#669CCB] mb-3">Next Steps</h4>
                    <ul className="space-y-2">
                      {archetypeResults[latestResult.archetype]?.exploration.nextSteps.map((step, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-[#669CCB] mr-2">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={handleResultsViewed}
                  disabled={quizLoading}
                  className="bg-[#B95D38] hover:bg-[#B95D38]/90 text-white font-semibold py-4 px-12 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Now Watch the Film
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Film Modal */}
      <Dialog open={showFilm} onOpenChange={setShowFilm}>
        <DialogContent className="max-w-5xl bg-black border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">Back Against the Wall</DialogTitle>
            {latestResult && (
              <DialogDescription className="text-center text-gray-300">
                Watching as <span className="text-[#B95D38]">The {latestResult.archetype}</span> - Notice how the
                characters' financial decisions reflect your own mindset
              </DialogDescription>
            )}
          </DialogHeader>

          <VideoPlayer
            src="/videos/ambitious-film-compressed.mp4"
            title="Back Against the Wall"
            onEnded={handleFilmComplete}
            onError={handleVideoError}
            archetype={latestResult?.archetype}
            className="aspect-video"
          />
        </DialogContent>
      </Dialog>

      <QuizHistorySection open={showQuizHistory} onOpenChange={setShowQuizHistory} />
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <FilmWebsiteContent />
    </AuthProvider>
  )
}
