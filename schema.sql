-- =====================================================================
-- AGENDA COMERCIAL RBZ - Schema Supabase (PostgreSQL)
-- Cole TODO esse conteudo no SQL Editor do Supabase e clique em Correr
-- =====================================================================

-- ---------- EXTENSOES ----------
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. ENUMS (tipos controlados)
-- =====================================================================
create type perfil_acesso as enum ('admin', 'gestor');

create type status_generico as enum ('ativo', 'inativo');

create type tipo_agenda as enum (
  'ligacao', 'whatsapp', 'reuniao_presencial', 'reuniao_online',
  'visita_comercial', 'pos_venda', 'reativacao', 'cobranca',
  'apresentacao_colecao', 'follow_up', 'treinamento', 'outros'
);

create type status_agenda as enum (
  'agendada', 'realizada', 'cancelada', 'remarcada',
  'nao_compareceu', 'sem_retorno', 'pendente', 'concluida'
);

create type resultado_agenda as enum (
  'interessado', 'sem_interesse', 'pediu_retorno', 'comprou', 'nao_comprou',
  'nova_visita', 'material', 'treinamento', 'problema_financeiro',
  'problema_giro', 'outro'
);

create type canal_agenda as enum (
  'telefone', 'whatsapp', 'presencial', 'online', 'email', 'outro'
);

-- =====================================================================
-- 2. TABELAS
-- =====================================================================

