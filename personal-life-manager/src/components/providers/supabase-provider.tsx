'use client'

import { createClient } from '@/lib/supabase/client'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'
import type { Session } from '@supabase/supabase-js'

interface SupabaseProviderProps {
  children: React.ReactNode
  session: Session | null
}

export default function SupabaseProvider({
  children,
  session,
}: SupabaseProviderProps) {
  const [supabaseClient] = useState(() =>
    createClient()
  )

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={session}
    >
      {children}
    </SessionContextProvider>
  )
}
