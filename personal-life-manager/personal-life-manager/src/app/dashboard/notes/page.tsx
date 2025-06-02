import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, Plus, Search, Tag, Calendar, Edit } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default async function NotesPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get notes category ID
  const { data: notesCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Notes')
    .single()

  if (!notesCategory) {
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Notes Category Not Found</h2>
        <p className="text-gray-600">Please check your categories setup.</p>
      </div>
    )
  }

  // Fetch notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', notesCategory.id)
    .order('created_at', { ascending: false })

  // Group notes by recent activity
  const recentNotes = notes?.slice(0, 6) || []
  const totalNotes = notes?.length || 0

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const extractTitle = (content: string) => {
    // Extract first line or first markdown heading as title
    const lines = content.split('\n')
    const firstLine = lines[0]?.trim()

    if (firstLine?.startsWith('#')) {
      return firstLine.replace(/^#+\s*/, '')
    }

    return firstLine || 'Untitled Note'
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
            <p className="text-gray-600">Capture and organize your thoughts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span>{totalNotes} notes</span>
          </Badge>
          <Button size="sm" className="flex items-center space-x-1">
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-1" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{totalNotes}</div>
                <div className="text-sm text-gray-600">Total Notes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{recentNotes.length}</div>
                <div className="text-sm text-gray-600">Recent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">Tagged</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Edit className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes Grid */}
      {totalNotes > 0 ? (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNotes.map((note) => (
              <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {extractTitle(note.content_md || '')}
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                    {truncateContent((note.content_md || '').replace(/^#+\s*.*\n?/, ''))}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {format(parseISO(note.created_at), 'MMM d, yyyy')}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Markdown
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalNotes > 6 && (
            <div className="text-center">
              <Button variant="outline">
                View All Notes ({totalNotes})
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-500 mb-6">Start capturing your thoughts and ideas.</p>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Your First Note</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Quick Note Templates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Meeting Notes</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Edit className="h-6 w-6" />
              <span className="text-sm">Daily Journal</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Tag className="h-6 w-6" />
              <span className="text-sm">Ideas</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-1">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Project Notes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
