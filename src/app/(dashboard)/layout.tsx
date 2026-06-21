import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Gestor } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: gestor } = await supabase
    .from('gestores')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="flex h-full min-h-screen">
      <Sidebar gestor={gestor as Gestor | null} />
      <main className="flex-1 overflow-auto">
        <div className="min-h-full p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
