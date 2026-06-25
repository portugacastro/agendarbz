'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Tag, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  STATUS_AGENDA_LABELS, STATUS_AGENDA_COLORS,
  TIPO_AGENDA_LABELS, CANAL_AGENDA_LABELS,
} from '@/lib/labels'
import type { StatusAgenda, TipoAgenda, CanalAgenda } from '@/types/database'

const STATUS_PILL: Record<StatusAgenda, string> = {
  agendada: 'bg-blue-500 text-white',
  realizada: 'bg-green-500 text-white',
  cancelada: 'bg-red-400 text-white',
  remarcada: 'bg-yellow-400 text-slate-800',
  nao_compareceu: 'bg-orange-400 text-white',
  sem_retorno: 'bg-slate-400 text-white',
  pendente: 'bg-purple-500 text-white',
  concluida: 'bg-teal-500 text-white',
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface Props {
  agendamentos: any[]
}

export function CalendarView({ agendamentos }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState<any | null>(null)
  const today = new Date()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const days: Date[] = []
  let d = calStart
  while (d <= calEnd) { days.push(d); d = addDays(d, 1) }

  const byDate = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const a of agendamentos) {
      if (!map[a.data]) map[a.data] = []
      map[a.data].push(a)
    }
    return map
  }, [agendamentos])

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(today)}
              className="px-3 py-1.5 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors ml-1"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          <h2 className="text-base font-semibold text-slate-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="w-24" />
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {DIAS.map(dia => (
            <div key={dia} className="text-center text-xs font-medium text-slate-500 py-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 divide-x divide-slate-100">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const eventos = (byDate[dateStr] || []).sort((a: any, b: any) =>
              (a.horario || '').localeCompare(b.horario || '')
            )
            const inMonth = isSameMonth(day, currentDate)
            const isToday = isSameDay(day, today)

            return (
              <div
                key={i}
                className={`min-h-[110px] p-1.5 border-b border-slate-100 ${!inMonth ? 'bg-slate-50/60' : ''}`}
              >
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 ${
                  isToday
                    ? 'bg-blue-600 text-white font-bold'
                    : inMonth ? 'text-slate-700 font-medium' : 'text-slate-300'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5">
                  {eventos.map((a: any) => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      title={`${a.marcas?.nome} · ${a.clientes?.fantasia || a.clientes?.nome} · ${a.gestores?.nome}`}
                      className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate leading-4 ${STATUS_PILL[a.status as StatusAgenda] || 'bg-slate-200 text-slate-700'}`}
                    >
                      {a.horario && <span className="font-semibold">{a.horario.slice(0, 5)} </span>}
                      <span>{a.marcas?.nome}</span>
                      {(a.clientes?.fantasia || a.clientes?.nome) && (
                        <span className="opacity-80"> · {a.clientes?.fantasia || a.clientes?.nome}</span>
                      )}
                      {a.gestores?.nome && (
                        <span className="opacity-70"> · {a.gestores.nome}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do Agendamento" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Data</p>
                <p className="font-semibold text-slate-900">
                  {format(new Date(selected.data + 'T00:00:00'), 'dd/MM/yyyy')}
                </p>
              </div>
              {selected.horario && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Clock className="h-3 w-3" /> Horário</p>
                  <p className="font-semibold text-slate-900">{selected.horario.slice(0, 5)}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><Tag className="h-3 w-3" /> Marca</p>
                <p className="font-medium text-slate-900">{selected.marcas?.nome || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5 flex items-center gap-1"><User className="h-3 w-3" /> Gestor</p>
                <p className="font-medium text-slate-900">{selected.gestores?.nome || '—'}</p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-0.5">Lojista / Cliente</p>
                <p className="font-medium text-slate-900">{selected.clientes?.nome}</p>
                {selected.clientes?.fantasia && (
                  <p className="text-sm text-slate-500">{selected.clientes.fantasia}</p>
                )}
                {selected.clientes?.cidade && (
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selected.clientes.cidade}/{selected.clientes.uf}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-0.5">Tipo</p>
                <p className="text-sm text-slate-700">{TIPO_AGENDA_LABELS[selected.tipo as TipoAgenda] || selected.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Canal</p>
                <p className="text-sm text-slate-700">
                  {selected.canal ? CANAL_AGENDA_LABELS[selected.canal as CanalAgenda] : '—'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <Badge className={STATUS_AGENDA_COLORS[selected.status as StatusAgenda]}>
                  {STATUS_AGENDA_LABELS[selected.status as StatusAgenda]}
                </Badge>
              </div>

              {selected.objetivo && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Objetivo</p>
                  <p className="text-sm text-slate-700">{selected.objetivo}</p>
                </div>
              )}
              {selected.assunto && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Assunto</p>
                  <p className="text-sm text-slate-700">{selected.assunto}</p>
                </div>
              )}
              {selected.observacoes && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Observações</p>
                  <p className="text-sm text-slate-700">{selected.observacoes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Link
                href={`/agendamentos/${selected.id}`}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Editar agendamento
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
