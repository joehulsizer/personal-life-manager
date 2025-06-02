import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FolderOpen, Plus, Target, Clock, CheckCircle, Users, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default async function ProjectsPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Fetch all projects for the user
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      project_tasks (
        id,
        title,
        status,
        due_date,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Group projects by status
  const activeProjects = projects?.filter(p => p.status === 'active') || []
  const completedProjects = projects?.filter(p => p.status === 'completed') || []
  const onHoldProjects = projects?.filter(p => p.status === 'on_hold') || []

  // Calculate project statistics
  const getProjectStats = (project: any) => {
    const tasks = project.project_tasks || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      progress,
      pendingTasks: totalTasks - completedTasks
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on_hold': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const ProjectCard = ({ project }: { project: any }) => {
    const stats = getProjectStats(project)

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <p className="text-sm text-gray-500">
                  Created {format(parseISO(project.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>

            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>

          {project.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
          )}

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{stats.progress}%</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-gray-600">Completed: {stats.completedTasks}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-gray-600">Pending: {stats.pendingTasks}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button size="sm" className="flex-1">
              Open Project
            </Button>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Manage your projects and track progress</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>{activeProjects.length} active</span>
          </Badge>
          <Button size="sm" className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{activeProjects.length}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{completedProjects.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{onHoldProjects.length}</div>
                <div className="text-sm text-gray-600">On Hold</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{projects?.length || 0}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Projects */}
      {projects && projects.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>All Projects</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => {
                const stats = getProjectStats(project)
                return (
                  <div key={project.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-purple-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        <Badge className={`text-xs ${getStatusColor(project.status || '')}`}>
                          {(project.status || '').replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>{stats.progress}% complete</span>
                        <span>{stats.totalTasks} tasks</span>
                        <span>Updated {format(parseISO(project.created_at), 'MMM d')}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                      <Button size="sm" variant="outline">
                        Open
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started organizing your work.</p>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
