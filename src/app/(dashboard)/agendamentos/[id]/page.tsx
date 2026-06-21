import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AgendamentoForm } from '@/components/agendamentos/AgendamentoForm'
import type { Gestor } from '@/types/database'

export default async function EditAgendamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gestor }, { data: agendamento }] = await Promise.all([
    supabase.from('gestores').select('*').eq('auth_user_id', user.id).single(),
    supabase
      .from('agendamentos')
      .select('*, clientes(*), marcas(*), gestores(*)')
      .eq('id', id)
      .single(),
  ])

  if (!gestor) redirect('/')
  if (!agendamento) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Agendamento</h1>
        <p className="text-slate-500 text-sm mt-1">
          Atualize os dados do agendamento
        </p>
      </div>
      <AgendamentoForm
        agendamento={agendamento as any}
        gestorAtual={gestor as Gestor}
        isAdmin={gestor.perfil === 'admin'}
      />
    </div>
  )
}
