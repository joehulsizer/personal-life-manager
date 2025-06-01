'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Target, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface ProjectTask {
  id: string
  title: string
  status: string | null
  due_date?: string | null
}

interface WorkProject {
  id: string
  name: string
  description?: string | null
  status: string | null
  created_at: string
  project_tasks?: ProjectTask[]
}

interface WorkProjectsListProps {
  projects: WorkProject[]
}

export function WorkProjectsList({ projects }: WorkProjectsListProps) {
  const getProjectStatus = (project: WorkProject) => {
    const tasks = project.project_tasks || []
    if (tasks.length === 0) return { status: 'planning', progress: 0 }

    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const progress = Math.round((completedTasks / tasks.length) * 100)

    if (progress === 100) return { status: 'completed', progress }
    if (progress >= 75) return { status: 'near-completion', progress }
    if (progress >= 25) return { status: 'in-progress', progress }
    return { status: 'starting', progress }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'near-completion': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'starting': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'near-completion': return 'Near Completion'
      case 'in-progress': return 'In Progress'
      case 'starting': return 'Starting'
      default: return 'Planning'
    }
  }

  const extractClient = (description: string | null) => {
    if (!description) return null
    const clientMatch = description.match(/Client:\s*(.+)/i)
    return clientMatch ? clientMatch[1] : null
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No active projects</p>
        <p className="text-xs mt-1">Ready to start something new!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const { status, progress } = getProjectStatus(project)
        const client = extractClient(project.description || null)
        const tasks = project.project_tasks || []
        const pendingTasks = tasks.filter(t => t.status !== 'completed').length

        return (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Target className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                    {client && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {client}
                      </p>
                    )}
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className={`text-xs ${getStatusColor(status)}`}
                >
                  {getStatusLabel(status)}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-orange-600" />
                    <span className="text-gray-600">Pending</span>
                  </div>
                  <span className="font-medium">{pendingTasks}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-gray-600">Completed</span>
                  </div>
                  <span className="font-medium">{tasks.length - pendingTasks}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-3">
                Created {format(parseISO(project.created_at), 'MMM d, yyyy')}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs"
              >
                View Project
                <ArrowRight className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
