'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Calendar, Clock, MapPin, AlertCircle, Timer, Zap, RefreshCw } from 'lucide-react'
import { format, parseISO, differenceInMinutes, differenceInHours, isAfter, isBefore } from 'date-fns'
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

interface TodaySectionProps {
  tasks: Task[]
  events: Event[]
}

export function TodaySection({ tasks, events }: TodaySectionProps) {
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = createClient()

  // Update current time every minute for real-time status
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error

      toast.success('🎉 Task completed!', {
        description: 'Great job staying productive!'
      })

      // Smooth refresh after completion
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task')
    } finally {
      setCompletingTask(null)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate refresh
    window.location.reload()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getEventStatus = (event: Event) => {
    const now = currentTime
    const start = parseISO(event.start_at)
    const end = parseISO(event.end_at)

    if (isBefore(now, start)) {
      const minutesUntil = differenceInMinutes(start, now)
      if (minutesUntil <= 15) return { status: 'starting-soon', minutes: minutesUntil }
      if (minutesUntil <= 60) return { status: 'upcoming', minutes: minutesUntil }
      return { status: 'later', minutes: minutesUntil }
    }

    if (isAfter(now, start) && isBefore(now, end)) {
      const minutesRemaining = differenceInMinutes(end, now)
      return { status: 'in-progress', minutes: minutesRemaining }
    }

    return { status: 'completed', minutes: 0 }
  }

  const getTaskUrgency = (task: Task) => {
    if (!task.due_date) return 'no-deadline'

    const due = parseISO(task.due_date)
    const now = currentTime
    const hoursUntilDue = differenceInHours(due, now)

    if (isBefore(due, now)) return 'overdue'
    if (hoursUntilDue <= 2) return 'urgent'
    if (hoursUntilDue <= 6) return 'soon'
    return 'normal'
  }

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a')
    } catch {
      return ''
    }
  }

  const formatEventTime = (event: Event) => {
    const startTime = formatTime(event.start_at)
    const endTime = formatTime(event.end_at)
    return `${startTime} - ${endTime}`
  }

  const getStatusDisplay = (event: Event) => {
    const status = getEventStatus(event)

    switch (status.status) {
      case 'starting-soon':
        return {
          badge: <Badge variant="destructive" className="text-xs animate-pulse">Starting in {status.minutes}m</Badge>,
          icon: <Timer className="h-3 w-3 text-red-600 animate-pulse" />
        }
      case 'upcoming':
        return {
          badge: <Badge variant="secondary" className="text-xs">In {status.minutes}m</Badge>,
          icon: <Clock className="h-3 w-3 text-orange-600" />
        }
      case 'in-progress':
        return {
          badge: <Badge variant="default" className="text-xs bg-green-600 animate-pulse">In Progress ({status.minutes}m left)</Badge>,
          icon: <Zap className="h-3 w-3 text-green-600 animate-pulse" />
        }
      case 'completed':
        return {
          badge: <Badge variant="outline" className="text-xs">Completed</Badge>,
          icon: <CheckCircle2 className="h-3 w-3 text-gray-400" />
        }
      default:
        return {
          badge: null,
          icon: <Clock className="h-3 w-3 text-gray-400" />
        }
    }
  }

  const getUrgencyDisplay = (task: Task) => {
    const urgency = getTaskUrgency(task)

    switch (urgency) {
      case 'overdue':
        return {
          badge: <Badge variant="destructive" className="text-xs animate-pulse">Overdue</Badge>,
          icon: <AlertCircle className="h-3 w-3 text-red-600 animate-pulse" />
        }
      case 'urgent':
        return {
          badge: <Badge variant="destructive" className="text-xs">Urgent</Badge>,
          icon: <Timer className="h-3 w-3 text-red-600" />
        }
      case 'soon':
        return {
          badge: <Badge variant="secondary" className="text-xs">Due Soon</Badge>,
          icon: <Clock className="h-3 w-3 text-orange-600" />
        }
      default:
        return {
          badge: null,
          icon: <Clock className="h-3 w-3 text-gray-400" />
        }
    }
  }

  // Combine and sort tasks and events by time/urgency
  const todayItems = [
    ...tasks.map(task => ({
      ...task,
      type: 'task' as const,
      sortTime: task.due_date ? parseISO(task.due_date).getTime() : Date.now() + 1000000,
      urgency: getTaskUrgency(task)
    })),
    ...events.map(event => ({
      ...event,
      type: 'event' as const,
      sortTime: parseISO(event.start_at).getTime(),
      urgency: 'normal' as const
    }))
  ].sort((a, b) => {
    // Prioritize overdue/urgent items
    if (a.urgency === 'overdue' && b.urgency !== 'overdue') return -1
    if (b.urgency === 'overdue' && a.urgency !== 'overdue') return 1
    if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1
    if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1

    return a.sortTime - b.sortTime
  })

  const overdueTasks = tasks.filter(task => getTaskUrgency(task) === 'overdue')
  const urgentTasks = tasks.filter(task => getTaskUrgency(task) === 'urgent')
  const upcomingEvents = events.filter(event => {
    const status = getEventStatus(event)
    return status.status === 'upcoming' || status.status === 'starting-soon'
  })

  return (
    <Card className="h-fit relative overflow-hidden">
      {/* Animated background for urgent items */}
      {(overdueTasks.length > 0 || urgentTasks.length > 0) && (
        <div className="absolute inset-0 bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 opacity-50" />
      )}

      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Today</span>
            <div className="text-xs text-gray-500 font-normal">
              {format(currentTime, 'h:mm a')}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Urgent indicators */}
            {overdueTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                {overdueTasks.length} overdue
              </Badge>
            )}
            {urgentTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {urgentTasks.length} urgent
              </Badge>
            )}
            {upcomingEvents.length > 0 && (
              <Badge variant="default" className="text-xs bg-blue-600">
                {upcomingEvents.length} soon
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 relative">
        {todayItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks or events for today</p>
            <p className="text-xs mt-1">Enjoy your free time or add something to do!</p>
          </div>
        ) : (
          todayItems.map((item) => {
            const isCompleting = completingTask === item.id

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200
                  ${item.urgency === 'overdue' ? 'border-red-200 bg-red-50 shadow-lg' :
                    item.urgency === 'urgent' ? 'border-orange-200 bg-orange-50' :
                    'hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5'}
                  ${isCompleting ? 'scale-95 opacity-60' : ''}
                `}
              >
                {item.type === 'task' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full relative"
                    onClick={() => handleCompleteTask(item.id)}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                    ) : (item as Task).status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400 hover:text-green-600 transition-colors" />
                    )}
                  </Button>
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                    {getStatusDisplay(item as Event).icon}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className={`font-medium text-sm truncate ${
                      item.urgency === 'overdue' ? 'text-red-900' :
                      item.urgency === 'urgent' ? 'text-orange-900' :
                      ''
                    }`}>
                      {item.title}
                    </p>

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

                  <div className="flex items-center space-x-2">
                    {item.type === 'task' && (item as Task).due_date && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        {getUrgencyDisplay(item as Task).icon}
                        <span>Due {formatTime((item as Task).due_date || '')}</span>
                      </div>
                    )}

                    {item.type === 'event' && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatEventTime(item as Event)}</span>
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

                <div className="flex flex-col items-end space-y-1">
                  {item.type === 'task' && getUrgencyDisplay(item as Task).badge}
                  {item.type === 'event' && getStatusDisplay(item as Event).badge}
                </div>
              </div>
            )
          })
        )}

        {/* Quick stats at bottom */}
        {todayItems.length > 0 && (
          <div className="pt-3 border-t flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{tasks.filter(t => t.status !== 'completed').length} pending tasks</span>
              <span>{events.length} events</span>
            </div>
            <div className="text-xs">
              {format(currentTime, 'EEEE, MMM d')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
