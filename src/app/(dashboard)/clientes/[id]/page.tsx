import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ClienteForm } from '@/components/clientes/ClienteForm'
import { HistoricoCliente } from '@/components/clientes/HistoricoCliente'
import type { Gestor } from '@/types/database'

export default async function EditClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gestor }, { data: cliente }, { data: historico }, { data: clienteMarcas }] = await Promise.all([
    supabase.from('gestores').select('*').eq('auth_user_id', user.id).single(),
    supabase.from('clientes').select('*').eq('id', id).single(),
    supabase.from('agendamentos')
      .select('*, marcas(nome), gestores(nome)')
      .eq('cliente_id', id)
      .order('data', { ascending: false })
      .limit(20),
    supabase.from('cliente_marcas').select('marca_id').eq('cliente_id', id),
  ])

  if (!gestor) redirect('/')
  if (!cliente) notFound()

  const marcasSelecionadas = clienteMarcas?.map(cm => cm.marca_id) || []

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Editar Cliente</h1>
        <p className="text-slate-500 text-sm mt-1">{cliente.nome}</p>
      </div>
      <ClienteForm cliente={cliente as any} marcasSelecionadas={marcasSelecionadas} isAdmin={gestor.perfil === 'admin'} />
      <HistoricoCliente historico={historico || []} />
    </div>
  )
}
