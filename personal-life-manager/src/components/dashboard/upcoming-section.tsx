'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description?: string | null
  status: string | null
  priority: string | null
  due_date?: string | null
  categories?: {
    name: string
    icon: string | null
    color: string | null
  } | null
}

interface Event {
  id: string
  title: string
  start_at: string
  end_at: string
  location?: string | null
  categories?: {
    name: string
    icon: string | null
    color: string | null
  } | null
}

interface UpcomingSectionProps {
  tasks: Task[]
  events: Event[]
}

export function UpcomingSection({ tasks, events }: UpcomingSectionProps) {
  const supabase = createClient()

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      toast.success('Task completed!')
      window.location.reload()
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString)

      if (isToday(date)) {
        return `Today, ${format(date, 'h:mm a')}`
      }
      if (isTomorrow(date)) {
        return `Tomorrow, ${format(date, 'h:mm a')}`
      }
      if (isThisWeek(date)) {
        return format(date, 'EEEE, h:mm a')
      }
      return format(date, 'MMM d, h:mm a')
    } catch {
      return 'Invalid date'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)

      if (isToday(date)) {
        return 'Today'
      }
      if (isTomorrow(date)) {
        return 'Tomorrow'
      }
      if (isThisWeek(date)) {
        return format(date, 'EEEE')
      }
      return format(date, 'MMM d')
    } catch {
      return 'Invalid date'
    }
  }

  // Combine and sort tasks and events by time
  const upcomingItems = [
    ...tasks.map(task => ({
      ...task,
      type: 'task' as const,
      time: task.due_date ? parseISO(task.due_date) : new Date(),
      sortTime: task.due_date ? parseISO(task.due_date).getTime() : Date.now()
    })),
    ...events.map(event => ({
      ...event,
      type: 'event' as const,
      time: parseISO(event.start_at),
      sortTime: parseISO(event.start_at).getTime()
    }))
  ].sort((a, b) => a.sortTime - b.sortTime)

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRight className="h-5 w-5" />
          <span>Upcoming</span>
          <Badge variant="secondary" className="ml-auto">
            Next 7 days
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ArrowRight className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No upcoming tasks or events</p>
            <p className="text-xs mt-1">You're all caught up for the week!</p>
          </div>
        ) : (
          upcomingItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              {item.type === 'task' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full"
                  onClick={() => handleCompleteTask(item.id)}
                >
                  {(item as Task).status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              ) : (
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-3 w-3 text-blue-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.categories && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: item.categories.color || undefined,
                        color: item.categories.color || undefined
                      }}
                    >
                      {item.categories.icon} {item.categories.name}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2 mt-1">
                  {item.type === 'task' && (item as Task).due_date && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Due {formatDate((item as Task).due_date || '')}</span>
                    </div>
                  )}

                  {item.type === 'event' && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime((item as Event).start_at)}</span>
                    </div>
                  )}

                  {item.type === 'event' && (item as Event).location && (
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{(item as Event).location}</span>
                    </div>
                  )}

                  {item.type === 'task' && (item as Task).priority && (
                    <Badge
                      variant={getPriorityColor((item as Task).priority || 'medium')}
                      className="text-xs"
                    >
                      {(item as Task).priority}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {upcomingItems.length > 0 && (
          <div className="pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View all upcoming items
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