-- ---------- GESTORES ----------
create table gestores (
  id           uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nome         text not null,
  login        text unique not null,
  telefone     text,
  perfil       perfil_acesso not null default 'gestor',
  status       status_generico not null default 'ativo',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- MARCAS ----------
create table marcas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  gestor_id     uuid references gestores(id) on delete set null,
  coordenador   text,
  regiao        text,
  meta_agendamentos integer default 0,
  status        status_generico not null default 'ativo',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Cidades/estados de atuacao da marca
create table marca_localidades (
  id        uuid primary key default gen_random_uuid(),
  marca_id  uuid not null references marcas(id) on delete cascade,
  cidade    text not null,
  uf        char(2) not null,
  unique (marca_id, cidade, uf)
);

-- Vinculo N:N entre gestores e marcas
create table gestor_marcas (
  gestor_id uuid not null references gestores(id) on delete cascade,
  marca_id  uuid not null references marcas(id) on delete cascade,
  primary key (gestor_id, marca_id)
);

-- ---------- CLIENTES ----------
create table clientes (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  cnpj         text,
  fantasia     text,
  cidade       text,
  uf           char(2),
  telefone     text,
  instagram    text,
  marca_id     uuid references marcas(id) on delete set null,
  tipo_cliente text,
  observacoes  text,
  status       status_generico not null default 'ativo',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- AGENDAMENTOS ----------
create table agendamentos (
  id           uuid primary key default gen_random_uuid(),
  data         date not null,
  horario      time,
  marca_id     uuid not null references marcas(id) on delete restrict,
  gestor_id    uuid not null references gestores(id) on delete restrict,
  cliente_id   uuid not null references clientes(id) on delete restrict,
  cidade       text,
  tipo         tipo_agenda not null,
  canal        canal_agenda,
  objetivo     text,
  assunto      text,
  status       status_agenda not null default 'agendada',
  resultado    resultado_agenda,
  observacoes  text,
  created_by   uuid references gestores(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------- REMARCACOES ----------
create table remarcacoes (
  id              uuid primary key default gen_random_uuid(),
  agendamento_id  uuid not null references agendamentos(id) on delete cascade,
  data_original   date not null,
  data_nova       date not null,
  motivo          text,
  responsavel_id  uuid references gestores(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ---------- METAS ----------
create table metas (
  id            uuid primary key default gen_random_uuid(),
  marca_id      uuid references marcas(id) on delete cascade,
  gestor_id     uuid references gestores(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fim    date not null,
  meta_quantidade integer not null default 0,
  created_at     timestamptz not null default now(),
  check (periodo_fim >= periodo_inicio)
);

-- ---------- HISTORICO DE ALTERACOES ----------
create table historico_alteracoes (
  id          uuid primary key default gen_random_uuid(),
  tabela      text not null,
  registro_id uuid not null,
  campo       text,
  valor_antigo text,
  valor_novo  text,
  alterado_por uuid references gestores(id) on delete set null,
  alterado_em timestamptz not null default now()
);

-- =====================================================================
-- 3. INDICES
-- =====================================================================
create index idx_agend_data       on agendamentos(data);
create index idx_agend_marca      on agendamentos(marca_id);
create index idx_agend_gestor     on agendamentos(gestor_id);
create index idx_agend_cliente    on agendamentos(cliente_id);
create index idx_agend_status     on agendamentos(status);
create index idx_agend_tipo       on agendamentos(tipo);
create index idx_clientes_marca   on clientes(marca_id);
create index idx_clientes_uf      on clientes(uf);
create index idx_marcas_gestor    on marcas(gestor_id);

-- =====================================================================
-- 4. TRIGGER updated_at
-- =====================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_gestores_upd     before update on gestores     for each row execute function set_updated_at();
create trigger trg_marcas_upd       before update on marcas       for each row execute function set_updated_at();
create trigger trg_clientes_upd     before update on clientes     for each row execute function set_updated_at();
create trigger trg_agendamentos_upd before update on agendamentos for each row execute function set_updated_at();

-- =====================================================================
-- 5. RLS (Row Level Security)
-- =====================================================================

create or replace function current_gestor_id()
returns uuid language sql stable as $$
  select id from gestores where auth_user_id = auth.uid()
$$;

create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from gestores
    where auth_user_id = auth.uid() and perfil = 'admin'
  )
$$;

alter table gestores      enable row level security;
alter table marcas        enable row level security;
alter table marca_localidades enable row level security;
alter table gestor_marcas enable row level security;
alter table clientes      enable row level security;
alter table agendamentos  enable row level security;
alter table remarcacoes   enable row level security;
alter table metas         enable row level security;
alter table historico_alteracoes enable row level security;

-- GESTORES
create policy gestores_admin_all on gestores
  for all using (is_admin()) with check (is_admin());
create policy gestores_self_read on gestores
  for select using (auth_user_id = auth.uid());

-- MARCAS
create policy marcas_admin_all on marcas
  for all using (is_admin()) with check (is_admin());
create policy marcas_gestor_read on marcas
  for select using (
    gestor_id = current_gestor_id()
    or exists (
      select 1 from gestor_marcas gm
      where gm.marca_id = marcas.id and gm.gestor_id = current_gestor_id()
    )
  );

-- MARCA_LOCALIDADES
create policy localidades_admin_all on marca_localidades
  for all using (is_admin()) with check (is_admin());
create policy localidades_gestor_read on marca_localidades
  for select using (
    exists (
      select 1 from marcas m
      where m.id = marca_localidades.marca_id
        and (m.gestor_id = current_gestor_id()
             or exists (select 1 from gestor_marcas gm
                        where gm.marca_id = m.id and gm.gestor_id = current_gestor_id()))
    )
  );

-- GESTOR_MARCAS
create policy gestor_marcas_admin_all on gestor_marcas
  for all using (is_admin()) with check (is_admin());
create policy gestor_marcas_self_read on gestor_marcas
  for select using (gestor_id = current_gestor_id());

-- CLIENTES
create policy clientes_admin_all on clientes
  for all using (is_admin()) with check (is_admin());
create policy clientes_gestor_read on clientes
  for select using (
    marca_id in (
      select id from marcas where gestor_id = current_gestor_id()
      union
      select marca_id from gestor_marcas where gestor_id = current_gestor_id()
    )
  );

-- AGENDAMENTOS
create policy agend_admin_all on agendamentos
  for all using (is_admin()) with check (is_admin());
create policy agend_gestor_select on agendamentos
  for select using (gestor_id = current_gestor_id());
create policy agend_gestor_insert on agendamentos
  for insert with check (gestor_id = current_gestor_id());
create policy agend_gestor_update on agendamentos
  for update using (gestor_id = current_gestor_id())
  with check (gestor_id = current_gestor_id());

-- REMARCACOES
create policy remarc_admin_all on remarcacoes
  for all using (is_admin()) with check (is_admin());
create policy remarc_gestor on remarcacoes
  for all using (
    exists (select 1 from agendamentos a
            where a.id = remarcacoes.agendamento_id
              and a.gestor_id = current_gestor_id())
  )
  with check (
    exists (select 1 from agendamentos a
            where a.id = remarcacoes.agendamento_id
              and a.gestor_id = current_gestor_id())
  );

-- METAS
create policy metas_admin_all on metas
  for all using (is_admin()) with check (is_admin());
create policy metas_gestor_read on metas
  for select using (gestor_id = current_gestor_id());

-- HISTORICO
create policy historico_admin_all on historico_alteracoes
  for all using (is_admin()) with check (is_admin());

-- =====================================================================
-- 6. VIEWS PARA DASHBOARD
-- =====================================================================

create or replace view vw_resumo_status as
select
  marca_id,
  gestor_id,
  status,
  count(*) as total
from agendamentos
group by marca_id, gestor_id, status;

create or replace view vw_metas_por_representante as
select
  mt.id                       as meta_id,
  g.id                        as gestor_id,
  g.nome                      as representante,
  mt.periodo_inicio,
  mt.periodo_fim,
  mt.meta_quantidade,
  count(a.id)                 as realizados,
  case when mt.meta_quantidade > 0
       then round(count(a.id)::numeric / mt.meta_quantidade * 100, 1)
       else 0 end             as percentual_atingido,
  case when count(a.id) >= mt.meta_quantidade
       then 'dentro_meta' else 'fora_meta' end as situacao_meta
from metas mt
join gestores g on g.id = mt.gestor_id
left join agendamentos a
  on a.gestor_id = mt.gestor_id
 and (mt.marca_id is null or a.marca_id = mt.marca_id)
 and a.data between mt.periodo_inicio and mt.periodo_fim
 and a.status in ('realizada', 'concluida')
where mt.gestor_id is not null
group by mt.id, g.id, g.nome, mt.periodo_inicio, mt.periodo_fim, mt.meta_quantidade;

create or replace view vw_metas_por_marca as
select
  m.id                        as marca_id,
  m.nome                      as marca,
  g.nome                      as gestor_responsavel,
  mt.periodo_inicio,
  mt.periodo_fim,
  coalesce(mt.meta_quantidade, m.meta_agendamentos) as meta_quantidade,
  count(a.id)                 as realizados,
  case when coalesce(mt.meta_quantidade, m.meta_agendamentos) > 0
       then round(count(a.id)::numeric
            / coalesce(mt.meta_quantidade, m.meta_agendamentos) * 100, 1)
       else 0 end             as percentual_atingido,
  case when count(a.id) >= coalesce(mt.meta_quantidade, m.meta_agendamentos)
       then 'dentro_meta' else 'fora_meta' end as situacao_meta
from marcas m
left join gestores g on g.id = m.gestor_id
left join metas mt on mt.marca_id = m.id
left join agendamentos a
  on a.marca_id = m.id
 and (mt.periodo_inicio is null
      or a.data between mt.periodo_inicio and mt.periodo_fim)
 and a.status in ('realizada', 'concluida')
group by m.id, m.nome, g.nome, mt.periodo_inicio, mt.periodo_fim,
         mt.meta_quantidade, m.meta_agendamentos;

create or replace view vw_ranking_representante as
select
  g.id    as gestor_id,
  g.nome  as representante,
  count(a.id) filter (where a.status in ('realizada','concluida')) as realizados,
  count(a.id) filter (where a.status = 'pendente')   as pendentes,
  count(a.id) filter (where a.status = 'cancelada')  as cancelados,
  count(a.id) filter (where a.status = 'remarcada')  as remarcados,
  count(a.id) as total_agendamentos
from gestores g
left join agendamentos a on a.gestor_id = g.id
where g.perfil = 'gestor'
group by g.id, g.nome
order by realizados desc;

-- =====================================================================
-- 7. SECURITY INVOKER NAS VIEWS
-- =====================================================================
alter view vw_resumo_status            set (security_invoker = on);
alter view vw_metas_por_representante  set (security_invoker = on);
alter view vw_metas_por_marca          set (security_invoker = on);
alter view vw_ranking_representante    set (security_invoker = on);

-- =====================================================================
-- 8. AUDITORIA AUTOMATICA
-- =====================================================================
create or replace function registrar_alteracao()
returns trigger language plpgsql security definer as $$
declare
  v_gestor uuid;
begin
  select id into v_gestor from gestores where auth_user_id = auth.uid();
  insert into historico_alteracoes (tabela, registro_id, campo, valor_antigo, valor_novo, alterado_por)
  values (
    tg_table_name,
    new.id,
    'registro_completo',
    row_to_json(old)::text,
    row_to_json(new)::text,
    v_gestor
  );
  return new;
end $$;

create trigger trg_audit_agendamentos
  after update on agendamentos
  for each row execute function registrar_alteracao();

create trigger trg_audit_clientes
  after update on clientes
  for each row execute function registrar_alteracao();

create trigger trg_audit_marcas
  after update on marcas
  for each row execute function registrar_alteracao();

-- =====================================================================
-- 9. VIEW - HISTORICO DO CLIENTE
-- =====================================================================
create or replace view vw_historico_cliente as
select
  c.id          as cliente_id,
  c.nome        as cliente,
  c.fantasia,
  c.cidade      as cliente_cidade,
  c.uf          as cliente_uf,
  m.nome        as marca,
  a.id          as agendamento_id,
  a.data,
  a.horario,
  a.tipo,
  a.canal,
  a.objetivo,
  a.assunto,
  a.status,
  a.resultado,
  a.observacoes,
  g.nome        as gestor,
  a.created_at  as registrado_em
from clientes c
left join agendamentos a on a.cliente_id = c.id
left join marcas m       on m.id = c.marca_id
left join gestores g     on g.id = a.gestor_id
order by c.nome, a.data desc, a.horario desc;

alter view vw_historico_cliente set (security_invoker = on);

-- =====================================================================
-- 10. VIEW - EXPORTACAO EXCEL
-- =====================================================================
create or replace view vw_export_agendamentos as
select
  a.data,
  a.horario,
  m.nome        as marca,
  g.nome        as gestor,
  c.nome        as cliente,
  c.fantasia    as cliente_fantasia,
  c.cnpj,
  coalesce(a.cidade, c.cidade) as cidade,
  c.uf,
  c.tipo_cliente,
  a.tipo        as tipo_agenda,
  a.canal,
  a.objetivo,
  a.assunto,
  a.status,
  a.resultado,
  a.observacoes,
  a.created_at  as criado_em
from agendamentos a
left join marcas m   on m.id = a.marca_id
left join gestores g on g.id = a.gestor_id
left join clientes c on c.id = a.cliente_id
order by a.data desc, a.horario desc;

alter view vw_export_agendamentos set (security_invoker = on);
