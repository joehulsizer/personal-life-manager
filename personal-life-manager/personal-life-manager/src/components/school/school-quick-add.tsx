'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Calendar, FileText, Send, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface SchoolQuickAddProps {
  categoryId: string
}

export function SchoolQuickAdd({ categoryId }: SchoolQuickAddProps) {
  const [input, setInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<'assignment' | 'lecture' | 'exam' | null>(null)

  const supabase = createClient()

  const parseSchoolInput = (text: string) => {
    const result = {
      title: text,
      type: selectedType || 'assignment' as const,
      course: null as string | null,
      dueDate: null as string | null,
      startTime: null as string | null,
      priority: 'medium' as 'low' | 'medium' | 'high',
      location: null as string | null
    }

    // Extract course from the beginning of the text
    const courseMatch = text.match(/^([A-Z]{2,4}\s*\d{3}[A-Z]?|\w+\s+\d{3}[A-Z]?)/i)
    if (courseMatch) {
      result.course = courseMatch[1]
      result.title = text.replace(courseMatch[1], '').trim()
    }

    // Extract dates
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (text.toLowerCase().includes('tomorrow')) {
      result.dueDate = tomorrow.toISOString().split('T')[0]
      result.title = text.replace(/tomorrow/gi, '').trim()
    } else if (text.toLowerCase().includes('today')) {
      result.dueDate = new Date().toISOString().split('T')[0]
      result.title = text.replace(/today/gi, '').trim()
    }

    // Extract time patterns
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)|(\d{1,2})\s*(am|pm)/i)
    if (timeMatch) {
      const timeStr = timeMatch[0]
      result.startTime = timeStr
      result.title = text.replace(timeMatch[0], '').trim()
    }

    // Extract location/room
    const locationMatch = text.match(/(?:room|rm|hall|building|bldg)\s+([A-Z0-9-]+)/i)
    if (locationMatch) {
      result.location = locationMatch[0]
      result.title = text.replace(locationMatch[0], '').trim()
    }

    // Extract priority indicators
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('important')) {
      result.priority = 'high'
    }

    // Auto-detect type based on keywords
    if (!selectedType) {
      if (text.toLowerCase().includes('exam') || text.toLowerCase().includes('test') || text.toLowerCase().includes('quiz')) {
        result.type = 'exam'
      } else if (text.toLowerCase().includes('lecture') || text.toLowerCase().includes('class') || text.toLowerCase().includes('seminar')) {
        result.type = 'lecture'
      } else {
        result.type = 'assignment'
      }
    }

    // Clean up title
    result.title = result.title.replace(/\s+/g, ' ').trim()

    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsAdding(true)
    try {
      const parsed = parseSchoolInput(input)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to add items')
        return
      }

      let title = parsed.title
      if (parsed.course) {
        title = `${parsed.course}: ${parsed.title}`
      }

      if (parsed.type === 'assignment') {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title,
            description: parsed.course ? `Course: ${parsed.course}` : null,
            due_date: parsed.dueDate,
            priority: parsed.priority,
            status: 'pending'
          })

        if (error) throw error
        toast.success(`Assignment "${parsed.title}" added successfully!`)
      } else {
        // For lectures and exams, create events
        const startDate = parsed.dueDate || new Date().toISOString().split('T')[0]
        const startTime = parsed.startTime || '09:00'
        const startAt = `${startDate}T${startTime}:00`

        const { error } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title,
            start_at: startAt,
            end_at: new Date(new Date(startAt).getTime() + (parsed.type === 'exam' ? 2 : 1.5) * 60 * 60 * 1000).toISOString(),
            location: parsed.location,
            description: parsed.course ? `Course: ${parsed.course}` : null
          })

        if (error) throw error
        toast.success(`${parsed.type === 'exam' ? 'Exam' : 'Lecture'} "${parsed.title}" added successfully!`)
      }

      setInput('')
      setSelectedType(null)

      // Refresh the page to show new data
      window.location.reload()

    } catch (error) {
      console.error('Error adding school item:', error)
      toast.error('Failed to add item. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add school item... 'CS101 Assignment 3 due tomorrow', 'Math lecture at 2pm room 205'"
                className="pl-10 pr-12"
                disabled={isAdding}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                disabled={!input.trim() || isAdding}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Type:</span>
              <Button
                type="button"
                variant={selectedType === 'assignment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'assignment' ? null : 'assignment')}
                className="h-8"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Assignment
              </Button>
              <Button
                type="button"
                variant={selectedType === 'lecture' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'lecture' ? null : 'lecture')}
                className="h-8"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Lecture
              </Button>
              <Button
                type="button"
                variant={selectedType === 'exam' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'exam' ? null : 'exam')}
                className="h-8"
              >
                <FileText className="h-3 w-3 mr-1" />
                Exam
              </Button>
            </div>

            {input.trim() && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  Will create: {selectedType || 'auto-detect'}
                </Badge>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
