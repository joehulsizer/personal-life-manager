'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Assignment {
  id: string
  title: string
  description?: string | null
  status: string | null
  priority: string | null
  due_date?: string | null
  created_at: string
}

interface AssignmentsListProps {
  assignments: Assignment[]
  showAll?: boolean
}

export function AssignmentsList({ assignments, showAll = false }: AssignmentsListProps) {
  const supabase = createClient()

  const handleCompleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) throw error

      toast.success('Assignment completed!')
      window.location.reload()
    } catch (error) {
      console.error('Error completing assignment:', error)
      toast.error('Failed to complete assignment')
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

  const getAssignmentStatus = (assignment: Assignment) => {
    if (!assignment.due_date) return 'no-date'

    const dueDate = parseISO(assignment.due_date)
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

  const getStatusIcon = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment)

    switch (status) {
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'due-soon':
        return <Clock className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No assignments</p>
        <p className="text-xs mt-1">All caught up!</p>
      </div>
    )
  }

  const displayAssignments = showAll ? assignments : assignments.slice(0, 5)

  return (
    <div className="space-y-3">
      {displayAssignments.map((assignment) => {
        const status = getAssignmentStatus(assignment)

        return (
          <div
            key={assignment.id}
            className={`
              flex items-center space-x-3 p-3 rounded-lg border transition-colors
              ${status === 'overdue' ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'}
            `}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => handleCompleteAssignment(assignment.id)}
            >
              {assignment.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm truncate">{assignment.title}</p>
                {assignment.priority && (
                  <Badge
                    variant={getPriorityColor(assignment.priority)}
                    className="text-xs"
                  >
                    {assignment.priority}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  {getStatusIcon(assignment)}
                  <span>{formatDueDate(assignment.due_date || null)}</span>
                </div>

                {assignment.description && (
                  <div className="text-xs text-gray-500 truncate">
                    {assignment.description}
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
