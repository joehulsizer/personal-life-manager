import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckSquare, Filter, Calendar, AlertCircle, Clock, Plus, List, Kanban } from 'lucide-react'
import { TasksKanban } from '@/components/tasks/tasks-kanban'
import { TasksList } from '@/components/tasks/tasks-list'
import { TasksQuickAdd } from '@/components/tasks/tasks-quick-add'
import { TasksFilters } from '@/components/tasks/tasks-filters'

export default async function TasksPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Fetch all tasks for the user across categories
  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      *,
      categories (name, icon, color)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch all categories for filters
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  // Group tasks by status
  const pendingTasks = tasks?.filter(t => t.status === 'pending') || []
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress') || []
  const completedTasks = tasks?.filter(t => t.status === 'completed') || []
  const overdueTasks = pendingTasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date()
  )

  // Group by priority
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high')
  const mediumPriorityTasks = pendingTasks.filter(t => t.priority === 'medium')
  const lowPriorityTasks = pendingTasks.filter(t => t.priority === 'low')

  // Group by category
  const tasksByCategory = tasks?.reduce((acc, task) => {
    const categoryName = task.categories?.name || 'Uncategorized'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(task)
    return acc
  }, {} as Record<string, typeof tasks>) || {}

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CheckSquare className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-600">Manage all your tasks across categories</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{pendingTasks.length} pending</span>
          </Badge>
          {overdueTasks.length > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>{overdueTasks.length} overdue</span>
            </Badge>
          )}
          <Button size="sm" className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Quick Add */}
      <TasksQuickAdd categories={categories || []} />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{inProgressTasks.length}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{overdueTasks.length}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{Object.keys(tasksByCategory).length}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <div className="h-3 w-3 bg-red-500 rounded-full"></div>
              <span>High Priority ({highPriorityTasks.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {highPriorityTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-500">
                  <div className="font-medium">{task.title}</div>
                  {task.categories && (
                    <div className="text-xs text-gray-500 mt-1">
                      {task.categories.icon} {task.categories.name}
                    </div>
                  )}
                </div>
              ))}
              {highPriorityTasks.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{highPriorityTasks.length - 3} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              <span>Medium Priority ({mediumPriorityTasks.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {mediumPriorityTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm p-2 bg-yellow-50 rounded border-l-2 border-yellow-500">
                  <div className="font-medium">{task.title}</div>
                  {task.categories && (
                    <div className="text-xs text-gray-500 mt-1">
                      {task.categories.icon} {task.categories.name}
                    </div>
                  )}
                </div>
              ))}
              {mediumPriorityTasks.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{mediumPriorityTasks.length - 3} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span>Low Priority ({lowPriorityTasks.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {lowPriorityTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm p-2 bg-green-50 rounded border-l-2 border-green-500">
                  <div className="font-medium">{task.title}</div>
                  {task.categories && (
                    <div className="text-xs text-gray-500 mt-1">
                      {task.categories.icon} {task.categories.name}
                    </div>
                  )}
                </div>
              ))}
              {lowPriorityTasks.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{lowPriorityTasks.length - 3} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tasks View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5" />
              <span>All Tasks</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button variant="outline" size="sm">
                <Kanban className="h-4 w-4 mr-1" />
                Board
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TasksKanban tasks={tasks || []} />
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Tasks by Category</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(tasksByCategory).map(([categoryName, categoryTasks]) => {
              const pendingCount = categoryTasks.filter(t => t.status === 'pending').length
              const completedCount = categoryTasks.filter(t => t.status === 'completed').length
              const category = categories?.find(c => c.name === categoryName)

              return (
                <div key={categoryName} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg">{category?.icon || '📁'}</span>
                    <div>
                      <div className="font-medium">{categoryName}</div>
                      <div className="text-sm text-gray-500">{categoryTasks.length} total</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-medium">{pendingCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completed</span>
                      <span className="font-medium">{completedCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${categoryTasks.length > 0 ? (completedCount / categoryTasks.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
