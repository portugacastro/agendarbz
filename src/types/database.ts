export type PerfilAcesso = 'admin' | 'gestor'
export type StatusGenerico = 'ativo' | 'inativo'
export type TipoAgenda =
  | 'ligacao' | 'whatsapp' | 'reuniao_presencial' | 'reuniao_online'
  | 'visita_comercial' | 'pos_venda' | 'reativacao' | 'cobranca'
  | 'apresentacao_colecao' | 'follow_up' | 'treinamento' | 'outros'
export type StatusAgenda =
  | 'agendada' | 'realizada' | 'cancelada' | 'remarcada'
  | 'nao_compareceu' | 'sem_retorno' | 'pendente' | 'concluida'
export type ResultadoAgenda =
  | 'interessado' | 'sem_interesse' | 'pediu_retorno' | 'comprou' | 'nao_comprou'
  | 'nova_visita' | 'material' | 'treinamento' | 'problema_financeiro'
  | 'problema_giro' | 'outro'
export type CanalAgenda = 'telefone' | 'whatsapp' | 'presencial' | 'online' | 'email' | 'outro'

export interface Gestor {
  id: string
  auth_user_id: string | null
  nome: string
  login: string
  telefone: string | null
  perfil: PerfilAcesso
  status: StatusGenerico
  created_at: string
  updated_at: string
}

export interface Marca {
  id: string
  nome: string
  gestor_id: string | null
  coordenador: string | null
  regiao: string | null
  meta_agendamentos: number
  status: StatusGenerico
  created_at: string
  updated_at: string
  gestores?: Gestor
}

export interface MarcaLocalidade {
  id: string
  marca_id: string
  cidade: string
  uf: string
}

export interface Cliente {
  id: string
  nome: string
  cnpj: string | null
  fantasia: string | null
  cidade: string | null
  uf: string | null
  telefone: string | null
  instagram: string | null
  marca_id: string | null
  tipo_cliente: string | null
  observacoes: string | null
  status: StatusGenerico
  created_at: string
  updated_at: string
  marcas?: Marca
}

export interface Agendamento {
  id: string
  data: string
  horario: string | null
  marca_id: string
  gestor_id: string
  cliente_id: string
  cidade: string | null
  tipo: TipoAgenda
  canal: CanalAgenda | null
  objetivo: string | null
  assunto: string | null
  status: StatusAgenda
  resultado: ResultadoAgenda | null
  observacoes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  marcas?: Marca
  gestores?: Gestor
  clientes?: Cliente
}

export interface Remarcacao {
  id: string
  agendamento_id: string
  data_original: string
  data_nova: string
  motivo: string | null
  responsavel_id: string | null
  created_at: string
}

export interface Meta {
  id: string
  marca_id: string | null
  gestor_id: string | null
  periodo_inicio: string
  periodo_fim: string
  meta_quantidade: number
  created_at: string
  gestores?: Gestor
  marcas?: Marca
}

export interface HistoricoAlteracao {
  id: string
  tabela: string
  registro_id: string
  campo: string | null
  valor_antigo: string | null
  valor_novo: string | null
  alterado_por: string | null
  alterado_em: string
}
