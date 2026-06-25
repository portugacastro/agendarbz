'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Edit2, Trash2, List, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import {
  STATUS_AGENDA_LABELS, STATUS_AGENDA_COLORS,
  TIPO_AGENDA_LABELS, CANAL_AGENDA_LABELS,
} from '@/lib/labels'
import type { Agendamento, Marca, StatusAgenda, TipoAgenda } from '@/types/database'
import { CalendarView } from './CalendarView'

interface Props {
  agendamentos: any[]
  marcas: Marca[]
  gestores: { id: string; nome: string }[]
  isAdmin: boolean
  gestorAtualId?: string
}

const STATUS_OPTIONS: { value: StatusAgenda | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'agendada', label: 'Agendada' },
  { value: 'realizada', label: 'Realizada' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'remarcada', label: 'Remarcada' },
  { value: 'nao_compareceu', label: 'Não Compareceu' },
  { value: 'sem_retorno', label: 'Sem Retorno' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'concluida', label: 'Concluída' },
]

export function AgendamentosList({ agendamentos, marcas, gestores, isAdmin, gestorAtualId }: Props) {
  const { toast } = useToast()
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState('')
  const [gestorFiltro, setGestorFiltro] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [lista, setLista] = useState(agendamentos)
  const [view, setView] = useState<'lista' | 'calendario'>('lista')

  const filtered = useMemo(() => {
    return lista.filter((a) => {
      const nomeCliente = a.clientes?.nome?.toLowerCase() || ''
      const fantasia = a.clientes?.fantasia?.toLowerCase() || ''
      const buscaLow = busca.toLowerCase()

      if (busca && !nomeCliente.includes(buscaLow) && !fantasia.includes(buscaLow)) return false
      if (statusFiltro && a.status !== statusFiltro) return false
      if (marcaFiltro && a.marca_id !== marcaFiltro) return false
      if (gestorFiltro && a.gestor_id !== gestorFiltro) return false
      if (dataInicio && a.data < dataInicio) return false
      if (dataFim && a.data > dataFim) return false
      return true
    })
  }, [lista, busca, statusFiltro, marcaFiltro, gestorFiltro, dataInicio, dataFim])

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir este agendamento?')) return
    setDeletingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('agendamentos').delete().eq('id', id)
      if (error) throw error
      setLista(prev => prev.filter(a => a.id !== id))
      toast('Agendamento excluído com sucesso.')
    } catch {
      toast('Erro ao excluir agendamento.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 ml-auto shrink-0">
            <button
              onClick={() => setView('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'lista' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setView('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === 'calendario' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              Calendário
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={marcaFiltro}
            onChange={(e) => setMarcaFiltro(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Todas as marcas</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>

          {isAdmin && (
            <select
              value={gestorFiltro}
              onChange={(e) => setGestorFiltro(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos os gestores</option>
              {gestores.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
            </select>
          )}
        </div>

        <div className="flex gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">De:</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Até:</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          {(busca || statusFiltro || marcaFiltro || gestorFiltro || dataInicio || dataFim) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setBusca(''); setStatusFiltro(''); setMarcaFiltro(''); setGestorFiltro(''); setDataInicio(''); setDataFim('') }}
            >
              Limpar filtros
            </Button>
          )}
          <span className="ml-auto text-xs text-slate-400 self-center">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content: Calendar or Table */}
      {view === 'calendario' ? (
        <CalendarView agendamentos={filtered} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">Marca</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden xl:table-cell">Gestor</th>}
                  <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="text-center py-12 text-slate-400">
                      Nenhum agendamento encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-slate-900">
                          {format(new Date(a.data + 'T00:00:00'), 'dd/MM/yyyy')}
                        </p>
                        {a.horario && (
                          <p className="text-xs text-slate-400">{a.horario.slice(0, 5)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{a.clientes?.nome}</p>
                        {a.clientes?.fantasia && (
                          <p className="text-xs text-slate-400">{a.clientes.fantasia}</p>
                        )}
                        {a.clientes?.cidade && (
                          <p className="text-xs text-slate-400">{a.clientes.cidade}/{a.clientes.uf}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-700">{a.marcas?.nome}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-600">{TIPO_AGENDA_LABELS[a.tipo as TipoAgenda]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_AGENDA_COLORS[a.status as StatusAgenda]}>
                          {STATUS_AGENDA_LABELS[a.status as StatusAgenda]}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 hidden xl:table-cell text-slate-600">
                          {a.gestores?.nome}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/agendamentos/${a.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(a.id)}
                            disabled={deletingId === a.id}
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
      )}
    </div>
  )
}
