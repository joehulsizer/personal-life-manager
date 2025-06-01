import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, Edit, Heart, Smile, Frown, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export default async function DiaryPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Fetch diary entries
  const { data: diaryEntries } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  // Get today's entry
  const todayEntry = diaryEntries?.find(entry => entry.date === todayStr)

  // Get recent entries
  const recentEntries = diaryEntries?.slice(0, 7) || []

  // Calculate streak
  let currentStreak = 0
  let checkDate = new Date()

  while (currentStreak < 365) { // Max check 1 year
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    const hasEntry = diaryEntries?.some(entry => entry.date === dateStr)

    if (hasEntry) {
      currentStreak++
      checkDate = subDays(checkDate, 1)
    } else {
      break
    }
  }

  // Get calendar data for current month
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const hasEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return diaryEntries?.some(entry => entry.date === dateStr)
  }

  const getEntryPreview = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diary</h1>
            <p className="text-gray-600">Your personal daily journal</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Heart className="h-3 w-3" />
            <span>{currentStreak} day streak</span>
          </Badge>
          <Button size="sm" className="flex items-center space-x-1">
            <Edit className="h-4 w-4" />
            <span>Write Today</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{currentStreak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{diaryEntries?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Entries</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{recentEntries.length}</div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smile className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">😊</div>
                <div className="text-sm text-gray-600">Avg Mood</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Entry */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5" />
                  <span>Today's Entry</span>
                </div>
                <div className="text-sm text-gray-500">
                  {format(today, 'EEEE, MMMM d, yyyy')}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayEntry ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {todayEntry.content_md}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">
                      Written today
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No entry for today</h3>
                  <p className="text-gray-500 mb-6">Start writing about your day.</p>
                  <Button className="flex items-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span>Write Entry</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Recent Entries</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">
                          {format(new Date(entry.date), 'EEEE, MMM d')}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {getEntryPreview(entry.content_md || '')}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <p className="text-sm">No recent entries</p>
                    <p className="text-xs mt-1">Start your journaling journey!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Quick Actions */}
        <div className="space-y-6">
          {/* Mini Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm">{format(today, 'MMMM yyyy')}</span>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="p-2 font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {monthDays.map((date) => {
                  const isToday = format(date, 'yyyy-MM-dd') === todayStr
                  const hasEntry = hasEntryForDate(date)

                  return (
                    <div
                      key={date.toISOString()}
                      className={`
                        p-2 text-sm cursor-pointer rounded transition-colors
                        ${isToday ? 'bg-blue-600 text-white' :
                          hasEntry ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                          'hover:bg-gray-100'}
                      `}
                    >
                      {format(date, 'd')}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Mood Tracker */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smile className="h-5 w-5" />
                <span>How are you feeling?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { emoji: '😔', label: 'Sad' },
                  { emoji: '😐', label: 'Neutral' },
                  { emoji: '🙂', label: 'Good' },
                  { emoji: '😊', label: 'Happy' },
                  { emoji: '🤩', label: 'Excited' }
                ].map((mood) => (
                  <Button
                    key={mood.label}
                    variant="outline"
                    className="h-16 flex-col space-y-1"
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs">{mood.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Writing Prompts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Writing Prompts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "What made you smile today?",
                "What are you grateful for?",
                "What did you learn today?",
                "What's on your mind?"
              ].map((prompt, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full text-left justify-start text-sm h-auto p-3"
                >
                  {prompt}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
