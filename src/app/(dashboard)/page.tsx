import { createClient } from '@/lib/supabase/server'
import { Card, StatCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { Calendar, CheckCircle, Clock, XCircle, Plus, TrendingUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { STATUS_AGENDA_LABELS, STATUS_AGENDA_COLORS, TIPO_AGENDA_LABELS } from '@/lib/labels'
import type { Agendamento, Gestor } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: gestor } = await supabase
    .from('gestores')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single() as { data: Gestor | null }

  const isAdmin = gestor?.perfil === 'admin'
  const hoje = new Date()
  const inicioMes = format(startOfMonth(hoje), 'yyyy-MM-dd')
  const fimMes = format(endOfMonth(hoje), 'yyyy-MM-dd')
  const hojeStr = format(hoje, 'yyyy-MM-dd')

  let query = supabase.from('agendamentos').select('*')
  if (!isAdmin) query = query.eq('gestor_id', gestor?.id)

  const { data: todosMes } = await query
    .gte('data', inicioMes)
    .lte('data', fimMes)

  const agendamentos = (todosMes || []) as Agendamento[]

  const stats = {
    total: agendamentos.length,
    realizados: agendamentos.filter(a => ['realizada', 'concluida'].includes(a.status)).length,
    pendentes: agendamentos.filter(a => ['agendada', 'pendente'].includes(a.status)).length,
    cancelados: agendamentos.filter(a => a.status === 'cancelada').length,
  }

  let hojeQuery = supabase
    .from('agendamentos')
    .select('*, clientes(nome, fantasia), marcas(nome), gestores(nome)')
    .eq('data', hojeStr)
    .order('horario', { ascending: true })
  if (!isAdmin) hojeQuery = hojeQuery.eq('gestor_id', gestor?.id)
  const { data: agendamentosHoje } = await hojeQuery
  const hoje_list = (agendamentosHoje || []) as (Agendamento & {
    clientes: { nome: string; fantasia: string | null }
    marcas: { nome: string }
    gestores: { nome: string }
  })[]

  let proximosQuery = supabase
    .from('agendamentos')
    .select('*, clientes(nome, fantasia), marcas(nome)')
    .gt('data', hojeStr)
    .in('status', ['agendada', 'pendente'])
    .order('data', { ascending: true })
    .order('horario', { ascending: true })
    .limit(5)
  if (!isAdmin) proximosQuery = proximosQuery.eq('gestor_id', gestor?.id)
  const { data: proximos } = await proximosQuery

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {gestor?.nome?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(hoje, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Link
          href="/agendamentos/novo"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total no Mês"
          value={stats.total}
          subtitle="agendamentos"
          icon={<Calendar className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="Realizados"
          value={stats.realizados}
          subtitle={stats.total ? `${Math.round(stats.realizados / stats.total * 100)}% do total` : '—'}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          subtitle="aguardando"
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
        />
        <StatCard
          title="Cancelados"
          value={stats.cancelados}
          subtitle="neste mês"
          icon={<XCircle className="h-5 w-5" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoje */}
        <Card padding={false}>
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Agenda de Hoje
              <span className="ml-auto text-sm font-normal text-slate-500">
                {hoje_list.length} item{hoje_list.length !== 1 ? 's' : ''}
              </span>
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {hoje_list.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Nenhum agendamento para hoje</p>
              </div>
            ) : (
              hoje_list.map((a) => (
                <Link
                  key={a.id}
                  href={`/agendamentos/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-sm text-slate-500 w-12 flex-shrink-0">
                    {a.horario ? a.horario.slice(0, 5) : '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {a.clientes?.nome}
                    </p>
                    <p className="text-xs text-slate-500">
                      {TIPO_AGENDA_LABELS[a.tipo]} · {a.marcas?.nome}
                    </p>
                  </div>
                  <Badge className={STATUS_AGENDA_COLORS[a.status]}>
                    {STATUS_AGENDA_LABELS[a.status]}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Próximos */}
        <Card padding={false}>
          <div className="p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Próximos Agendamentos
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {(!proximos || proximos.length === 0) ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">Nenhum agendamento futuro</p>
              </div>
            ) : (
              proximos.map((a: any) => (
                <Link
                  key={a.id}
                  href={`/agendamentos/${a.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="text-sm text-center w-14 flex-shrink-0">
                    <p className="font-semibold text-slate-800">
                      {format(new Date(a.data + 'T00:00:00'), 'dd', { locale: ptBR })}
                    </p>
                    <p className="text-xs text-slate-400 uppercase">
                      {format(new Date(a.data + 'T00:00:00'), 'MMM', { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {a.clientes?.nome}
                    </p>
                    <p className="text-xs text-slate-500">
                      {TIPO_AGENDA_LABELS[a.tipo as keyof typeof TIPO_AGENDA_LABELS]} · {a.marcas?.nome}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          {proximos && proximos.length > 0 && (
            <div className="p-4 border-t border-slate-100">
              <Link href="/agendamentos" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver todos →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
