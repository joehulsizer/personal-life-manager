'use client'

import { QuickAddBar } from '@/components/quick-add-bar'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface TasksQuickAddProps {
  categories: Category[]
}

export function TasksQuickAdd({ categories }: TasksQuickAddProps) {
  return <QuickAddBar categories={categories} />
}
