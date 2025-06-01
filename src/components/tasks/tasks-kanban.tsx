'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock, AlertCircle, Calendar, GripVertical, Plus, Timer, MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import { format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Task {
  id: string
  title: string
  description?: string | null
  status: string | null
  priority: string | null
  due_date?: string | null
  created_at: string
  categories?: {
    name: string
    icon: string | null
    color: string | null
  } | null
}

interface TasksKanbanProps {
  tasks: Task[]
}

interface DraggableTaskProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: string) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onDuplicate: (task: Task) => void
}

function DraggableTask({ task, onStatusChange, onEdit, onDelete, onDuplicate }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'transform 0.2s ease' : transition,
    opacity: isDragging ? 0.8 : 1,
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getPriorityBorder = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const getTaskUrgency = (dueDate: string | null) => {
    if (!dueDate) return 'none'

    const due = parseISO(dueDate)
    const now = new Date()
    const daysUntilDue = differenceInDays(due, now)

    if (isBefore(due, now)) return 'overdue'
    if (daysUntilDue <= 1) return 'urgent'
    if (daysUntilDue <= 3) return 'soon'
    return 'normal'
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    try {
      const due = parseISO(dueDate)
      const now = new Date()
      const daysUntilDue = differenceInDays(due, now)

      if (daysUntilDue === 0) return 'Due today'
      if (daysUntilDue === 1) return 'Due tomorrow'
      if (daysUntilDue === -1) return 'Was due yesterday'
      if (daysUntilDue < -1) return `Overdue by ${Math.abs(daysUntilDue)} days`
      if (daysUntilDue <= 7) return `Due in ${daysUntilDue} days`

      return format(due, 'MMM d')
    } catch {
      return 'Invalid date'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return <AlertCircle className="h-3 w-3 text-red-600" />
      case 'urgent':
        return <Timer className="h-3 w-3 text-orange-600" />
      case 'soon':
        return <Clock className="h-3 w-3 text-yellow-600" />
      default:
        return <Calendar className="h-3 w-3 text-gray-400" />
    }
  }

  const urgency = getTaskUrgency(task.due_date)
  const daysOverdue = task.due_date && isBefore(parseISO(task.due_date), new Date())
    ? Math.abs(differenceInDays(parseISO(task.due_date), new Date()))
    : 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        mb-3 cursor-pointer transition-all duration-200 group
        ${isDragging ? 'ring-2 ring-blue-400 shadow-xl scale-105 rotate-2' : 'hover:shadow-lg hover:-translate-y-0.5'}
        ${urgency === 'overdue' ? 'border-red-200 bg-red-50' :
          urgency === 'urgent' ? 'border-orange-200 bg-orange-50' :
          'hover:bg-gray-50'}
        border-l-4 ${getPriorityBorder(task.priority)}
      `}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2 flex-1">
            <div
              {...listeners}
              {...attributes}
              className="mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-2 mb-1">{task.title}</h3>
              {task.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')
              }}
            >
              {task.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 hover:text-green-600" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(task)}>
                  <Copy className="h-3 w-3 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            {task.categories && (
              <Badge variant="outline" className="text-xs">
                {task.categories.icon} {task.categories.name}
              </Badge>
            )}
            {task.priority && (
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            )}
          </div>

          {task.due_date && (
            <div className={`flex items-center space-x-1 text-xs ${
              urgency === 'overdue' ? 'text-red-600 font-medium' :
              urgency === 'urgent' ? 'text-orange-600 font-medium' :
              urgency === 'soon' ? 'text-yellow-600' :
              'text-gray-500'
            }`}>
              {getUrgencyIcon(urgency)}
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          )}
        </div>

        {/* Overdue warning */}
        {urgency === 'overdue' && (
          <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
            ⚠️ This task is {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
          </div>
        )}

        {/* Status transition buttons */}
        {task.status !== 'completed' && (
          <div className="flex space-x-1">
            {task.status !== 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1 transition-all hover:bg-blue-50 hover:border-blue-300"
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(task.id, 'in_progress')
                }}
              >
                <Timer className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1 transition-all hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(task.id, 'pending')
                }}
              >
                <Clock className="h-3 w-3 mr-1" />
                Pause
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-xs flex-1 transition-all hover:bg-green-600"
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange(task.id, 'completed')
              }}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Done
            </Button>
          </div>
        )}

        {/* Completed task display */}
        {task.status === 'completed' && (
          <div className="flex items-center justify-center text-xs text-green-600 font-medium">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TasksKanban({ tasks }: TasksKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const updateData: { status: string; completed_at?: string | null } = { status: newStatus }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      const statusEmojis = {
        pending: '📋',
        in_progress: '⏳',
        completed: '✅'
      }

      const statusLabels = {
        pending: 'To Do',
        in_progress: 'In Progress',
        completed: 'Completed'
      }

      toast.success(`${statusEmojis[newStatus as keyof typeof statusEmojis]} Task moved to ${statusLabels[newStatus as keyof typeof statusLabels]}!`, {
        description: 'Task status updated successfully'
      })

      // Real-time update without full page reload
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task status')
    }
  }

  const handleEdit = (task: Task) => {
    toast.info('Edit functionality coming soon!', {
      description: `Task: ${task.title}`
    })
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      toast.success('🗑️ Task deleted successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleDuplicate = async (task: Task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          category_id: task.categories ? null : null, // TODO: Get category ID properly
          title: `${task.title} (Copy)`,
          description: task.description,
          priority: task.priority,
          status: 'pending'
        })

      if (error) throw error

      toast.success('📋 Task duplicated successfully!')
      window.location.reload()
    } catch (error) {
      console.error('Error duplicating task:', error)
      toast.error('Failed to duplicate task')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setDragOverColumn(over?.id as string || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setDragOverColumn(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    // Only update if the status actually changed
    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      handleStatusChange(taskId, newStatus)
    }
  }

  const columns = [
    {
      id: 'pending',
      title: 'To Do',
      tasks: tasks.filter(t => t.status === 'pending' || !t.status),
      color: 'bg-gray-50 border-gray-200',
      gradient: 'from-gray-50 to-slate-50',
      accent: 'border-gray-300'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: tasks.filter(t => t.status === 'in_progress'),
      color: 'bg-blue-50 border-blue-200',
      gradient: 'from-blue-50 to-indigo-50',
      accent: 'border-blue-300'
    },
    {
      id: 'completed',
      title: 'Completed',
      tasks: tasks.filter(t => t.status === 'completed'),
      color: 'bg-green-50 border-green-200',
      gradient: 'from-green-50 to-emerald-50',
      accent: 'border-green-300'
    }
  ]

  // Calculate stats
  const overdueCount = tasks.filter(t =>
    t.status !== 'completed' && t.due_date && isBefore(parseISO(t.due_date), new Date())
  ).length

  const urgentCount = tasks.filter(t =>
    t.status !== 'completed' && t.due_date &&
    differenceInDays(parseISO(t.due_date), new Date()) <= 1
  ).length

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {(overdueCount > 0 || urgentCount > 0) && (
        <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
          {overdueCount > 0 && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          {urgentCount > 0 && (
            <div className="flex items-center space-x-2 text-orange-600">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">{urgentCount} urgent task{urgentCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <SortableContext
              key={column.id}
              items={column.tasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {column.tasks.length}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div
                  id={column.id}
                  className={`
                    min-h-[500px] p-4 rounded-lg border-2 transition-all duration-200
                    bg-gradient-to-b ${column.gradient} ${column.color}
                    ${dragOverColumn === column.id ? `border-dashed ${column.accent} scale-102` : 'border-dashed'}
                  `}
                >
                  {column.tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-sm mb-2">
                        {column.id === 'pending' ? '📋' :
                         column.id === 'in_progress' ? '⏳' : '✅'}
                      </div>
                      <div className="text-sm">Drop tasks here</div>
                      <div className="text-xs mt-1">or click + to add</div>
                    </div>
                  ) : (
                    column.tasks.map((task) => (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDuplicate={handleDuplicate}
                      />
                    ))
                  )}
                </div>
              </div>
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card className="shadow-2xl ring-4 ring-blue-400 scale-105 rotate-3 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium">{activeTask.title}</h3>
                </div>
                {activeTask.priority && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {activeTask.priority} priority
                  </Badge>
                )}
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
