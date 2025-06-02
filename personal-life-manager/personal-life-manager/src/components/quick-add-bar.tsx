'use client'

import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, CheckSquare, StickyNote, Lightbulb, Send, Sparkles, Zap, Brain } from 'lucide-react'
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
  priority: 'low' | 'medium' | 'high'
  recurrence: string | null
  location: string | null
  confidence: number
  suggestions: string[]
}

export function QuickAddBar({ categories }: QuickAddBarProps) {
  const [input, setInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<'task' | 'event' | 'note' | 'idea' | null>(null)
  const [parsedPreview, setParsedPreview] = useState<ParsedItem | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const supabase = createClient()

  // Smart suggestions based on common patterns
  const smartSuggestions = [
    "Buy groceries tomorrow at 2pm",
    "Team meeting every Monday at 10am",
    "Call mom this evening",
    "Workout at gym 6pm",
    "Pay rent by the 1st",
    "Dentist appointment next week",
    "Project deadline Friday",
    "Note: Meeting insights",
    "Idea: App feature brainstorm"
  ]

  const advancedParseNaturalLanguage = useCallback((text: string): ParsedItem => {
    const result: ParsedItem = {
      title: text,
      type: selectedType || 'task',
      category: null,
      dueDate: null,
      startTime: null,
      priority: 'medium',
      recurrence: null,
      location: null,
      confidence: 0.5,
      suggestions: []
    }

    const lowerText = text.toLowerCase()

    // Advanced category detection with higher confidence
    const categoryMatches = categories.find(cat => {
      const catName = cat.name.toLowerCase()
      const patterns = [
        `#${catName}`,
        `${catName}:`,
        `for ${catName}`,
        `${catName} `,
        new RegExp(`\\b${catName}\\b`)
      ]
      return patterns.some(pattern =>
        typeof pattern === 'string' ? lowerText.includes(pattern) : pattern.test(lowerText)
      )
    })

    if (categoryMatches) {
      result.category = categoryMatches.id
      result.confidence += 0.2
    }

    // Enhanced date parsing
    const datePatterns = [
      { pattern: /\b(today|now)\b/i, offset: 0 },
      { pattern: /\b(tomorrow|tmrw)\b/i, offset: 1 },
      { pattern: /\b(day after tomorrow)\b/i, offset: 2 },
      { pattern: /\b(next week)\b/i, offset: 7 },
      { pattern: /\b(monday|mon)\b/i, weekday: 1 },
      { pattern: /\b(tuesday|tue)\b/i, weekday: 2 },
      { pattern: /\b(wednesday|wed)\b/i, weekday: 3 },
      { pattern: /\b(thursday|thu)\b/i, weekday: 4 },
      { pattern: /\b(friday|fri)\b/i, weekday: 5 },
      { pattern: /\b(saturday|sat)\b/i, weekday: 6 },
      { pattern: /\b(sunday|sun)\b/i, weekday: 0 },
      { pattern: /(\d{1,2})\/(\d{1,2})/i, custom: true },
      { pattern: /\b(in (\d+) days?)\b/i, relative: true }
    ]

    for (const datePattern of datePatterns) {
      const match = text.match(datePattern.pattern)
      if (match) {
        const now = new Date()
        const targetDate = new Date()

        if ('offset' in datePattern && datePattern.offset !== undefined) {
          targetDate.setDate(now.getDate() + datePattern.offset)
        } else if ('weekday' in datePattern && datePattern.weekday !== undefined) {
          const days = (datePattern.weekday - now.getDay() + 7) % 7
          targetDate.setDate(now.getDate() + (days === 0 ? 7 : days))
        } else if (datePattern.relative && match[2]) {
          targetDate.setDate(now.getDate() + Number.parseInt(match[2]))
        }

        result.dueDate = targetDate.toISOString().split('T')[0]
        result.title = text.replace(match[0], '').trim()
        result.confidence += 0.15
        break
      }
    }

    // Enhanced time parsing
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
      /\b(\d{1,2})\s*(am|pm)\b/i,
      /\b(\d{1,2}):(\d{2})\b/,
      /\b(morning)\b/i,
      /\b(afternoon)\b/i,
      /\b(evening)\b/i,
      /\b(night)\b/i
    ]

    for (const timePattern of timePatterns) {
      const match = text.match(timePattern)
      if (match) {
        result.startTime = match[0]
        result.title = text.replace(match[0], '').trim()
        result.confidence += 0.1

        // Time suggests it's an event
        if (!selectedType) {
          result.type = 'event'
          result.confidence += 0.1
        }
        break
      }
    }

    // Advanced priority detection
    const priorityIndicators = {
      high: ['urgent', 'asap', 'critical', 'important', 'emergency', '!!!', 'high priority'],
      low: ['later', 'sometime', 'eventually', 'low priority', 'when free']
    }

    for (const [level, indicators] of Object.entries(priorityIndicators)) {
      if (indicators.some(indicator => lowerText.includes(indicator))) {
        result.priority = level as 'high' | 'low'
        result.confidence += 0.1
        break
      }
    }

    // Recurrence pattern detection
    const recurrencePatterns = [
      { pattern: /\b(every day|daily)\b/i, rule: 'daily' },
      { pattern: /\b(every week|weekly)\b/i, rule: 'weekly' },
      { pattern: /\b(every month|monthly)\b/i, rule: 'monthly' },
      { pattern: /\b(every (monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i, rule: 'weekly' },
      { pattern: /\b(weekdays?)\b/i, rule: 'weekdays' },
      { pattern: /\b(weekends?)\b/i, rule: 'weekends' }
    ]

    for (const recPattern of recurrencePatterns) {
      if (text.match(recPattern.pattern)) {
        result.recurrence = recPattern.rule
        result.confidence += 0.15
        break
      }
    }

    // Location detection
    const locationPatterns = [
      /\b(at|@)\s+([^,\n]+)/i,
      /\b(in|on)\s+(room|office|building|hall)\s+([A-Z0-9-]+)/i,
      /\b(gym|home|work|office|school|mall|store)\b/i
    ]

    for (const locPattern of locationPatterns) {
      const match = text.match(locPattern)
      if (match) {
        result.location = match[2] || match[3] || match[0]
        result.title = text.replace(match[0], '').trim()
        result.confidence += 0.1
        break
      }
    }

    // Smart type detection based on content
    if (!selectedType) {
      const typeIndicators = {
        event: ['meeting', 'appointment', 'call', 'conference', 'interview', 'dinner', 'lunch'],
        note: ['note:', 'remember:', 'thoughts:', 'ideas:', 'memo:'],
        idea: ['idea:', 'brainstorm', 'concept', 'innovation', 'inspiration'],
        task: ['buy', 'get', 'pick up', 'complete', 'finish', 'do', 'make']
      }

      for (const [type, indicators] of Object.entries(typeIndicators)) {
        if (indicators.some(indicator => lowerText.includes(indicator))) {
          result.type = type as 'task' | 'event' | 'note' | 'idea'
          result.confidence += 0.1
          break
        }
      }
    }

    // Generate smart suggestions
    result.suggestions = []
    if (result.confidence < 0.7) {
      if (!result.dueDate) result.suggestions.push('Add due date')
      if (!result.category) result.suggestions.push('Specify category')
      if (result.type === 'event' && !result.startTime) result.suggestions.push('Add time')
    }

    // Clean up title
    result.title = result.title
      .replace(/\s+/g, ' ')
      .replace(/^[-:\s]+|[-:\s]+$/g, '')
      .trim()

    return result
  }, [categories, selectedType])

  // Real-time parsing as user types
  useEffect(() => {
    if (input.trim()) {
      const parsed = advancedParseNaturalLanguage(input)
      setParsedPreview(parsed)
    } else {
      setParsedPreview(null)
    }
  }, [input, advancedParseNaturalLanguage])

  // Show suggestions when input is empty
  useEffect(() => {
    if (!input) {
      setSuggestions(smartSuggestions.slice(0, 3))
    } else {
      setSuggestions([])
    }
  }, [input])

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
        toast.success(`✨ Task "${parsed.title}" created successfully!`, {
          description: `Confidence: ${Math.round(parsed.confidence * 100)}%`
        })
      } else if (parsed.type === 'event') {
        const startDate = parsed.dueDate || new Date().toISOString().split('T')[0]
        const startTime = parsed.startTime || '09:00'
        const startAt = `${startDate}T${startTime}:00`

        const { error } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title: parsed.title,
            start_at: startAt,
            end_at: new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString(),
            location: parsed.location,
            recur_rule: parsed.recurrence
          })

        if (error) throw error
        toast.success(`📅 Event "${parsed.title}" scheduled successfully!`, {
          description: `Confidence: ${Math.round(parsed.confidence * 100)}%`
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
        toast.success(`📝 ${parsed.type === 'idea' ? 'Idea' : 'Note'} "${parsed.title}" saved successfully!`, {
          description: `Confidence: ${Math.round(parsed.confidence * 100)}%`
        })
      }

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
  }

  return (
    <Card className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Brain className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="✨ Add anything using natural language... Try: 'Team meeting tomorrow 2pm', 'Buy groceries urgent'"
                className="pl-10 pr-12 text-base"
                disabled={isAdding}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                disabled={!input.trim() || isAdding}
              >
                {isAdding ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Smart Preview */}
          {parsedPreview && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Smart Preview</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(parsedPreview.confidence * 100)}% confident
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div><strong>Title:</strong> {parsedPreview.title}</div>
                <div className="flex items-center space-x-4">
                  <span><strong>Type:</strong> {parsedPreview.type}</span>
                  {parsedPreview.priority !== 'medium' && (
                    <span><strong>Priority:</strong> {parsedPreview.priority}</span>
                  )}
                  {parsedPreview.dueDate && (
                    <span><strong>Due:</strong> {parsedPreview.dueDate}</span>
                  )}
                  {parsedPreview.startTime && (
                    <span><strong>Time:</strong> {parsedPreview.startTime}</span>
                  )}
                </div>
              </div>
              {parsedPreview.suggestions.length > 0 && (
                <div className="mt-2 flex items-center space-x-1">
                  <Zap className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-700">
                    Suggestions: {parsedPreview.suggestions.join(', ')}
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
                  Will create: {parsedPreview.type}
                </Badge>
              </div>
            )}
          </div>

          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Try these examples:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-auto text-xs p-2 text-left"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
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
