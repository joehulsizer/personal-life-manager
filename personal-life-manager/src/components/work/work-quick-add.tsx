'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Calendar, Users, Target, Send, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface WorkQuickAddProps {
  categoryId: string
}

export function WorkQuickAdd({ categoryId }: WorkQuickAddProps) {
  const [input, setInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<'task' | 'meeting' | 'project' | null>(null)

  const supabase = createClient()

  const parseWorkInput = (text: string) => {
    const result = {
      title: text,
      type: selectedType || 'task' as const,
      project: null as string | null,
      dueDate: null as string | null,
      startTime: null as string | null,
      priority: 'medium' as 'low' | 'medium' | 'high',
      location: null as string | null,
      client: null as string | null
    }

    // Extract project name from brackets or prefixes
    const projectMatch = text.match(/\[([^\]]+)\]|^(\w+\s*project)/i)
    if (projectMatch) {
      result.project = projectMatch[1] || projectMatch[2]
      result.title = text.replace(projectMatch[0], '').trim()
    }

    // Extract client names
    const clientMatch = text.match(/(?:for|with|client)\s+([A-Z][a-zA-Z\s]+)/i)
    if (clientMatch) {
      result.client = clientMatch[1]
      result.title = text.replace(clientMatch[0], '').trim()
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

    // Extract time patterns for meetings
    const timeMatch = text.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)|(\d{1,2})\s*(am|pm)/i)
    if (timeMatch) {
      const timeStr = timeMatch[0]
      result.startTime = timeStr
      result.title = text.replace(timeMatch[0], '').trim()

      // If we found a time, this is likely a meeting
      if (!selectedType) {
        result.type = 'meeting'
      }
    }

    // Extract location/room for meetings
    const locationMatch = text.match(/(?:at|in|room|conference)\s+([A-Za-z0-9\s]+)/i)
    if (locationMatch) {
      result.location = locationMatch[1].trim()
      result.title = text.replace(locationMatch[0], '').trim()
    }

    // Extract priority indicators
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap') || text.toLowerCase().includes('priority')) {
      result.priority = 'high'
    } else if (text.toLowerCase().includes('low priority') || text.toLowerCase().includes('when time')) {
      result.priority = 'low'
    }

    // Auto-detect type based on keywords
    if (!selectedType) {
      if (text.toLowerCase().includes('meeting') || text.toLowerCase().includes('call') || text.toLowerCase().includes('standup')) {
        result.type = 'meeting'
      } else if (text.toLowerCase().includes('project') && !text.toLowerCase().includes('task')) {
        result.type = 'project'
      } else {
        result.type = 'task'
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
      const parsed = parseWorkInput(input)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to add items')
        return
      }

      let title = parsed.title
      if (parsed.project) {
        title = `[${parsed.project}] ${parsed.title}`
      }
      if (parsed.client) {
        title = `${title} (${parsed.client})`
      }

      if (parsed.type === 'task') {
        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title,
            description: parsed.project ? `Project: ${parsed.project}` : null,
            due_date: parsed.dueDate,
            priority: parsed.priority,
            status: 'pending'
          })

        if (error) throw error
        toast.success(`Task "${parsed.title}" added successfully!`)
      } else if (parsed.type === 'meeting') {
        const startDate = parsed.dueDate || new Date().toISOString().split('T')[0]
        const startTime = parsed.startTime || '10:00'
        const startAt = `${startDate}T${startTime}:00`

        const { error } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title,
            start_at: startAt,
            end_at: new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            location: parsed.location,
            description: parsed.project ? `Project: ${parsed.project}` : null
          })

        if (error) throw error
        toast.success(`Meeting "${parsed.title}" scheduled successfully!`)
      } else if (parsed.type === 'project') {
        const { error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: parsed.title,
            description: parsed.client ? `Client: ${parsed.client}` : null,
            status: 'active'
          })

        if (error) throw error
        toast.success(`Project "${parsed.title}" created successfully!`)
      }

      setInput('')
      setSelectedType(null)

      // Refresh the page to show new data
      window.location.reload()

    } catch (error) {
      console.error('Error adding work item:', error)
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
                <Briefcase className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add work item... '[ProjectX] Review designs', 'Team meeting at 2pm', 'New website project for ClientCorp'"
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
                variant={selectedType === 'meeting' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'meeting' ? null : 'meeting')}
                className="h-8"
              >
                <Users className="h-3 w-3 mr-1" />
                Meeting
              </Button>
              <Button
                type="button"
                variant={selectedType === 'project' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'project' ? null : 'project')}
                className="h-8"
              >
                <Target className="h-3 w-3 mr-1" />
                Project
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
