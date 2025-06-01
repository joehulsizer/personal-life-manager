'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Brain,
  CheckSquare,
  Calendar,
  ShoppingCart,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  X,
  Star,
  Rocket,
  Target
} from 'lucide-react'

interface WelcomeTourProps {
  onComplete?: () => void
  onSkip?: () => void
}

const tourSteps = [
  {
    title: "Welcome to Your Personal Life Manager! 🎉",
    description: "Your all-in-one solution for managing every aspect of your life with AI-powered intelligence.",
    icon: <Rocket className="h-8 w-8 text-blue-600" />,
    features: [
      "🧠 AI-powered natural language processing",
      "📱 Real-time notifications and updates",
      "🎯 Smart task management and automation",
      "📊 Progress tracking and analytics"
    ],
    highlight: "Get ready to supercharge your productivity!"
  },
  {
    title: "Smart Quick-Add Magic ✨",
    description: "Add anything using natural language - our AI understands what you mean!",
    icon: <Brain className="h-8 w-8 text-purple-600" />,
    features: [
      "💬 \"Team meeting tomorrow 2pm\" → Creates event automatically",
      "🛒 \"Buy groceries urgent\" → Adds to shopping list with high priority",
      "📝 \"Note: Great idea for app\" → Saves as note instantly",
      "🎯 Smart detection of dates, times, priorities, and categories"
    ],
    highlight: "Just type naturally - we'll handle the rest!"
  },
  {
    title: "Visual Task Management 📋",
    description: "Drag-and-drop kanban boards with real-time updates and smart alerts.",
    icon: <CheckSquare className="h-8 w-8 text-green-600" />,
    features: [
      "🎨 Beautiful drag-and-drop interface",
      "⚠️ Automatic overdue and urgency alerts",
      "🎯 Color-coded priorities and progress tracking",
      "⚡ Real-time updates across all devices"
    ],
    highlight: "See your progress visually and stay motivated!"
  },
  {
    title: "Intelligent Scheduling 📅",
    description: "Never miss important events with smart notifications and real-time status updates.",
    icon: <Calendar className="h-8 w-8 text-blue-600" />,
    features: [
      "⏰ Live countdown timers for upcoming events",
      "🚨 Smart alerts for starting-soon events",
      "📍 Location detection and travel reminders",
      "🔄 Automatic status updates (in progress, completed)"
    ],
    highlight: "Your schedule, perfectly organized and always up-to-date!"
  },
  {
    title: "Smart Inventory Tracking 💊",
    description: "Never run out of supplements again with intelligent inventory management.",
    icon: <ShoppingCart className="h-8 w-8 text-red-600" />,
    features: [
      "📊 Visual progress bars for supplement levels",
      "🚨 Auto-reorder alerts before running out",
      "🛒 One-click add to shopping list",
      "📈 Consumption analytics and optimization"
    ],
    highlight: "Automated health management made simple!"
  },
  {
    title: "Complete Life Organization 🌟",
    description: "Manage school, work, social life, and personal goals all in one place.",
    icon: <Target className="h-8 w-8 text-yellow-600" />,
    features: [
      "🎓 School: Courses, assignments, and deadlines",
      "💼 Work: Projects, meetings, and client management",
      "👥 Social: Events, friends, and personal connections",
      "📔 Personal: Diary, notes, and goal tracking"
    ],
    highlight: "Everything you need for a perfectly organized life!"
  },
  {
    title: "You're All Set! 🚀",
    description: "Ready to transform your productivity and organization?",
    icon: <Star className="h-8 w-8 text-gold-600" />,
    features: [
      "🎯 Start with the Quick-Add bar - try typing anything!",
      "📱 Explore each category to see all the features",
      "⚡ Watch real-time updates as you complete tasks",
      "🌟 Discover new features as you use the app"
    ],
    highlight: "Welcome to your new superpower for life management!"
  }
]

export function WelcomeTour({ onComplete, onSkip }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if user has seen the tour before
    const hasSeenTour = localStorage.getItem('hasSeenWelcomeTour')
    if (hasSeenTour) {
      setIsVisible(false)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    localStorage.setItem('hasSeenWelcomeTour', 'true')
    setIsVisible(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem('hasSeenWelcomeTour', 'true')
    setIsVisible(false)
    onSkip?.()
  }

  if (!isVisible) return null

  const step = tourSteps[currentStep]
  const isLastStep = currentStep === tourSteps.length - 1
  const isFirstStep = currentStep === 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-blue-200 shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              {step.icon}
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {step.title}
              </CardTitle>
              <p className="text-gray-600 mt-1">{step.description}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1 flex-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  style={{ width: `${100 / tourSteps.length}%` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {currentStep + 1} of {tourSteps.length}
            </span>
          </div>

          {/* Features list */}
          <div className="space-y-3">
            {step.features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border"
              >
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Highlight message */}
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">{step.highlight}</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="text-gray-600"
              >
                Skip Tour
              </Button>
              {!isFirstStep && (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  className="flex items-center space-x-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <span>{isLastStep ? "Let's Get Started!" : "Next"}</span>
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
              {isLastStep && <Rocket className="h-4 w-4" />}
            </Button>
          </div>

          {/* Fun fact for engagement */}
          {currentStep === 1 && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-xs text-purple-700">
                💡 <strong>Fun Fact:</strong> Our AI can understand over 50 different ways to express dates and times naturally!
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-green-700">
                🎯 <strong>Pro Tip:</strong> Drag tasks between columns to instantly update their status - it's that easy!
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-xs text-red-700">
                💊 <strong>Health Tip:</strong> Never run out of important supplements again with our smart inventory tracking!
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
