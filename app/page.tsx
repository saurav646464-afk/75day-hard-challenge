// app/page.tsx
// Main app page — protected, loads AppProvider + AppShell

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppProvider } from '@/components/AppProvider'
import AppShell from '@/components/AppShell'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <AppProvider userId={user.id}>
      <AppShell />
    </AppProvider>
  )
}
