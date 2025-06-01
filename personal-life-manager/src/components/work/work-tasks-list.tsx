'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, AlertCircle, Briefcase } from 'lucide-react'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface WorkTask {
  id: string
  title: string
  description?: string | null
  status: string | null
  priority: string | null
  due_date?: string | null
  created_at: string
}

interface WorkTasksListProps {
  tasks: WorkTask[]
  showAll?: boolean
}

export function WorkTasksList({ tasks, showAll = false }: WorkTasksListProps) {
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

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getTaskStatus = (task: WorkTask) => {
    if (!task.due_date) return 'no-date'

    const dueDate = parseISO(task.due_date)
    const now = new Date()
    const tomorrow = addDays(now, 1)

    if (isBefore(dueDate, now)) {
      return 'overdue'
    }
    if (isBefore(dueDate, tomorrow)) {
      return 'due-soon'
    }
    return 'upcoming'
  }

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'

    try {
      const date = parseISO(dateString)
      const now = new Date()
      const tomorrow = addDays(now, 1)

      if (isBefore(date, now)) {
        return `Overdue (${format(date, 'MMM d')})`
      }
      if (isBefore(date, tomorrow)) {
        return `Due today at ${format(date, 'h:mm a')}`
      }
      return `Due ${format(date, 'MMM d')}`
    } catch {
      return 'Invalid date'
    }
  }

  const getStatusIcon = (task: WorkTask) => {
    const status = getTaskStatus(task)

    switch (status) {
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'due-soon':
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const extractProject = (title: string) => {
    const projectMatch = title.match(/^\[([^\]]+)\]/)
    if (projectMatch) {
      return {
        project: projectMatch[1],
        cleanTitle: title.replace(projectMatch[0], '').trim()
      }
    }
    return { project: null, cleanTitle: title }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No work tasks</p>
        <p className="text-xs mt-1">All caught up!</p>
      </div>
    )
  }

  const displayTasks = showAll ? tasks : tasks.slice(0, 5)

  return (
    <div className="space-y-3">
      {displayTasks.map((task) => {
        const status = getTaskStatus(task)
        const { project, cleanTitle } = extractProject(task.title)

        return (
          <div
            key={task.id}
            className={`
              flex items-center space-x-3 p-3 rounded-lg border transition-colors
              ${status === 'overdue' ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'}
            `}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => handleCompleteTask(task.id)}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm truncate">{cleanTitle}</p>
                {project && (
                  <Badge variant="outline" className="text-xs">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {project}
                  </Badge>
                )}
                {task.priority && (
                  <Badge
                    variant={getPriorityColor(task.priority)}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {getStatusIcon(task)}
                  <span>{formatDueDate(task.due_date || null)}</span>
                </div>

                {task.description && !task.description.startsWith('Project:') && (
                  <div className="text-xs text-gray-500 truncate">
                    {task.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
