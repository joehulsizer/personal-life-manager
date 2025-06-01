import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, Phone, MessageCircle, Heart, Plus, Coffee, Gift } from 'lucide-react'

export default async function SocialPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get social category ID
  const { data: socialCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Social')
    .single()

  if (!socialCategory) {
    return (
      <div className="p-8 text-center">
        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Social Category Not Found</h2>
        <p className="text-gray-600">Please check your categories setup.</p>
      </div>
    )
  }

  // Fetch social events and tasks
  const { data: socialEvents } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', socialCategory.id)
    .order('start_at', { ascending: true })

  const { data: socialTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', socialCategory.id)
    .order('created_at', { ascending: false })

  const upcomingEvents = socialEvents?.filter(event =>
    new Date(event.start_at) >= new Date()
  ).slice(0, 5) || []

  const pendingTasks = socialTasks?.filter(t => t.status === 'pending') || []

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social</h1>
            <p className="text-gray-600">Manage your social life and connections</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                <div className="text-sm text-gray-600">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <div className="text-sm text-gray-600">To Do</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">Birthdays</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coffee className="h-5 w-5 text-amber-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Social Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Events</span>
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
                <p className="text-sm">No upcoming events</p>
                <p className="text-xs mt-1">Plan something fun!</p>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(event.start_at).toLocaleDateString()}
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

        {/* Social Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5" />
                <span>Social Tasks</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No social tasks</p>
                <p className="text-xs mt-1">Keep in touch with friends!</p>
              </div>
            ) : (
              pendingTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Quick Social Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Phone className="h-6 w-6" />
              <span className="text-sm">Call Friend</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Coffee className="h-6 w-6" />
              <span className="text-sm">Coffee Date</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Gift className="h-6 w-6" />
              <span className="text-sm">Send Gift</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Plan Event</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
