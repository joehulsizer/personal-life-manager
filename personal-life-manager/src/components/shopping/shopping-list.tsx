'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, ShoppingCart, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ShoppingItem {
  id: string
  title: string
  description?: string | null
  status: string | null
  priority: string | null
  created_at: string
}

interface ShoppingListProps {
  items: ShoppingItem[]
}

export function ShoppingList({ items }: ShoppingListProps) {
  const supabase = createClient()

  const handleCompleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (error) throw error

      toast.success('Item purchased!')
      window.location.reload()
    } catch (error) {
      console.error('Error completing item:', error)
      toast.error('Failed to mark as purchased')
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const extractCategory = (description: string | null) => {
    if (!description) return null
    const categoryMatch = description.match(/Category:\s*(\w+)/i)
    return categoryMatch ? categoryMatch[1] : null
  }

  const extractDetails = (description: string | null) => {
    if (!description) return {}

    const brandMatch = description.match(/Brand:\s*([^,]+)/i)
    const quantityMatch = description.match(/Quantity:\s*([^,]+)/i)

    return {
      brand: brandMatch ? brandMatch[1].trim() : null,
      quantity: quantityMatch ? quantityMatch[1].trim() : null
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Shopping list is empty</p>
        <p className="text-xs mt-1">Add items to your shopping list!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const category = extractCategory(item.description || null)
        const { brand, quantity } = extractDetails(item.description || null)

        return (
          <div
            key={item.id}
            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 rounded-full"
              onClick={() => handleCompleteItem(item.id)}
            >
              {item.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="font-medium text-sm truncate">{item.title}</p>
                {category && (
                  <Badge variant="outline" className="text-xs">
                    {category === 'food' && '🍎'}
                    {category === 'clothing' && '👕'}
                    {category === 'supplements' && '💊'}
                    {category === 'other' && '📦'}
                    {category}
                  </Badge>
                )}
                {item.priority && (
                  <Badge
                    variant={getPriorityColor(item.priority)}
                    className="text-xs"
                  >
                    {item.priority}
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-1">
                {brand && (
                  <div className="text-xs text-gray-500">
                    Brand: {brand}
                  </div>
                )}

                {quantity && (
                  <div className="text-xs text-gray-500">
                    Qty: {quantity}
                  </div>
                )}

                {!brand && !quantity && item.description && !item.description.startsWith('Category:') && (
                  <div className="text-xs text-gray-500 truncate">
                    {item.description}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {item.priority === 'high' && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
          </div>
        )
      })}

      {items.length >= 8 && (
        <div className="pt-2 border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all shopping items
          </Button>
        </div>
      )}
    </div>
  )
}
