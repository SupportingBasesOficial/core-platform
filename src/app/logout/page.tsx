'use client'

import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/server/db/supabaseBrowser'

const supabase = createSupabaseBrowserClient()

export default function LogoutPage() {
  useEffect(() => {
    async function run() {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }

    run()
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <p>Saindo...</p>
    </main>
  )
}