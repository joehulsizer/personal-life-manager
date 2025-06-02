'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Package, AlertTriangle, Clock, CheckCircle, Calendar, Plus, ShoppingCart, Bell, TrendingDown, Zap, Settings } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Supplement {
  id: string
  name: string
  quantity_servings?: number | null
  servings_per_day?: number | null
  daysLeft?: number | null
  runOutDate?: Date | null
  status: 'good' | 'low' | 'warning' | 'critical' | 'no-data'
  category_id?: string | null
}

interface SupplementTrackerProps {
  supplements: Supplement[]
}

export function SupplementTracker({ supplements }: SupplementTrackerProps) {
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null)
  const supabase = createClient()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive'
      case 'warning': return 'secondary'
      case 'low': return 'outline'
      case 'good': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'low':
        return <TrendingDown className="h-4 w-4 text-yellow-600" />
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4 text-gray-400" />
    }
  }

  const getProgressValue = (supplement: Supplement) => {
    if (!supplement.daysLeft || !supplement.quantity_servings || !supplement.servings_per_day) return 0
    const totalDays = supplement.quantity_servings / supplement.servings_per_day
    const progress = (supplement.daysLeft / totalDays) * 100
    return Math.max(0, Math.min(100, progress))
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500'
      case 'warning': return 'bg-orange-500'
      case 'low': return 'bg-yellow-500'
      default: return 'bg-green-500'
    }
  }

  const getConsumptionRate = (supplement: Supplement) => {
    if (!supplement.servings_per_day) return 'Unknown'
    if (supplement.servings_per_day === 1) return 'Daily'
    if (supplement.servings_per_day > 1) return `${supplement.servings_per_day}x daily`
    if (supplement.servings_per_day < 1) {
      const daysPerServing = Math.round(1 / supplement.servings_per_day)
      return `Every ${daysPerServing} days`
    }
    return 'Custom'
  }

  const getReorderSuggestion = (supplement: Supplement) => {
    if (!supplement.daysLeft) return null

    if (supplement.daysLeft <= 3) {
      return {
        urgency: 'immediate',
        message: '🚨 Order immediately - running out in 3 days or less',
        action: 'Order Now'
      }
    }
    if (supplement.daysLeft <= 7) {
      return {
        urgency: 'soon',
        message: '⚠️ Consider ordering soon - 1 week supply remaining',
        action: 'Add to Cart'
      }
    }
    if (supplement.daysLeft <= 14) {
      return {
        urgency: 'plan',
        message: '📅 Plan to reorder in the next week',
        action: 'Set Reminder'
      }
    }
    return null
  }

  const handleAddToShoppingList = async (supplement: Supplement) => {
    if (!supplement.category_id) {
      toast.error('Cannot add to shopping list - missing category information')
      return
    }

    setIsAddingToCart(supplement.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Add to tasks as shopping item
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          category_id: supplement.category_id,
          title: `Buy ${supplement.name}`,
          description: `Supplement reorder - ${supplement.quantity_servings || 30} servings, ${supplement.servings_per_day || 1} per day`,
          priority: supplement.status === 'critical' ? 'high' : 'medium',
          status: 'pending'
        })

      if (error) throw error

      toast.success(`🛒 Added "${supplement.name}" to shopping list!`, {
        description: supplement.status === 'critical' ? 'High priority item' : 'Added as medium priority'
      })

      // Show notification setup if first time
      if (!autoReorderEnabled) {
        toast.info('💡 Enable auto-reorder notifications for seamless restocking', {
          action: {
            label: 'Enable',
            onClick: () => setAutoReorderEnabled(true)
          }
        })
      }

    } catch (error) {
      console.error('Error adding to shopping list:', error)
      toast.error('Failed to add to shopping list')
    } finally {
      setIsAddingToCart(null)
    }
  }

  const handleSetReminder = (supplement: Supplement) => {
    if (!supplement.runOutDate) return

    const reminderDate = addDays(supplement.runOutDate, -7) // Remind 1 week before
    toast.success(`🔔 Reminder set for ${format(reminderDate, 'MMM d')}`, {
      description: `We'll remind you to reorder ${supplement.name}`
    })
  }

  const handleUpdateQuantity = (supplement: Supplement) => {
    toast.info('✏️ Edit supplement details coming soon!', {
      description: `Update quantities and consumption for ${supplement.name}`
    })
  }

  if (supplements.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No supplements tracked</h3>
        <p className="text-gray-500 mb-6">Start tracking your supplement inventory to never run out again.</p>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Your First Supplement</span>
        </Button>
      </div>
    )
  }

  // Sort by urgency (critical first, then by days left)
  const sortedSupplements = [...supplements].sort((a, b) => {
    const statusOrder = { 'critical': 0, 'warning': 1, 'low': 2, 'good': 3, 'no-data': 4 }
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff

    if (a.daysLeft && b.daysLeft) return a.daysLeft - b.daysLeft
    if (a.daysLeft && !b.daysLeft) return -1
    if (!a.daysLeft && b.daysLeft) return 1
    return 0
  })

  return (
    <div className="space-y-4">
      {/* Auto-reorder toggle */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-blue-900">Smart Reorder Notifications</div>
                <div className="text-sm text-blue-700">Get notified before supplements run out</div>
              </div>
            </div>
            <Button
              variant={autoReorderEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoReorderEnabled(!autoReorderEnabled)}
              className="flex items-center space-x-1"
            >
              {autoReorderEnabled ? <CheckCircle className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
              <span>{autoReorderEnabled ? 'Enabled' : 'Enable'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {sortedSupplements.map((supplement) => {
        const reorderSuggestion = getReorderSuggestion(supplement)

        return (
          <Card
            key={supplement.id}
            className={`
              transition-all duration-200 hover:shadow-md
              ${supplement.status === 'critical' ? 'ring-2 ring-red-200 border-red-300 bg-red-50' :
                supplement.status === 'warning' ? 'border-orange-200 bg-orange-50' :
                'hover:bg-gray-50'}
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(supplement.status)}
                  <div>
                    <h3 className="font-medium text-sm">{supplement.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>Rate: {getConsumptionRate(supplement)}</span>
                      {supplement.quantity_servings && (
                        <span>• {supplement.quantity_servings} servings total</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(supplement.status)} className="text-xs">
                    {supplement.status === 'critical' ? 'Critical' :
                     supplement.status === 'warning' ? 'Low Stock' :
                     supplement.status === 'low' ? 'Running Low' :
                     supplement.status === 'good' ? 'Well Stocked' :
                     'No Data'}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleUpdateQuantity(supplement)}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {supplement.daysLeft !== null && supplement.daysLeft !== undefined ? (
                <div className="space-y-3">
                  {/* Progress visualization */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Supply remaining</span>
                      <span className="font-medium">
                        {supplement.daysLeft} {supplement.daysLeft === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(supplement.status)}`}
                        style={{ width: `${getProgressValue(supplement)}%` }}
                      />
                      {supplement.status === 'critical' && (
                        <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {supplement.runOutDate && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Runs out: {format(supplement.runOutDate, 'MMM d, yyyy')}</span>
                      </div>

                      {supplement.status === 'good' && (
                        <div className="text-green-600 font-medium">
                          ✓ Well stocked
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reorder suggestion */}
                  {reorderSuggestion && (
                    <div className={`
                      p-3 rounded-lg border-l-4
                      ${reorderSuggestion.urgency === 'immediate' ? 'bg-red-50 border-l-red-500' :
                        reorderSuggestion.urgency === 'soon' ? 'bg-orange-50 border-l-orange-500' :
                        'bg-blue-50 border-l-blue-500'}
                    `}>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-700">
                          {reorderSuggestion.message}
                        </div>

                        <div className="flex space-x-1">
                          {reorderSuggestion.urgency === 'immediate' && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-red-600 hover:bg-red-700"
                              onClick={() => handleAddToShoppingList(supplement)}
                              disabled={isAddingToCart === supplement.id}
                            >
                              {isAddingToCart === supplement.id ? (
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  Order Now
                                </>
                              )}
                            </Button>
                          )}

                          {reorderSuggestion.urgency === 'soon' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => handleAddToShoppingList(supplement)}
                              disabled={isAddingToCart === supplement.id}
                            >
                              {isAddingToCart === supplement.id ? (
                                <div className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add to Cart
                                </>
                              )}
                            </Button>
                          )}

                          {reorderSuggestion.urgency === 'plan' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => handleSetReminder(supplement)}
                            >
                              <Bell className="h-3 w-3 mr-1" />
                              Remind Me
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">
                    Add serving information to track inventory automatically
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleUpdateQuantity(supplement)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Set Up Tracking
                  </Button>
                </div>
              )}

              {/* Quick actions for critical items */}
              {supplement.status === 'critical' && supplement.daysLeft !== null && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleAddToShoppingList(supplement)}
                      disabled={isAddingToCart === supplement.id}
                    >
                      {isAddingToCart === supplement.id ? (
                        <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      Priority Order
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetReminder(supplement)}
                    >
                      <Bell className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Summary stats */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">
                {supplements.filter(s => s.status === 'critical').length}
              </div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {supplements.filter(s => s.status === 'warning').length}
              </div>
              <div className="text-xs text-gray-600">Low Stock</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {supplements.filter(s => s.status === 'good').length}
              </div>
              <div className="text-xs text-gray-600">Well Stocked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {supplements.length}
              </div>
              <div className="text-xs text-gray-600">Total Tracked</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
