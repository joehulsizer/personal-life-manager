import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GraduationCap, Calendar, BookOpen, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { SchoolQuickAdd } from '@/components/school/school-quick-add'
import { CourseCard } from '@/components/school/course-card'
import { AssignmentsList } from '@/components/school/assignments-list'

export default async function SchoolPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get school category ID
  const { data: schoolCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'School')
    .single()

  if (!schoolCategory) {
    return (
      <div className="p-8 text-center">
        <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">School Category Not Found</h2>
        <p className="text-gray-600">Please check your categories setup.</p>
      </div>
    )
  }

  // Fetch school-related tasks (assignments, projects, etc.)
  const { data: assignments } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', schoolCategory.id)
    .order('due_date', { ascending: true })

  // Fetch school events (lectures, exams, etc.)
  const { data: schoolEvents } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', schoolCategory.id)
    .order('start_at', { ascending: true })

  // Group assignments by status
  const pendingAssignments = assignments?.filter(a => a.status === 'pending') || []
  const completedAssignments = assignments?.filter(a => a.status === 'completed') || []
  const overdueAssignments = pendingAssignments.filter(a =>
    a.due_date && new Date(a.due_date) < new Date()
  )

  // Get upcoming events (next 7 days)
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingEvents = schoolEvents?.filter(event => {
    const eventDate = new Date(event.start_at)
    return eventDate >= now && eventDate <= nextWeek
  }) || []

  // Extract courses from assignments and events
  const courseNames = new Set([
    ...assignments?.map(a => a.description?.split(':')[0]).filter(Boolean) || [],
    ...schoolEvents?.map(e => e.title.split(' ')[0]).filter(Boolean) || []
  ])

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
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School</h1>
            <p className="text-gray-600">Manage your courses, assignments, and academic schedule</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{pendingAssignments.length} pending</span>
          </Badge>
          {overdueAssignments.length > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>{overdueAssignments.length} overdue</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Add for School Items */}
      <SchoolQuickAdd categoryId={schoolCategory.id} />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{courseNames.size}</div>
                <div className="text-sm text-gray-600">Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{pendingAssignments.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{completedAssignments.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Assignments</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Assignment
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AssignmentsList
              assignments={pendingAssignments.slice(0, 5)}
              showAll={false}
            />
            {pendingAssignments.length > 5 && (
              <div className="mt-4 text-center">
                <Button variant="ghost" size="sm">
                  View all {pendingAssignments.length} assignments
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>This Week</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Event
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No events this week</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
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
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Courses Overview */}
      {courseNames.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Your Courses</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(courseNames).map((courseName) => {
                const courseAssignments = assignments?.filter(a =>
                  a.description?.startsWith(courseName || '')
                ) || []
                const pendingCount = courseAssignments.filter(a => a.status === 'pending').length

                return (
                  <CourseCard
                    key={courseName}
                    name={courseName || ''}
                    pendingAssignments={pendingCount}
                    totalAssignments={courseAssignments.length}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
