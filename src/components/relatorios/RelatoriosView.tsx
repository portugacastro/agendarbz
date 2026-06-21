'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, Search, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import {
  STATUS_AGENDA_LABELS, STATUS_AGENDA_COLORS,
  TIPO_AGENDA_LABELS, RESULTADO_AGENDA_LABELS,
} from '@/lib/labels'
import type { Marca, StatusAgenda, TipoAgenda, ResultadoAgenda } from '@/types/database'

interface Props {
  marcas: Marca[]
  gestores: { id: string; nome: string }[]
  isAdmin: boolean
  gestorId?: string
}

export function RelatoriosView({ marcas, gestores, isAdmin, gestorId }: Props) {
  const { toast } = useToast()
  const supabase = createClient()

  const hoje = format(new Date(), 'yyyy-MM-dd')
  const inicioMes = hoje.slice(0, 8) + '01'

  const [filtros, setFiltros] = useState({
    dataInicio: inicioMes,
    dataFim: hoje,
    marcaId: '',
    gestorId: '',
    status: '',
    tipo: '',
  })

  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const setF = (f: string, v: string) => setFiltros(prev => ({ ...prev, [f]: v }))

  async function buscar() {
    setLoading(true)
    try {
      let query = supabase
        .from('agendamentos')
        .select('*, clientes(nome, fantasia, cnpj, cidade, uf, tipo_cliente), marcas(nome), gestores(nome)')
        .order('data', { ascending: false })

      if (!isAdmin && gestorId) query = query.eq('gestor_id', gestorId)
      if (filtros.dataInicio) query = query.gte('data', filtros.dataInicio)
      if (filtros.dataFim) query = query.lte('data', filtros.dataFim)
      if (filtros.marcaId) query = query.eq('marca_id', filtros.marcaId)
      if (filtros.gestorId) query = query.eq('gestor_id', filtros.gestorId)
      if (filtros.status) query = query.eq('status', filtros.status)
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo)

      const { data, error } = await query
      if (error) throw error
      setDados(data || [])
      setBuscado(true)
    } catch (err: any) {
      toast(err.message || 'Erro ao buscar dados.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function exportarExcel() {
    if (dados.length === 0) { toast('Nenhum dado para exportar.', 'warning'); return }
    try {
      const { utils, writeFile } = await import('xlsx')
      const rows = dados.map(a => ({
        'Data': format(new Date(a.data + 'T00:00:00'), 'dd/MM/yyyy'),
        'Horário': a.horario ? a.horario.slice(0, 5) : '',
        'Marca': a.marcas?.nome || '',
        'Gestor': a.gestores?.nome || '',
        'Cliente': a.clientes?.nome || '',
        'Fantasia': a.clientes?.fantasia || '',
        'CNPJ': a.clientes?.cnpj || '',
        'Cidade': a.cidade || a.clientes?.cidade || '',
        'UF': a.clientes?.uf || '',
        'Tipo Cliente': a.clientes?.tipo_cliente || '',
        'Tipo Agenda': TIPO_AGENDA_LABELS[a.tipo as TipoAgenda] || a.tipo,
        'Canal': a.canal || '',
        'Objetivo': a.objetivo || '',
        'Assunto': a.assunto || '',
        'Status': STATUS_AGENDA_LABELS[a.status as StatusAgenda] || a.status,
        'Resultado': a.resultado ? (RESULTADO_AGENDA_LABELS[a.resultado as ResultadoAgenda] || a.resultado) : '',
        'Observações': a.observacoes || '',
      }))

      const ws = utils.json_to_sheet(rows)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'Agendamentos')
      writeFile(wb, `agendamentos_${filtros.dataInicio}_${filtros.dataFim}.xlsx`)
      toast('Arquivo exportado com sucesso!')
    } catch (err: any) {
      toast('Erro ao exportar arquivo.', 'error')
    }
  }

  const stats = buscado ? {
    total: dados.length,
    realizados: dados.filter(a => ['realizada', 'concluida'].includes(a.status)).length,
    cancelados: dados.filter(a => a.status === 'cancelada').length,
    pendentes: dados.filter(a => ['agendada', 'pendente'].includes(a.status)).length,
  } : null

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Filtros
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Data início</label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setF('dataInicio', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Data fim</label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setF('dataFim', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Marca</label>
            <select
              value={filtros.marcaId}
              onChange={(e) => setF('marcaId', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todas</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          {isAdmin && (
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Gestor</label>
              <select
                value={filtros.gestorId}
                onChange={(e) => setF('gestorId', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">Todos</option>
                {gestores.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Status</label>
            <select
              value={filtros.status}
              onChange={(e) => setF('status', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_AGENDA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setF('tipo', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Todos</option>
              {Object.entries(TIPO_AGENDA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button onClick={buscar} loading={loading}>
            <Search className="h-4 w-4" />
            Consultar
          </Button>
          {dados.length > 0 && (
            <Button variant="outline" onClick={exportarExcel}>
              <Download className="h-4 w-4" />
              Exportar Excel ({dados.length})
            </Button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-50 text-blue-700' },
            { label: 'Realizados', value: stats.realizados, color: 'bg-green-50 text-green-700' },
            { label: 'Pendentes', value: stats.pendentes, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Cancelados', value: stats.cancelados, color: 'bg-red-50 text-red-700' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-sm font-medium opacity-80">{s.label}</p>
              <p className="text-3xl font-bold mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {buscado && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Marca</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Gestor</th>}
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase hidden xl:table-cell">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Nenhum resultado encontrado
                    </td>
                  </tr>
                ) : (
                  dados.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                        {format(new Date(a.data + 'T00:00:00'), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{a.clientes?.nome}</p>
                        {a.clientes?.cidade && <p className="text-xs text-slate-400">{a.clientes.cidade}/{a.clientes.uf}</p>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">{a.marcas?.nome}</td>
                      {isAdmin && <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{a.gestores?.nome}</td>}
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-600">
                        {TIPO_AGENDA_LABELS[a.tipo as TipoAgenda] || a.tipo}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={STATUS_AGENDA_COLORS[a.status as StatusAgenda]}>
                          {STATUS_AGENDA_LABELS[a.status as StatusAgenda]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-slate-600 text-xs">
                        {a.resultado ? (RESULTADO_AGENDA_LABELS[a.resultado as ResultadoAgenda] || a.resultado) : '—'}
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
