'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Clock } from 'lucide-react'
import { STATUS_AGENDA_LABELS, STATUS_AGENDA_COLORS, TIPO_AGENDA_LABELS } from '@/lib/labels'
import type { StatusAgenda, TipoAgenda } from '@/types/database'

interface Props {
  historico: any[]
}

export function HistoricoCliente({ historico }: Props) {
  return (
    <Card padding={false}>
      <div className="p-5 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" />
          Histórico de Agendamentos ({historico.length})
        </h2>
      </div>
      {historico.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          Nenhum agendamento registrado para este cliente.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {historico.map(a => (
            <div key={a.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-900">
                      {format(new Date(a.data + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {a.horario && (
                      <span className="text-xs text-slate-400">{a.horario.slice(0, 5)}</span>
                    )}
                    <Badge className={STATUS_AGENDA_COLORS[a.status as StatusAgenda]}>
                      {STATUS_AGENDA_LABELS[a.status as StatusAgenda]}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {TIPO_AGENDA_LABELS[a.tipo as TipoAgenda]}
                    {a.marcas?.nome && ` · ${a.marcas.nome}`}
                    {a.gestores?.nome && ` · ${a.gestores.nome}`}
                  </p>
                  {a.objetivo && <p className="text-sm text-slate-500 mt-1">{a.objetivo}</p>}
                  {a.observacoes && (
                    <p className="text-xs text-slate-400 mt-1 italic">{a.observacoes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
