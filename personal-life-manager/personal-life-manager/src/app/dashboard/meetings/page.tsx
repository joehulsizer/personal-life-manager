import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Video, Phone, Clock, Plus, MapPin, Mail } from 'lucide-react'
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns'

export default async function MeetingsPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get meetings category ID
  const { data: meetingsCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Meetings')
    .single()

  if (!meetingsCategory) {
    return (
      <div className="p-8 text-center">
        <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Meetings Category Not Found</h2>
        <p className="text-gray-600">Please check your categories setup.</p>
      </div>
    )
  }

  // Fetch meetings and events
  const { data: meetings } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', meetingsCategory.id)
    .order('start_at', { ascending: true })

  // Group meetings by time
  const now = new Date()
  const upcomingMeetings = meetings?.filter(meeting =>
    new Date(meeting.start_at) >= now
  ) || []

  const todayMeetings = upcomingMeetings.filter(meeting =>
    isToday(parseISO(meeting.start_at))
  )

  const tomorrowMeetings = upcomingMeetings.filter(meeting =>
    isTomorrow(parseISO(meeting.start_at))
  )

  const thisWeekMeetings = upcomingMeetings.filter(meeting =>
    isThisWeek(parseISO(meeting.start_at)) && !isToday(parseISO(meeting.start_at)) && !isTomorrow(parseISO(meeting.start_at))
  )

  const formatMeetingTime = (dateString: string) => {
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
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
            <p className="text-gray-600">Manage your meetings and contacts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{todayMeetings.length} today</span>
          </Badge>
          <Button size="sm" className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>New Meeting</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{todayMeetings.length}</div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{tomorrowMeetings.length}</div>
                <div className="text-sm text-gray-600">Tomorrow</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{thisWeekMeetings.length}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Today's Meetings</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Schedule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayMeetings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No meetings today</p>
                <p className="text-xs mt-1">Enjoy your free time!</p>
              </div>
            ) : (
              todayMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Video className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{meeting.title}</div>
                    <div className="text-sm text-gray-500">
                      {format(parseISO(meeting.start_at), 'h:mm a')} - {format(parseISO(meeting.end_at), 'h:mm a')}
                    </div>
                    {meeting.location && (
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {meeting.location}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Today
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming</span>
              </div>
              <Button size="sm" variant="outline">
                View Calendar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{meeting.title}</div>
                  <div className="text-xs text-gray-500">
                    {formatMeetingTime(meeting.start_at)}
                  </div>
                  {meeting.location && (
                    <div className="text-xs text-gray-500 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {meeting.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5" />
            <span>Quick Meeting Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Video className="h-6 w-6" />
              <span className="text-sm">Video Call</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Phone className="h-6 w-6" />
              <span className="text-sm">Phone Call</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Mail className="h-6 w-6" />
              <span className="text-sm">Send Email</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Schedule</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Meeting Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Team Standup</div>
                  <div className="text-sm text-gray-500">15 minutes</div>
                </div>
              </div>
              <p className="text-xs text-gray-600">Daily team sync and updates</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Video className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Client Call</div>
                  <div className="text-sm text-gray-500">60 minutes</div>
                </div>
              </div>
              <p className="text-xs text-gray-600">Client consultation and updates</p>
            </div>

            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Project Review</div>
                  <div className="text-sm text-gray-500">30 minutes</div>
                </div>
              </div>
              <p className="text-xs text-gray-600">Project progress and planning</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
