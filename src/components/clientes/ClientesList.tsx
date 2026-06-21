'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Edit2, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import type { Cliente, Marca } from '@/types/database'

type ClienteComMarcas = Cliente & {
  cliente_marcas?: { marca_id: string; marcas: { id: string; nome: string } | null }[]
}

interface Props {
  clientes: ClienteComMarcas[]
  marcas: Marca[]
  isAdmin: boolean
}

export function ClientesList({ clientes: init, marcas, isAdmin }: Props) {
  const { toast } = useToast()
  const [busca, setBusca] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [clientes, setClientes] = useState<ClienteComMarcas[]>(init)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return clientes.filter(c => {
      const nome = c.nome.toLowerCase()
      const fantasia = c.fantasia?.toLowerCase() || ''
      const busca_low = busca.toLowerCase()
      if (busca && !nome.includes(busca_low) && !fantasia.includes(busca_low)) return false
      if (marcaFiltro && !c.cliente_marcas?.some(cm => cm.marca_id === marcaFiltro)) return false
      if (statusFiltro && c.status !== statusFiltro) return false
      return true
    })
  }, [clientes, busca, marcaFiltro, statusFiltro])

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este cliente?')) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      setClientes(prev => prev.filter(c => c.id !== id))
      toast('Cliente excluído.')
    } catch {
      toast('Erro ao excluir cliente.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={marcaFiltro}
            onChange={(e) => setMarcaFiltro(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas as marcas</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
          <span className="text-xs text-slate-400 self-center ml-auto">
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Fantasia</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Cidade/UF</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Marca</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{c.nome}</p>
                      {c.cnpj && <p className="text-xs text-slate-400">{c.cnpj}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">{c.fantasia || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                      {c.cidade && c.uf ? `${c.cidade}/${c.uf}` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                      {c.cliente_marcas?.map(cm => cm.marcas?.nome).filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.status === 'ativo' ? 'success' : 'gray'}>
                        {c.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/clientes/${c.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
