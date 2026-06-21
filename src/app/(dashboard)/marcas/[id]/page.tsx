import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { MarcaForm } from '@/components/marcas/MarcaForm'
import type { Gestor } from '@/types/database'

export default async function EditMarcaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gestor }, { data: marca }, { data: gestores }, { data: gestorMarcas }] = await Promise.all([
    supabase.from('gestores').select('*').eq('auth_user_id', user.id).single(),
    supabase.from('marcas').select('*').eq('id', id).single(),
    supabase.from('gestores').select('id, nome').eq('status', 'ativo').order('nome'),
    supabase.from('gestor_marcas').select('gestor_id').eq('marca_id', id),
  ])

  if (!gestor || gestor.perfil !== 'admin') redirect('/marcas')
  if (!marca) notFound()

  const gestoresSelecionados = gestorMarcas?.map(gm => gm.gestor_id) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Marca</h1>
        <p className="text-slate-500 text-sm mt-1">{marca.nome}</p>
      </div>
      <MarcaForm marca={marca as any} gestores={gestores || []} gestoresSelecionados={gestoresSelecionados} />
    </div>
  )
}
