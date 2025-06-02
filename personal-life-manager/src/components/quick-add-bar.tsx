'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, CheckSquare, StickyNote, Lightbulb, Send, Sparkles, Zap, Brain, History, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface QuickAddBarProps {
  categories: Category[]
}

interface ParsedItem {
  title: string
  type: 'task' | 'event' | 'note' | 'idea'
  category: string | null
  dueDate: string | null
  startTime: string | null
  endTime: string | null
  priority: 'low' | 'medium' | 'high'
  recurrence: string | null
  location: string | null
  tags: string[]
  confidence: number
  suggestions: string[]
  aiInsights: string[]
}

export function QuickAddBar({ categories }: QuickAddBarProps) {
  const [input, setInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<'task' | 'event' | 'note' | 'idea' | null>(null)
  const [parsedPreview, setParsedPreview] = useState<ParsedItem | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentInputs, setRecentInputs] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Enhanced smart suggestions with context awareness
  const contextualSuggestions = [
    "Team meeting tomorrow at 2pm in conference room A",
    "Buy groceries - milk, bread, eggs urgent",
    "CS101 assignment due Friday - data structures project",
    "Call mom this evening to check in",
    "Workout at gym 6pm - leg day",
    "Note: Meeting insights from client call",
    "Idea: New app feature for better UX",
    "Pay rent by the 1st high priority",
    "Dentist appointment next Tuesday 10am",
    "Project deadline Friday - final review needed",
    "Take vitamin D 2000 IU daily",
    "Coffee with Sarah next Wednesday 3pm at Starbucks",
    "Book flight to NYC for conference",
    "Review quarterly goals and metrics",
    "Plan birthday party for next month"
  ]

  // Advanced NLP parsing with AI-like intelligence
  const advancedParseNaturalLanguage = useCallback((text: string): ParsedItem => {
    let result: ParsedItem = {
      title: text,
      type: selectedType || 'task',
      category: null,
      dueDate: null,
      startTime: null,
      endTime: null,
      priority: 'medium',
      recurrence: null,
      location: null,
      tags: [],
      confidence: 0.5,
      suggestions: [],
      aiInsights: []
    }

    const lowerText = text.toLowerCase()

    // Enhanced category detection with fuzzy matching
    const categoryMatches = categories.find(cat => {
      const catName = cat.name.toLowerCase()
      const patterns = [
        `#${catName}`,
        `${catName}:`,
        `for ${catName}`,
        `${catName} `,
        new RegExp(`\\b${catName}\\b`),
        // Context-based matching
        new RegExp(`(assignment|homework|class|lecture|exam|study)`, 'i') && catName === 'school',
        new RegExp(`(meeting|work|project|client|deadline|office)`, 'i') && catName === 'work',
        new RegExp(`(buy|shop|grocery|store|purchase)`, 'i') && catName === 'shopping',
        new RegExp(`(call|text|friend|family|social|party)`, 'i') && catName === 'social'
      ]
      return patterns.some(pattern => {
        if (typeof pattern === 'string') return lowerText.includes(pattern)
        if (pattern instanceof RegExp) return pattern.test(lowerText)
        return false
      })
    })

    if (categoryMatches) {
      result.category = categoryMatches.id
      result.confidence += 0.25
    }

    // Enhanced date parsing with more patterns
    const datePatterns = [
      { pattern: /\b(today|now)\b/i, offset: 0 },
      { pattern: /\b(tomorrow|tmrw)\b/i, offset: 1 },
      { pattern: /\b(day after tomorrow|overmorrow)\b/i, offset: 2 },
      { pattern: /\b(next week)\b/i, offset: 7 },
      { pattern: /\b(next month)\b/i, offset: 30 },
      { pattern: /\b(monday|mon)\b/i, weekday: 1 },
      { pattern: /\b(tuesday|tue|tues)\b/i, weekday: 2 },
      { pattern: /\b(wednesday|wed)\b/i, weekday: 3 },
      { pattern: /\b(thursday|thu|thurs)\b/i, weekday: 4 },
      { pattern: /\b(friday|fri)\b/i, weekday: 5 },
      { pattern: /\b(saturday|sat)\b/i, weekday: 6 },
      { pattern: /\b(sunday|sun)\b/i, weekday: 0 },
      { pattern: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i, custom: true },
      { pattern: /\b(in (\d+) days?)\b/i, relative: true },
      { pattern: /\b(this (weekend|week))\b/i, special: true },
      { pattern: /\b(end of (week|month))\b/i, special: true }
    ]

    for (const datePattern of datePatterns) {
      const match = text.match(datePattern.pattern)
      if (match) {
        const now = new Date()
        let targetDate = new Date()

        if ('offset' in datePattern) {
          targetDate.setDate(now.getDate() + datePattern.offset)
        } else if ('weekday' in datePattern) {
          const days = (datePattern.weekday - now.getDay() + 7) % 7
          targetDate.setDate(now.getDate() + (days === 0 ? 7 : days))
        } else if (datePattern.relative && match[2]) {
          targetDate.setDate(now.getDate() + parseInt(match[2]))
        } else if (datePattern.custom) {
          // Handle MM/DD/YYYY format
          const month = parseInt(match[1]) - 1
          const day = parseInt(match[2])
          const year = match[3] ? parseInt(match[3]) : now.getFullYear()
          targetDate = new Date(year, month, day)
        }

        result.dueDate = targetDate.toISOString().split('T')[0]
        result.title = text.replace(match[0], '').trim()
        result.confidence += 0.2
        break
      }
    }

    // Enhanced time parsing with duration detection
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
      /\b(\d{1,2})\s*(am|pm)\b/i,
      /\b(\d{1,2}):(\d{2})\b/,
      /\b(morning|morn)\b/i,
      /\b(afternoon|noon)\b/i,
      /\b(evening|eve)\b/i,
      /\b(night|late)\b/i
    ]

    for (const timePattern of timePatterns) {
      const match = text.match(timePattern)
      if (match) {
        result.startTime = match[0]
        result.title = text.replace(match[0], '').trim()
        result.confidence += 0.15

        // Detect duration
        const durationMatch = text.match(/(\d+)\s*(hour|hr|minute|min)s?/i)
        if (durationMatch) {
          const duration = parseInt(durationMatch[1])
          const unit = durationMatch[2].toLowerCase()

          if (unit.startsWith('hour') || unit === 'hr') {
            const endTime = new Date()
            endTime.setHours(endTime.getHours() + duration)
            result.endTime = endTime.toTimeString().slice(0, 5)
          }
        }

        // Time suggests it's an event
        if (!selectedType) {
          result.type = 'event'
          result.confidence += 0.15
        }
        break
      }
    }

    // Enhanced priority detection
    const priorityIndicators = {
      high: ['urgent', 'asap', 'critical', 'important', 'emergency', '!!!', 'high priority', 'rush', 'deadline'],
      low: ['later', 'sometime', 'eventually', 'low priority', 'when free', 'casual', 'optional']
    }

    for (const [level, indicators] of Object.entries(priorityIndicators)) {
      if (indicators.some(indicator => lowerText.includes(indicator))) {
        result.priority = level as 'high' | 'low'
        result.confidence += 0.15
        break
      }
    }

    // Enhanced recurrence pattern detection
    const recurrencePatterns = [
      { pattern: /\b(every day|daily)\b/i, rule: 'FREQ=DAILY' },
      { pattern: /\b(every week|weekly)\b/i, rule: 'FREQ=WEEKLY' },
      { pattern: /\b(every month|monthly)\b/i, rule: 'FREQ=MONTHLY' },
      { pattern: /\b(every year|yearly|annually)\b/i, rule: 'FREQ=YEARLY' },
      { pattern: /\b(every (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i, rule: 'FREQ=WEEKLY' },
      { pattern: /\b(weekdays?)\b/i, rule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
      { pattern: /\b(weekends?)\b/i, rule: 'FREQ=WEEKLY;BYDAY=SA,SU' },
      { pattern: /\b(every (\d+) (days?|weeks?|months?))\b/i, rule: 'custom' }
    ]

    for (const recPattern of recurrencePatterns) {
      const match = text.match(recPattern.pattern)
      if (match) {
        result.recurrence = recPattern.rule
        result.confidence += 0.2
        result.title = text.replace(match[0], '').trim()
        break
      }
    }

    // Enhanced location detection
    const locationPatterns = [
      /\b(at|@)\s+([^,\n]+)/i,
      /\b(in|on)\s+(room|office|building|hall|floor)\s+([A-Z0-9-]+)/i,
      /\b(gym|home|work|office|school|mall|store|library|cafe|restaurant)\b/i,
      /\b([A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr))/i
    ]

    for (const locPattern of locationPatterns) {
      const match = text.match(locPattern)
      if (match) {
        result.location = match[2] || match[3] || match[1] || match[0]
        result.title = text.replace(match[0], '').trim()
        result.confidence += 0.15
        break
      }
    }

    // Tag extraction
    const tagMatches = text.match(/#(\w+)/g)
    if (tagMatches) {
      result.tags = tagMatches.map(tag => tag.slice(1))
      result.confidence += 0.1
    }

    // Smart type detection with improved heuristics
    if (!selectedType) {
      const typeIndicators = {
        event: ['meeting', 'appointment', 'call', 'conference', 'interview', 'dinner', 'lunch', 'party', 'date', 'visit'],
        note: ['note:', 'remember:', 'thoughts:', 'memo:', 'reminder:', 'info:'],
        idea: ['idea:', 'brainstorm', 'concept', 'innovation', 'inspiration', 'thought:', 'maybe:'],
        task: ['buy', 'get', 'pick up', 'complete', 'finish', 'do', 'make', 'send', 'call', 'email', 'write', 'read']
      }

      for (const [type, indicators] of Object.entries(typeIndicators)) {
        if (indicators.some(indicator => lowerText.includes(indicator))) {
          result.type = type as 'task' | 'event' | 'note' | 'idea'
          result.confidence += 0.15
          break
        }
      }
    }

    // AI-powered insights and suggestions
    result.aiInsights = []
    if (result.confidence < 0.7) {
      if (!result.dueDate && result.type === 'task') result.suggestions.push('Consider adding a due date')
      if (!result.category) result.suggestions.push('Specify which life area this belongs to')
      if (result.type === 'event' && !result.startTime) result.suggestions.push('Add a specific time')
      if (result.priority === 'medium' && lowerText.includes('important')) result.suggestions.push('Mark as high priority')
    }

    // Smart insights based on content
    if (result.type === 'task' && !result.dueDate) {
      result.aiInsights.push('💡 Tasks with deadlines are 3x more likely to be completed')
    }
    if (result.type === 'event' && result.location) {
      result.aiInsights.push('📍 Location detected - consider setting travel time reminders')
    }
    if (result.recurrence) {
      result.aiInsights.push('🔄 Recurring items help build consistent habits')
    }

    // Clean up title
    result.title = result.title
      .replace(/\s+/g, ' ')
      .replace(/^[-:\s]+|[-:\s]+$/g, '')
      .trim()

    return result
  }, [categories, selectedType])

  // Real-time parsing with debouncing
  useEffect(() => {
    if (input.trim()) {
      setIsProcessing(true)
      const timer = setTimeout(() => {
        const parsed = advancedParseNaturalLanguage(input)
        setParsedPreview(parsed)
        setIsProcessing(false)
      }, 300) // Debounce for better performance

      return () => clearTimeout(timer)
    } else {
      setParsedPreview(null)
      setIsProcessing(false)
    }
  }, [input, advancedParseNaturalLanguage])

  // Dynamic suggestions based on input
  useEffect(() => {
    if (!input) {
      setSuggestions(contextualSuggestions.slice(0, 3))
    } else {
      // Filter suggestions based on current input
      const filtered = contextualSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(input.toLowerCase()) ||
        input.toLowerCase().split(' ').some(word =>
          suggestion.toLowerCase().includes(word) && word.length > 2
        )
      ).slice(0, 5)

      setSuggestions(filtered)
    }
  }, [input])

  // Load recent inputs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickAddHistory')
    if (saved) {
      setRecentInputs(JSON.parse(saved).slice(0, 10))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsAdding(true)
    try {
      const parsed = parsedPreview || advancedParseNaturalLanguage(input)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to add items')
        return
      }

      // Default to first category if none specified
      const categoryId = parsed.category || categories[0]?.id

      if (parsed.type === 'task') {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title: parsed.title,
            due_date: parsed.dueDate,
            priority: parsed.priority,
            recur_rule: parsed.recurrence,
            status: 'pending'
          })

        if (error) throw error

        toast.success(`✨ Task "${parsed.title}" created!`, {
          description: `Confidence: ${Math.round(parsed.confidence * 100)}% • ${parsed.aiInsights[0] || 'Great job staying organized!'}`
        })
      } else if (parsed.type === 'event') {
        const startDate = parsed.dueDate || new Date().toISOString().split('T')[0]
        const startTime = parsed.startTime || '09:00'
        const startAt = `${startDate}T${startTime}:00`

        let endAt = startAt
        if (parsed.endTime) {
          endAt = `${startDate}T${parsed.endTime}:00`
        } else {
          endAt = new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString()
        }

        const { error } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title: parsed.title,
            start_at: startAt,
            end_at: endAt,
            location: parsed.location,
            recur_rule: parsed.recurrence
          })

        if (error) throw error
        toast.success(`📅 Event "${parsed.title}" scheduled!`, {
          description: `Confidence: ${Math.round(parsed.confidence * 100)}% • ${parsed.aiInsights[0] || 'Calendar updated successfully!'}`
        })
      } else if (parsed.type === 'note' || parsed.type === 'idea') {
        const { error } = await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            content_md: parsed.title
          })

        if (error) throw error
        toast.success(`📝 ${parsed.type === 'idea' ? 'Idea' : 'Note'} saved!`, {
          description: `"${parsed.title.slice(0, 50)}${parsed.title.length > 50 ? '...' : ''}"`
        })
      }

      // Save to history
      const newHistory = [input, ...recentInputs.filter(h => h !== input)].slice(0, 10)
      setRecentInputs(newHistory)
      localStorage.setItem('quickAddHistory', JSON.stringify(newHistory))

      setInput('')
      setSelectedType(null)
      setParsedPreview(null)

      // Refresh the page to show new data
      window.location.reload()

    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  return (
    <Card className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-all duration-200 relative">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                <Brain className="h-4 w-4 text-gray-400" />
                {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              </div>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="✨ Add anything naturally... 'Team meeting tomorrow 2pm', 'Buy groceries urgent', 'Note: Great idea for app'"
                className="pl-12 pr-12 text-base"
                disabled={isAdding}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                {recentInputs.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <History className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={!input.trim() || isAdding}
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Recent History Dropdown */}
          {showHistory && recentInputs.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
              <div className="p-2 border-b text-xs text-gray-500 font-medium">Recent entries</div>
              {recentInputs.map((recent, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left p-2 text-sm hover:bg-gray-50 border-b last:border-b-0"
                  onClick={() => handleSuggestionClick(recent)}
                >
                  {recent}
                </button>
              ))}
            </div>
          )}

          {/* Enhanced Smart Preview */}
          {parsedPreview && (
            <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">AI Analysis</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(parsedPreview.confidence * 100)}% confident
                </Badge>
                {parsedPreview.confidence >= 0.8 && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    High Confidence
                  </Badge>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div><strong>Title:</strong> {parsedPreview.title}</div>
                  <div><strong>Type:</strong> {parsedPreview.type}</div>
                  {parsedPreview.priority !== 'medium' && (
                    <div><strong>Priority:</strong> {parsedPreview.priority}</div>
                  )}
                  {parsedPreview.dueDate && (
                    <div><strong>Due:</strong> {new Date(parsedPreview.dueDate).toLocaleDateString()}</div>
                  )}
                  {parsedPreview.startTime && (
                    <div><strong>Time:</strong> {parsedPreview.startTime}</div>
                  )}
                  {parsedPreview.location && (
                    <div><strong>Location:</strong> {parsedPreview.location}</div>
                  )}
                </div>

                {parsedPreview.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <strong>Tags:</strong>
                    {parsedPreview.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                )}

                {parsedPreview.recurrence && (
                  <div><strong>Repeats:</strong> {parsedPreview.recurrence}</div>
                )}
              </div>

              {parsedPreview.aiInsights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center space-x-1 mb-2">
                    <Zap className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">AI Insights</span>
                  </div>
                  {parsedPreview.aiInsights.map((insight, index) => (
                    <div key={index} className="text-xs text-amber-700 mb-1">{insight}</div>
                  ))}
                </div>
              )}

              {parsedPreview.suggestions.length > 0 && (
                <div className="mt-2 flex items-center space-x-1">
                  <Lightbulb className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-yellow-700">
                    Suggestions: {parsedPreview.suggestions.join(' • ')}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Quick add:</span>
              <Button
                type="button"
                variant={selectedType === 'task' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'task' ? null : 'task')}
                className="h-8"
              >
                <CheckSquare className="h-3 w-3 mr-1" />
                Task
              </Button>
              <Button
                type="button"
                variant={selectedType === 'event' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'event' ? null : 'event')}
                className="h-8"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Event
              </Button>
              <Button
                type="button"
                variant={selectedType === 'note' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'note' ? null : 'note')}
                className="h-8"
              >
                <StickyNote className="h-3 w-3 mr-1" />
                Note
              </Button>
              <Button
                type="button"
                variant={selectedType === 'idea' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'idea' ? null : 'idea')}
                className="h-8"
              >
                <Lightbulb className="h-3 w-3 mr-1" />
                Idea
              </Button>
            </div>

            {parsedPreview && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Creating: {parsedPreview.type}
                </Badge>
              </div>
            )}
          </div>

          {/* Smart Suggestions */}
          {suggestions.length > 0 && !parsedPreview && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">
                  {input ? 'Related suggestions:' : 'Try these examples:'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs p-2 text-left justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Lightbulb className="h-3 w-3 mr-2 text-yellow-500" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
