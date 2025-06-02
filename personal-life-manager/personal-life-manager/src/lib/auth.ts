import { createClient } from './supabase/client'

// Client-side auth functions
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/auth/login'
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  return await supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const supabase = createClient()
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || '',
      },
    },
  })
}