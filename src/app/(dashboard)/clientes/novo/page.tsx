import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import type { Gestor } from '@/types/database'

export default async function NovoClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gestor } = await supabase
    .from('gestores').select('*').eq('auth_user_id', user.id).single() as { data: Gestor | null }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Cliente</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre um novo cliente</p>
      </div>
      <ClienteForm isAdmin={gestor?.perfil === 'admin'} />
    </div>
  )
}
