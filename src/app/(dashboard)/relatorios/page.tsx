import { createClient } from '@/lib/supabase/server'
import { RelatoriosView } from '@/components/relatorios/RelatoriosView'
import type { Gestor, Marca } from '@/types/database'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gestor } = await supabase
    .from('gestores').select('*').eq('auth_user_id', user!.id).single() as { data: Gestor | null }

  const isAdmin = gestor?.perfil === 'admin'

  const [{ data: marcas }, { data: gestores }] = await Promise.all([
    supabase.from('marcas').select('id, nome').eq('status', 'ativo').order('nome'),
    isAdmin
      ? supabase.from('gestores').select('id, nome').eq('status', 'ativo').order('nome')
      : { data: null },
  ])

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-1">Consulte e exporte dados de agendamentos</p>
      </div>

      <RelatoriosView
        marcas={(marcas || []) as Marca[]}
        gestores={gestores || []}
        isAdmin={isAdmin}
        gestorId={gestor?.id}
      />
    </div>
  )
}
