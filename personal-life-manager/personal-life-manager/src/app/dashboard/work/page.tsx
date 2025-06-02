import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Calendar, Clock, CheckCircle, AlertCircle, Plus, Users, Target } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isThisWeek, startOfWeek, endOfWeek } from 'date-fns'
import { WorkQuickAdd } from '@/components/work/work-quick-add'
import { WorkProjectsList } from '@/components/work/work-projects-list'
import { WorkTasksList } from '@/components/work/work-tasks-list'

export default async function WorkPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get work category ID
  const { data: workCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Work')
    .single()

  if (!workCategory) {
    return (
      <div className="p-8 text-center">
        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Work Category Not Found</h2>
        <p className="text-gray-600">Please check your categories setup.</p>
      </div>
    )
  }

  // Fetch work-related tasks
  const { data: workTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', workCategory.id)
    .order('due_date', { ascending: true })

  // Fetch work events (meetings, deadlines, etc.)
  const { data: workEvents } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', workCategory.id)
    .order('start_at', { ascending: true })

  // Fetch work projects
  const { data: workProjects } = await supabase
    .from('projects')
    .select(`
      *,
      project_tasks (
        id,
        title,
        status,
        due_date
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Group tasks by status
  const pendingTasks = workTasks?.filter(t => t.status === 'pending') || []
  const completedTasks = workTasks?.filter(t => t.status === 'completed') || []
  const overdueTasks = pendingTasks.filter(t =>
    t.due_date && new Date(t.due_date) < new Date()
  )

  // Get this week's events
  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  const thisWeekEvents = workEvents?.filter(event => {
    const eventDate = new Date(event.start_at)
    return eventDate >= weekStart && eventDate <= weekEnd
  }) || []

  // Today's meetings
  const todayMeetings = workEvents?.filter(event => {
    const eventDate = new Date(event.start_at)
    return isToday(eventDate)
  }) || []

  // Active projects
  const activeProjects = workProjects?.filter(p => p.status === 'active') || []

  const formatEventTime = (dateString: string) => {
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

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work</h1>
            <p className="text-gray-600">Manage your professional projects, tasks, and meetings</p>
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
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Target className="h-3 w-3" />
            <span>{activeProjects.length} active projects</span>
          </Badge>
        </div>
      </div>

      {/* Quick Add for Work Items */}
      <WorkQuickAdd categoryId={workCategory.id} />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{activeProjects.length}</div>
                <div className="text-sm text-gray-600">Active Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600">Pending Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{todayMeetings.length}</div>
                <div className="text-sm text-gray-600">Today's Meetings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{completedTasks.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Tasks Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Current Tasks</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkTasksList
              tasks={pendingTasks.slice(0, 5)}
              showAll={false}
            />
            {pendingTasks.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm">
                  View all {pendingTasks.length} tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Week's Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>This Week</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Meeting
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {thisWeekEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No meetings this week</p>
              </div>
            ) : (
              thisWeekEvents.slice(0, 5).map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500">
                      {formatEventTime(event.start_at)}
                    </div>
                    {event.location && (
                      <div className="text-xs text-gray-500 mt-1">
                        📍 {event.location}
                      </div>
                    )}
                  </div>
                  {isToday(parseISO(event.start_at)) && (
                    <Badge variant="secondary" className="text-xs">
                      Today
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Overview */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Active Projects</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New Project
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WorkProjectsList projects={activeProjects.slice(0, 3)} />
            {activeProjects.length > 3 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm">
                  View all {activeProjects.length} projects
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
