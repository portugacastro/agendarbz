'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit2, Trash2, Building2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { Marca } from '@/types/database'

type MarcaComGestor = Marca & {
  gestor_marcas?: { gestores: { id: string; nome: string } | null }[]
}

export function MarcasList() {
  const { toast } = useToast()
  const [marcas, setMarcas] = useState<MarcaComGestor[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const [{ data: gestor }, { data: marcasData }] = await Promise.all([
        supabase.from('gestores').select('perfil').eq('auth_user_id', user.id).single(),
        supabase.from('marcas').select('*, gestor_marcas(gestores(id, nome))').order('nome'),
      ])

      setIsAdmin(gestor?.perfil === 'admin')
      setMarcas((marcasData as MarcaComGestor[]) || [])
      setLoading(false)
    })
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir esta marca?')) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('marcas').delete().eq('id', id)
      if (error) throw error
      setMarcas(prev => prev.filter(m => m.id !== id))
      toast('Marca excluída.')
    } catch {
      toast('Erro ao excluir marca.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marcas</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie as marcas comerciais</p>
        </div>
        {isAdmin && (
          <Link
            href="/marcas/novo"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Marca
          </Link>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-slate-400">Carregando marcas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marcas.length === 0 ? (
            <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400">Nenhuma marca cadastrada</p>
            </div>
          ) : (
            marcas.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{m.nome}</h3>
                      <Badge variant={m.status === 'ativo' ? 'success' : 'gray'} className="mt-0.5">
                        {m.status === 'ativo' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Link
                        href={`/marcas/${m.id}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deletingId === m.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  {m.gestor_marcas && m.gestor_marcas.length > 0 && (
                    <p>
                      <span className="text-slate-400">
                        {m.gestor_marcas.length === 1 ? 'Gestor:' : 'Gestores:'}
                      </span>{' '}
                      {m.gestor_marcas.map(gm => gm.gestores?.nome).filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
