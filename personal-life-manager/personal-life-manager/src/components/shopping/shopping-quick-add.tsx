'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Package, Apple, Shirt, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ShoppingQuickAddProps {
  categoryId: string
}

export function ShoppingQuickAdd({ categoryId }: ShoppingQuickAddProps) {
  const [input, setInput] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<'item' | 'supplement' | 'food' | 'clothing' | null>(null)

  const supabase = createClient()

  const parseShoppingInput = (text: string) => {
    const result = {
      title: text,
      type: selectedType || 'item' as const,
      quantity: null as number | null,
      brand: null as string | null,
      servingsPerDay: null as number | null,
      priority: 'medium' as 'low' | 'medium' | 'high',
      category: 'other' as 'food' | 'clothing' | 'supplements' | 'other'
    }

    // Extract quantity patterns
    const quantityMatch = text.match(/(\d+)\s*(x|pcs?|pieces?|bottles?|boxes?|kg|lbs?|oz|ml|l|liters?)/i)
    if (quantityMatch) {
      result.quantity = Number.parseInt(quantityMatch[1])
      result.title = text.replace(quantityMatch[0], '').trim()
    }

    // Extract brand patterns
    const brandMatch = text.match(/\b([A-Z][a-z]+\s*[A-Z]*[a-z]*)\s+(brand|by)\b/i)
    if (brandMatch) {
      result.brand = brandMatch[1]
      result.title = text.replace(brandMatch[0], '').trim()
    }

    // Extract servings per day for supplements
    const servingsMatch = text.match(/(\d+)\s*(per day|daily|\/day)/i)
    if (servingsMatch) {
      result.servingsPerDay = Number.parseInt(servingsMatch[1])
      result.title = text.replace(servingsMatch[0], '').trim()
    }

    // Extract priority indicators
    if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('asap') || text.toLowerCase().includes('need now')) {
      result.priority = 'high'
    } else if (text.toLowerCase().includes('when convenient') || text.toLowerCase().includes('low priority')) {
      result.priority = 'low'
    }

    // Auto-detect category based on keywords
    if (!selectedType) {
      const lowerText = text.toLowerCase()
      if (lowerText.includes('vitamin') || lowerText.includes('supplement') || lowerText.includes('protein') || lowerText.includes('pills') || lowerText.includes('capsules')) {
        result.type = 'supplement'
        result.category = 'supplements'
      } else if (lowerText.includes('shirt') || lowerText.includes('pants') || lowerText.includes('shoes') || lowerText.includes('jacket') || lowerText.includes('dress')) {
        result.type = 'clothing'
        result.category = 'clothing'
      } else if (lowerText.includes('milk') || lowerText.includes('bread') || lowerText.includes('eggs') || lowerText.includes('fruit') || lowerText.includes('vegetables')) {
        result.type = 'food'
        result.category = 'food'
      } else {
        result.type = 'item'
        result.category = 'other'
      }
    }

    // Clean up title
    result.title = result.title.replace(/\s+/g, ' ').trim()

    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsAdding(true)
    try {
      const parsed = parseShoppingInput(input)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to add items')
        return
      }

      if (parsed.type === 'supplement') {
        // Add to supplement_items table
        const { error } = await supabase
          .from('supplement_items')
          .insert({
            user_id: user.id,
            name: parsed.title,
            quantity_servings: parsed.quantity || 30, // Default 30 servings
            servings_per_day: parsed.servingsPerDay || 1, // Default 1 per day
            category_id: categoryId
          })

        if (error) throw error
        toast.success(`Supplement "${parsed.title}" added to tracker!`)
      } else {
        // Add as regular shopping task
        let description = `Category: ${parsed.category}`
        if (parsed.brand) description += `, Brand: ${parsed.brand}`
        if (parsed.quantity) description += `, Quantity: ${parsed.quantity}`

        const { error } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            title: parsed.title,
            description,
            priority: parsed.priority,
            status: 'pending'
          })

        if (error) throw error
        toast.success(`"${parsed.title}" added to shopping list!`)
      }

      setInput('')
      setSelectedType(null)

      // Refresh the page to show new data
      window.location.reload()

    } catch (error) {
      console.error('Error adding shopping item:', error)
      toast.error('Failed to add item. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add to shopping... 'Vitamin D 2000 IU 2 per day', 'Blue jeans size 32', 'Organic milk 2 liters'"
                className="pl-10 pr-12"
                disabled={isAdding}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                disabled={!input.trim() || isAdding}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Type:</span>
              <Button
                type="button"
                variant={selectedType === 'item' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'item' ? null : 'item')}
                className="h-8"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Item
              </Button>
              <Button
                type="button"
                variant={selectedType === 'supplement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'supplement' ? null : 'supplement')}
                className="h-8"
              >
                <Package className="h-3 w-3 mr-1" />
                Supplement
              </Button>
              <Button
                type="button"
                variant={selectedType === 'food' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'food' ? null : 'food')}
                className="h-8"
              >
                <Apple className="h-3 w-3 mr-1" />
                Food
              </Button>
              <Button
                type="button"
                variant={selectedType === 'clothing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === 'clothing' ? null : 'clothing')}
                className="h-8"
              >
                <Shirt className="h-3 w-3 mr-1" />
                Clothing
              </Button>
            </div>

            {input.trim() && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  Will create: {selectedType || 'auto-detect'}
                </Badge>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
