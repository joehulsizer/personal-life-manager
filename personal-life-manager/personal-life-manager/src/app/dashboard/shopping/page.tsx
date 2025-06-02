import { requireAuth } from '@/lib/auth-server'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Package, AlertTriangle, CheckCircle, Plus, Calendar, Clock } from 'lucide-react'
import { format, addDays, differenceInDays } from 'date-fns'
import { ShoppingQuickAdd } from '@/components/shopping/shopping-quick-add'
import { SupplementTracker } from '@/components/shopping/supplement-tracker'
import { ShoppingList } from '@/components/shopping/shopping-list'

export default async function ShoppingPage() {
  const user = await requireAuth()
  const supabase = await createServerClient()

  // Get shopping category ID
  const { data: shoppingCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'Shopping')
    .single()

  if (!shoppingCategory) {
    return (
      <div className="p-8 text-center">
        <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Shopping Category Not Found</h2>
        <p className="text-gray-600">Please check your categories setup.</p>
      </div>
    )
  }

  // Fetch shopping tasks (general shopping items)
  const { data: shoppingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('category_id', shoppingCategory.id)
    .order('created_at', { ascending: false })

  // Fetch supplement items
  const { data: supplements } = await supabase
    .from('supplement_items')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  // Calculate supplement statuses
  const supplementsWithStatus = supplements?.map(supplement => {
    if (!supplement.quantity_servings || !supplement.servings_per_day) {
      return { ...supplement, daysLeft: null, runOutDate: null, status: 'no-data' as const }
    }

    const daysLeft = Math.floor(supplement.quantity_servings / supplement.servings_per_day)
    const runOutDate = addDays(new Date(), daysLeft)

    let status: 'good' | 'low' | 'warning' | 'critical' = 'good'
    if (daysLeft <= 3) status = 'critical'
    else if (daysLeft <= 7) status = 'warning'
    else if (daysLeft <= 14) status = 'low'

    return { ...supplement, daysLeft, runOutDate, status }
  }) || []

  // Group shopping tasks by status
  const pendingItems = shoppingTasks?.filter(t => t.status === 'pending') || []
  const completedItems = shoppingTasks?.filter(t => t.status === 'completed') || []

  // Group supplements by status
  const criticalSupplements = supplementsWithStatus.filter(s => s.status === 'critical')
  const warningSupplements = supplementsWithStatus.filter(s => s.status === 'warning')
  const lowSupplements = supplementsWithStatus.filter(s => s.status === 'low')

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
            <p className="text-gray-600">Manage your shopping lists and supplement inventory</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Package className="h-3 w-3" />
            <span>{pendingItems.length} pending</span>
          </Badge>
          {criticalSupplements.length > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>{criticalSupplements.length} critical</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Add for Shopping Items */}
      <ShoppingQuickAdd categoryId={shoppingCategory.id} />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{supplementsWithStatus.length}</div>
                <div className="text-sm text-gray-600">Supplements</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{criticalSupplements.length}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{pendingItems.length}</div>
                <div className="text-sm text-gray-600">To Buy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{completedItems.length}</div>
                <div className="text-sm text-gray-600">Bought</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplement Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Supplement Tracker</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Supplement
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SupplementTracker supplements={supplementsWithStatus as any} />
          </CardContent>
        </Card>

        {/* Shopping List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Shopping List</span>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ShoppingList items={pendingItems.slice(0, 8)} />
          </CardContent>
        </Card>
      </div>

      {/* Critical Supplements Alert */}
      {criticalSupplements.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span>Supplements Running Low</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalSupplements.map((supplement) => (
                <div key={supplement.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div>
                    <div className="font-medium text-red-900">{supplement.name}</div>
                    <div className="text-sm text-red-700">
                      {supplement.daysLeft} {supplement.daysLeft === 1 ? 'day' : 'days'} remaining
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600">
                      Runs out: {supplement.runOutDate ? format(supplement.runOutDate, 'MMM d') : 'Unknown'}
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {supplement.status === 'critical' ? 'Buy Now' : 'Low Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
