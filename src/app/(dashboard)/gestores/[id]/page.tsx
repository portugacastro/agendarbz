import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { GestorForm } from '@/components/gestores/GestorForm'
import type { Gestor } from '@/types/database'

export default async function EditGestorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gestor }, { data: alvo }] = await Promise.all([
    supabase.from('gestores').select('*').eq('auth_user_id', user.id).single(),
    supabase.from('gestores').select('*').eq('id', id).single(),
  ])

  if (!gestor || gestor.perfil !== 'admin') redirect('/')
  if (!alvo) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Gestor</h1>
        <p className="text-slate-500 text-sm mt-1">{alvo.nome}</p>
      </div>
      <GestorForm gestor={alvo as Gestor} />
    </div>
  )
}
