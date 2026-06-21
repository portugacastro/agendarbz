import type { TipoAgenda, StatusAgenda, ResultadoAgenda, CanalAgenda, StatusGenerico } from '@/types/database'

export const TIPO_AGENDA_LABELS: Record<TipoAgenda, string> = {
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  reuniao_presencial: 'Reunião Presencial',
  reuniao_online: 'Reunião Online',
  visita_comercial: 'Visita Comercial',
  pos_venda: 'Pós-Venda',
  reativacao: 'Reativação',
  cobranca: 'Cobrança',
  apresentacao_colecao: 'Apresentação de Coleção',
  follow_up: 'Follow-up',
  treinamento: 'Treinamento',
  outros: 'Outros',
}

export const STATUS_AGENDA_LABELS: Record<StatusAgenda, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  remarcada: 'Remarcada',
  nao_compareceu: 'Não Compareceu',
  sem_retorno: 'Sem Retorno',
  pendente: 'Pendente',
  concluida: 'Concluída',
}

export const STATUS_AGENDA_COLORS: Record<StatusAgenda, string> = {
  agendada: 'bg-blue-100 text-blue-800',
  realizada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  remarcada: 'bg-yellow-100 text-yellow-800',
  nao_compareceu: 'bg-orange-100 text-orange-800',
  sem_retorno: 'bg-gray-100 text-gray-800',
  pendente: 'bg-purple-100 text-purple-800',
  concluida: 'bg-teal-100 text-teal-800',
}

export const RESULTADO_AGENDA_LABELS: Record<ResultadoAgenda, string> = {
  interessado: 'Interessado',
  sem_interesse: 'Sem Interesse',
  pediu_retorno: 'Pediu Retorno',
  comprou: 'Comprou',
  nao_comprou: 'Não Comprou',
  nova_visita: 'Nova Visita',
  material: 'Material Enviado',
  treinamento: 'Treinamento',
  problema_financeiro: 'Problema Financeiro',
  problema_giro: 'Problema de Giro',
  outro: 'Outro',
}

export const CANAL_AGENDA_LABELS: Record<CanalAgenda, string> = {
  telefone: 'Telefone',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  online: 'Online',
  email: 'E-mail',
  outro: 'Outro',
}

export const STATUS_GENERICO_LABELS: Record<StatusGenerico, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
}

export const UF_OPTIONS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]
