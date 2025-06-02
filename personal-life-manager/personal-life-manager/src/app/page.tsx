import { getUser } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function HomePage() {
  const user = await getUser()
  
  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }
  
  // If not logged in, show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Personal Life Manager
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Organize your life with tasks, events, notes, projects, and more. 
          Your comprehensive personal productivity solution.
        </p>
        
        <div className="space-x-4">
          <Button asChild size="lg">
            <Link href="/auth/login">
              Get Started
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/auth/login">
              Sign In
            </Link>
          </Button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Task Management</h3>
            <p className="text-gray-600 text-sm">
              Organize tasks by category with priorities, due dates, and recurrence rules.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 Smart Calendar</h3>
            <p className="text-gray-600 text-sm">
              Schedule events with natural language input and automatic categorization.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 Project Tracking</h3>
            <p className="text-gray-600 text-sm">
              Manage projects with kanban boards, notes, and supplement tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}