import { createClient } from '@/lib/supabase/server'
import { AgendamentosList } from '@/components/agendamentos/AgendamentosList'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Gestor, Marca } from '@/types/database'

export default async function AgendamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gestor } = await supabase
    .from('gestores')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single() as { data: Gestor | null }

  const isAdmin = gestor?.perfil === 'admin'

  let agendQuery = supabase
    .from('agendamentos')
    .select('*, clientes(id, nome, fantasia, cidade, uf), marcas(id, nome), gestores(id, nome)')
    .order('data', { ascending: false })
    .order('horario', { ascending: true })
    .limit(200)

  if (!isAdmin) agendQuery = agendQuery.eq('gestor_id', gestor?.id)

  const { data: agendamentos } = await agendQuery

  const { data: marcas } = await supabase
    .from('marcas')
    .select('id, nome')
    .eq('status', 'ativo')
    .order('nome')

  let gestoresData = null
  if (isAdmin) {
    const { data } = await supabase
      .from('gestores')
      .select('id, nome')
      .eq('status', 'ativo')
      .order('nome')
    gestoresData = data
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie todos os agendamentos</p>
        </div>
        <Link
          href="/agendamentos/novo"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo
        </Link>
      </div>

      <AgendamentosList
        agendamentos={agendamentos || []}
        marcas={(marcas || []) as Marca[]}
        gestores={gestoresData || []}
        isAdmin={isAdmin}
        gestorAtualId={gestor?.id}
      />
    </div>
  )
}
