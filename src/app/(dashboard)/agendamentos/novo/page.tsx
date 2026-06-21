import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgendamentoForm } from '@/components/agendamentos/AgendamentoForm'
import type { Gestor } from '@/types/database'

export default async function NovoAgendamentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gestor } = await supabase
    .from('gestores')
    .select('*')
    .eq('auth_user_id', user.id)
    .single() as { data: Gestor | null }

  if (!gestor) redirect('/')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Novo Agendamento</h1>
        <p className="text-slate-500 text-sm mt-1">Preencha os dados do agendamento</p>
      </div>
      <AgendamentoForm gestorAtual={gestor} isAdmin={gestor.perfil === 'admin'} />
    </div>
  )
}
