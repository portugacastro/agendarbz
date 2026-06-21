import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GestoresList } from '@/components/gestores/GestoresList'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Gestor } from '@/types/database'

export default async function GestoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gestor } = await supabase
    .from('gestores').select('*').eq('auth_user_id', user!.id).single() as { data: Gestor | null }

  if (gestor?.perfil !== 'admin') redirect('/')

  const { data: gestores } = await supabase
    .from('gestores')
    .select('*')
    .order('nome')

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestores</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os gestores do sistema</p>
        </div>
        <Link
          href="/gestores/novo"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Gestor
        </Link>
      </div>

      <GestoresList gestores={(gestores || []) as Gestor[]} />
    </div>
  )
}
