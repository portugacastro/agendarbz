import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MarcaForm } from '@/components/marcas/MarcaForm'
import type { Gestor } from '@/types/database'

export default async function NovaMarcaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gestor } = await supabase.from('gestores').select('*').eq('auth_user_id', user.id).single() as { data: Gestor | null }
  if (gestor?.perfil !== 'admin') redirect('/marcas')

  const { data: gestores } = await supabase.from('gestores').select('id, nome').eq('status', 'ativo').order('nome')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nova Marca</h1>
        <p className="text-slate-500 text-sm mt-1">Cadastre uma nova marca</p>
      </div>
      <MarcaForm gestores={gestores || []} />
    </div>
  )
}
