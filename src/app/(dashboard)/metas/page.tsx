import { createClient } from '@/lib/supabase/server'
import { MetasView } from '@/components/metas/MetasView'
import type { Gestor } from '@/types/database'

export default async function MetasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gestor } = await supabase
    .from('gestores').select('*').eq('auth_user_id', user!.id).single() as { data: Gestor | null }

  const isAdmin = gestor?.perfil === 'admin'

  const [{ data: metas }, { data: gestores }, { data: marcas }] = await Promise.all([
    isAdmin
      ? supabase.from('metas').select('*, gestores(nome), marcas(nome)').order('periodo_inicio', { ascending: false })
      : supabase.from('metas').select('*, gestores(nome), marcas(nome)').eq('gestor_id', gestor?.id).order('periodo_inicio', { ascending: false }),
    isAdmin
      ? supabase.from('gestores').select('id, nome').eq('status', 'ativo').order('nome')
      : { data: gestor ? [{ id: gestor.id, nome: gestor.nome }] : [] },
    supabase.from('marcas').select('id, nome').eq('status', 'ativo').order('nome'),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Metas</h1>
        <p className="text-slate-500 text-sm mt-1">Acompanhe e defina as metas de agendamentos</p>
      </div>

      <MetasView
        metas={metas || []}
        gestores={gestores || []}
        marcas={marcas || []}
        isAdmin={isAdmin}
        gestorAtualId={gestor?.id}
      />
    </div>
  )
}
