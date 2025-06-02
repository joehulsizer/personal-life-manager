import { requireAuth } from '@/lib/auth-server'
import { Sidebar } from '@/components/layout/sidebar'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated
  await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ErrorBoundary>
        <Sidebar />
        <main className="flex-1 ml-64 transition-all duration-300">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </ErrorBoundary>
    </div>
  )
}
