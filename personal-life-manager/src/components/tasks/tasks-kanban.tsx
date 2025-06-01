'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock, AlertCircle, Calendar, GripVertical, Plus } from 'lucide-react'
import { format, parseISO, isAfter } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface TasksKanbanProps {
  tasks: Task[]
}

interface DraggableTaskProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: string) => void
}

function DraggableTask({ task, onStatusChange }: DraggableTaskProps) {
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
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return isAfter(new Date(), parseISO(dueDate))
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    try {
      return format(parseISO(dueDate), 'MMM d')
    } catch {
      return null
    }
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-3 cursor-pointer hover:shadow-lg transition-all duration-200 ${
        isDragging ? 'ring-2 ring-blue-400 shadow-lg scale-105' : 'hover:shadow-md'
      } ${task.priority === 'high' ? 'border-l-4 border-l-red-500' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-2 flex-1">
            <div
              {...listeners}
              {...attributes}
              className="mt-1 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors"
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

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-full ml-2 flex-shrink-0"
            onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Circle className="h-4 w-4 text-gray-400" />
            )}
          </Button>
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
              isOverdue(task.due_date) ? 'text-red-600' : 'text-gray-500'
            }`}>
              {isOverdue(task.due_date) ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Calendar className="h-3 w-3" />
              )}
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          )}
        </div>

        {task.status !== 'completed' && (
          <div className="flex space-x-1">
            {task.status !== 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={() => onStatusChange(task.id, 'in_progress')}
              >
                Start
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={() => onStatusChange(task.id, 'pending')}
              >
                To Do
              </Button>
            )}
            <Button
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => onStatusChange(task.id, 'completed')}
            >
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TasksKanban({ tasks }: TasksKanbanProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
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
      const updateData: { status: string; completed_at?: string } = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      toast.success(`✨ Task moved to ${newStatus.replace('_', ' ')}!`, {
        description: 'Task status updated successfully'
      })
      window.location.reload()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

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
      gradient: 'from-gray-50 to-slate-50'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: tasks.filter(t => t.status === 'in_progress'),
      color: 'bg-blue-50 border-blue-200',
      gradient: 'from-blue-50 to-indigo-50'
    },
    {
      id: 'completed',
      title: 'Completed',
      tasks: tasks.filter(t => t.status === 'completed'),
      color: 'bg-green-50 border-green-200',
      gradient: 'from-green-50 to-emerald-50'
    }
  ]

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div
                id={column.id}
                className={`min-h-[500px] p-4 rounded-lg border-2 border-dashed transition-all duration-200 bg-gradient-to-b ${column.gradient} ${column.color}`}
              >
                {column.tasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-sm">Drop tasks here</div>
                    <div className="text-xs mt-1">or click + to add</div>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <DraggableTask
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
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
          <Card className="shadow-xl ring-2 ring-blue-400 scale-105 rotate-2">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-medium">{activeTask.title}</h3>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
