import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CalendarDays, CheckCircle2, Clock, Plus, Zap, BookOpen, Briefcase, ShoppingCart, Users, Calendar, FolderOpen, FileText, Book } from 'lucide-react'
import { QuickAddBar } from '@/components/quick-add-bar'
import { TodaySection } from '@/components/dashboard/today-section'
import { UpcomingSection } from '@/components/dashboard/upcoming-section'
// // import { WelcomeTour } from '@/components/onboarding/welcome-tour'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch user's categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  // Fetch today's tasks and events
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      categories (name, icon, color)
    `)
    .eq('user_id', user.id)
    .gte('due_date', today)
    .lt('due_date', format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))
    .eq('status', 'pending')
    .order('due_date')

  const { data: todayEvents } = await supabase
    .from('events')
    .select(`
      *,
      categories (name, icon, color)
    `)
    .eq('user_id', user.id)
    .gte('start_at', today)
    .lt('start_at', format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))
    .order('start_at')

  // Fetch upcoming items (next 7 days)
  const nextWeek = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')
  const { data: upcomingTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      categories (name, icon, color)
    `)
    .eq('user_id', user.id)
    .gt('due_date', format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))
    .lte('due_date', nextWeek)
    .eq('status', 'pending')
    .order('due_date')
    .limit(5)

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select(`
      *,
      categories (name, icon, color)
    `)
    .eq('user_id', user.id)
    .gt('start_at', format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'))
    .lte('start_at', nextWeek)
    .order('start_at')
    .limit(5)

  const userName = profile?.name || user.email?.split('@')[0] || 'there'
  const greeting = getGreeting()

  return (
    <div className="p-4 md:p-8">
      {/* <WelcomeTour /> */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {greeting}, {userName}! 👋
              </h1>
              <p className="text-gray-600">
                {format(new Date(), 'EEEE, MMMM do, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Streak: 1 day</span>
            </Badge>
          </div>
        </div>

        {/* Quick Add Bar */}
        <QuickAddBar categories={categories || []} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today Section */}
          <TodaySection
            tasks={todayTasks || []}
            events={todayEvents || []}
          />

          {/* Upcoming Section */}
          <UpcomingSection
            tasks={upcomingTasks || []}
            events={upcomingEvents || []}
          />
        </div>

        {/* Categories Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5" />
              <span>Your Life Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{category.name}</div>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || '#6366f1' }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{todayTasks?.length || 0}</div>
                  <div className="text-sm text-gray-600">Today's Tasks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{todayEvents?.length || 0}</div>
                  <div className="text-sm text-gray-600">Today's Events</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{upcomingTasks?.length || 0}</div>
                  <div className="text-sm text-gray-600">Upcoming Tasks</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{categories?.length || 0}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
