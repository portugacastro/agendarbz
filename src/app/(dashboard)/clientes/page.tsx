import { createClient } from '@/lib/supabase/server'
import { ClientesList } from '@/components/clientes/ClientesList'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Gestor, Marca } from '@/types/database'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gestor } = await supabase
    .from('gestores')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single() as { data: Gestor | null }

  const isAdmin = gestor?.perfil === 'admin'

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*, cliente_marcas(marca_id, marcas(id, nome))')
    .order('nome')

  const { data: marcas } = await supabase
    .from('marcas')
    .select('id, nome')
    .eq('status', 'ativo')
    .order('nome')

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os clientes</p>
        </div>
        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Link>
      </div>

      <ClientesList
        clientes={clientes || []}
        marcas={(marcas || []) as Marca[]}
        isAdmin={isAdmin}
      />
    </div>
  )
}
