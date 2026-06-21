import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GestorForm } from '@/components/gestores/GestorForm'
import type { Gestor } from '@/types/database'

export default async function NovoGestorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gestor } = await supabase.from('gestores').select('*').eq('auth_user_id', user.id).single() as { data: Gestor | null }
  if (gestor?.perfil !== 'admin') redirect('/')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Gestor</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um novo gestor no sistema</p>
      </div>
      <GestorForm />
    </div>
  )
}
