'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  ShoppingCart,
  CheckSquare,
  Users,
  Calendar,
  FolderOpen,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Moon,
  Sun,
  Bell,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    color: '#6366f1',
    description: 'Overview & Today'
  },
  {
    name: 'School',
    href: '/dashboard/school',
    icon: GraduationCap,
    color: '#10b981',
    description: 'Courses & Assignments'
  },
  {
    name: 'Work',
    href: '/dashboard/work',
    icon: Briefcase,
    color: '#f59e0b',
    description: 'Projects & Meetings'
  },
  {
    name: 'Shopping',
    href: '/dashboard/shopping',
    icon: ShoppingCart,
    color: '#ef4444',
    description: 'Lists & Supplements'
  },
  {
    name: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    color: '#8b5cf6',
    description: 'All Task Management'
  },
  {
    name: 'Social',
    href: '/dashboard/social',
    icon: Users,
    color: '#ec4899',
    description: 'Friends & Events'
  },
  {
    name: 'Meetings',
    href: '/dashboard/meetings',
    icon: Calendar,
    color: '#06b6d4',
    description: 'Schedule & Contacts'
  },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    color: '#84cc16',
    description: 'Progress Tracking'
  },
  {
    name: 'Notes',
    href: '/dashboard/notes',
    icon: FileText,
    color: '#f97316',
    description: 'Ideas & Documentation'
  },
  {
    name: 'Diary',
    href: '/dashboard/diary',
    icon: BookOpen,
    color: '#64748b',
    description: 'Daily Journaling'
  }
]

interface NotificationCounts {
  pending_tasks: number
  overdue_tasks: number
  critical_supplements: number
  today_events: number
  unread_notifications: number
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notifications, setNotifications] = useState<NotificationCounts>({
    pending_tasks: 0,
    overdue_tasks: 0,
    critical_supplements: 0,
    today_events: 0,
    unread_notifications: 0
  })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Fetch real-time notification counts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get pending tasks count
        const { count: pendingTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending')

        // Get overdue tasks count
        const today = new Date().toISOString().split('T')[0]
        const { count: overdueTasks } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .lt('due_date', today)

        // Get critical supplements count
        const { count: criticalSupplements } = await supabase
          .from('supplement_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .lt('quantity_servings', 7) // Less than 7 servings left

        // Get today's events count
        const { count: todayEvents } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('start_at', today)
          .lt('start_at', new Date(Date.now() + 86400000).toISOString().split('T')[0])

        setNotifications({
          pending_tasks: pendingTasks || 0,
          overdue_tasks: overdueTasks || 0,
          critical_supplements: criticalSupplements || 0,
          today_events: todayEvents || 0,
          unread_notifications: (overdueTasks || 0) + (criticalSupplements || 0)
        })
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }
    }

    fetchNotifications()
    // Update every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('👋 Signed out successfully')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
    }
  }

  const getNotificationBadge = (item: typeof navigationItems[0]) => {
    switch (item.name) {
      case 'Tasks':
        const totalTasks = notifications.pending_tasks + notifications.overdue_tasks
        if (notifications.overdue_tasks > 0) {
          return <Badge variant="destructive" className="text-xs animate-pulse">{notifications.overdue_tasks}</Badge>
        }
        if (totalTasks > 0) {
          return <Badge variant="secondary" className="text-xs">{totalTasks}</Badge>
        }
        return null

      case 'Shopping':
        if (notifications.critical_supplements > 0) {
          return <Badge variant="destructive" className="text-xs animate-pulse">!</Badge>
        }
        return null

      case 'Dashboard':
        if (notifications.today_events > 0) {
          return <Badge variant="default" className="text-xs bg-blue-600">{notifications.today_events}</Badge>
        }
        return null

      default:
        return null
    }
  }

  const getItemDescription = (item: typeof navigationItems[0]) => {
    switch (item.name) {
      case 'Tasks':
        if (notifications.overdue_tasks > 0) {
          return `${notifications.overdue_tasks} overdue, ${notifications.pending_tasks} pending`
        }
        if (notifications.pending_tasks > 0) {
          return `${notifications.pending_tasks} pending tasks`
        }
        return item.description

      case 'Shopping':
        if (notifications.critical_supplements > 0) {
          return `${notifications.critical_supplements} supplements low`
        }
        return item.description

      case 'Dashboard':
        if (notifications.today_events > 0) {
          return `${notifications.today_events} events today`
        }
        return item.description

      default:
        return item.description
    }
  }

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg text-gray-900">Life Manager</h1>
              <p className="text-xs text-gray-500">Personal Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Notifications Summary */}
      {!isCollapsed && notifications.unread_notifications > 0 && (
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              {notifications.unread_notifications} urgent item{notifications.unread_notifications !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-xs text-red-700 space-y-1">
            {notifications.overdue_tasks > 0 && (
              <div>• {notifications.overdue_tasks} overdue task{notifications.overdue_tasks !== 1 ? 's' : ''}</div>
            )}
            {notifications.critical_supplements > 0 && (
              <div>• {notifications.critical_supplements} supplement{notifications.critical_supplements !== 1 ? 's' : ''} running low</div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const notificationBadge = getNotificationBadge(item)
          const description = getItemDescription(item)

          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`
                  group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? `${item.name}: ${description}` : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" style={{ color: isActive ? undefined : item.color }} />
                {!isCollapsed && (
                  <>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {notificationBadge}
                      </div>
                      <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'} group-hover:text-gray-600`}>
                        {description}
                      </div>
                    </div>
                  </>
                )}
                {isCollapsed && notificationBadge && (
                  <div className="absolute left-10 top-2">
                    {notificationBadge}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Productivity Stats */}
      {!isCollapsed && (
        <div className="mx-4 mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Today's Progress</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">
                {Math.max(0, notifications.pending_tasks - notifications.overdue_tasks)}
              </div>
              <div className="text-green-600">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700">{notifications.today_events}</div>
              <div className="text-blue-600">Events</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <Button size="sm" className="w-full mb-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        ) : (
          <Button size="sm" className="w-full mb-3 px-0">
            <Plus className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2"
            title="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {notifications.unread_notifications > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="p-2"
            title="Settings"
          >
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-90' : '-rotate-90'}`} />
          </Button>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title={isCollapsed ? "User menu" : undefined}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-white text-sm">
              U
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">User</p>
                <p className="text-xs text-gray-500">Free Plan • All Features</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
            </>
          )}
        </div>

        {isProfileOpen && !isCollapsed && (
          <div className="mt-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm"
              asChild
            >
              <Link href="/dashboard/profile">
                <Settings className="h-4 w-4 mr-2" />
                Profile Settings
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
