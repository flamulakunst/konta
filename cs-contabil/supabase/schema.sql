-- ══════════════════════════════════════════════
--  CS Contábil — Supabase Schema
--  Execute no SQL Editor do Supabase Dashboard
-- ══════════════════════════════════════════════

-- Extensões
create extension if not exists "uuid-ossp";

-- ─── PROFILES (sincronizado com auth.users) ───
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  email       text not null,
  perfil      text not null check (perfil in ('admin','cs','visualizador')) default 'cs',
  ativo       boolean not null default true,
  av          text,
  av_bg       text default '#E1F5EE',
  av_co       text default '#085041',
  ultimo      text,
  created_at  timestamptz default now()
);

-- Trigger: criar profile ao criar usuário no auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nome, email, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'perfil', 'visualizador')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── CLIENTS ───
create table if not exists public.clients (
  id          bigserial primary key,
  nome        text not null,
  cnpj        text,
  seg         text,
  regime      text,
  cs          text,
  hon         text,
  cidade      text,
  col         int not null default 0,
  status      text default 'Saudável',
  desde       text,
  obs         text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── KANBAN CARDS ───
create table if not exists public.kanban_cards (
  id          bigserial primary key,
  col         int not null default 0,
  nome        text not null,
  seg         text,
  cs          text,
  status      text,
  data        text,
  hon         text,
  obs         text default '',
  warn        boolean default false,
  alert       boolean default false,
  created_at  timestamptz default now()
);

-- ─── TASKS ───
create table if not exists public.tasks (
  id          bigserial primary key,
  desc        text not null,
  cli         text,
  resp        text,
  data        date,
  prio        text check (prio in ('alta','media','baixa')) default 'media',
  tipo        text,
  done        boolean default false,
  created_at  timestamptz default now()
);

-- ─── BIRTHDAYS ───
create table if not exists public.birthdays (
  id          bigserial primary key,
  nome        text not null,
  emp         text,
  dia         int not null,
  mes         int not null
);

-- ─── CERTIFICATES ───
create table if not exists public.certs (
  id          bigserial primary key,
  emp         text not null,
  tipo        text,
  tit         text,
  emissao     date,
  venc        date not null,
  obs         text default '',
  created_at  timestamptz default now()
);

-- ══════════════════════════════════════════════
--  Row Level Security
-- ══════════════════════════════════════════════
alter table public.profiles     enable row level security;
alter table public.clients      enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.tasks        enable row level security;
alter table public.birthdays    enable row level security;
alter table public.certs        enable row level security;

-- Policies: usuários autenticados podem ler tudo
create policy "authenticated_read_profiles"     on public.profiles     for select using (auth.role() = 'authenticated');
create policy "authenticated_read_clients"      on public.clients      for select using (auth.role() = 'authenticated');
create policy "authenticated_read_kanban"       on public.kanban_cards for select using (auth.role() = 'authenticated');
create policy "authenticated_read_tasks"        on public.tasks        for select using (auth.role() = 'authenticated');
create policy "authenticated_read_birthdays"    on public.birthdays    for select using (auth.role() = 'authenticated');
create policy "authenticated_read_certs"        on public.certs        for select using (auth.role() = 'authenticated');

-- Policies: escritas controladas pelo perfil via function
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id);
create policy "clients_write"         on public.clients  for all    using (auth.role() = 'authenticated');
create policy "kanban_write"          on public.kanban_cards for all using (auth.role() = 'authenticated');
create policy "tasks_write"           on public.tasks    for all    using (auth.role() = 'authenticated');
create policy "certs_write"           on public.certs    for all    using (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════
--  SEED DATA
-- ══════════════════════════════════════════════

insert into public.clients (nome,cnpj,seg,regime,cs,hon,cidade,col,status,desde,obs) values
  ('Alves & Filhos Ltda',   '12.345.678/0001-90','Comércio',       'Simples Nacional','Ana Lima',    'R$ 1.200','São Paulo / SP',      4,'Saudável','Jan/2023',''),
  ('TechFlex Soluções',      '98.765.432/0001-11','Tecnologia',     'Lucro Presumido', 'Carlos Neto', 'R$ 2.800','Campinas / SP',       2,'Agendado','Mai/2026','Reunião diagnóstico em 26/06.'),
  ('Mendes Comércio',        '11.222.333/0001-44','Varejo',          'Simples Nacional','Ana Lima',    'R$ 1.100','São Paulo / SP',      5,'Em risco','Mar/2021','Certificado e-CNPJ vencido.'),
  ('Rodrigues Construtora',  '55.666.777/0001-88','Construção civil','Lucro Presumido', 'Beatriz Souza','R$ 1.800','Rio de Janeiro / RJ',1,'Atrasado','Jun/2026','Docs pendentes há 10 dias.'),
  ('Prime Serviços',         '22.333.444/0001-55','Serviços',        'Lucro Presumido', 'Carlos Neto', 'R$ 2.200','São Paulo / SP',      4,'Saudável','Ago/2022',''),
  ('Sol Alimentos',          '33.444.555/0001-66','Alimentação',     'Simples Nacional','Ana Lima',    'R$ 1.050','Belo Horizonte / MG', 2,'Revisão', 'Abr/2025',''),
  ('Rede Farma Plus',        '44.555.666/0001-77','Farmácia',        'Lucro Presumido', 'Carlos Neto', 'R$ 3.200','Curitiba / PR',       3,'Aprovando','Nov/2024',''),
  ('Logística Bravo',        '66.777.888/0001-99','Logística',       'Lucro Real',      'Ana Lima',    'R$ 1.400','Porto Alegre / RS',   2,'Revisão', 'Jul/2025','');

insert into public.birthdays (nome,emp,dia,mes) values
  ('Ricardo Alves',  'Alves & Filhos · Sócio',     24, 5),
  ('Fernanda Costa', 'TechFlex · Sócia',            26, 5),
  ('Paulo Mendes',   'Mendes Comércio · Dono',      28, 5),
  ('Lucia Rodrigues','Rodrigues Const. · Dona',      3, 6),
  ('Carlos Bravo',   'Logística Bravo · Sócio',     10, 6),
  ('Amanda Silva',   'Prime Serviços · Sócia',      18, 6),
  ('Jorge Neves',    'Nuvem Digital · Dono',         22, 6);

insert into public.certs (emp,tipo,tit,emissao,venc,obs) values
  ('Mendes Comércio',     'e-CNPJ A3','Paulo Mendes',     '2023-06-18','2026-06-18','Token no cofre.'),
  ('Sol Alimentos',        'e-CPF A1', 'Marcos Teles',     '2024-03-22','2026-06-22',''),
  ('TechFlex Soluções',    'e-CNPJ A1','Fernanda Costa',   '2024-07-10','2026-07-10',''),
  ('Alves & Filhos',       'e-CNPJ A3','Ricardo Alves',    '2024-07-14','2026-07-14','Token com cliente.'),
  ('Rodrigues Construtora','e-CNPJ A3','Lucia Rodrigues',  '2024-08-12','2026-08-12',''),
  ('Prime Serviços',       'e-CPF A1', 'Amanda Silva',     '2024-09-20','2026-09-20',''),
  ('Logística Bravo',      'e-CNPJ A1','Carlos Bravo',     '2024-11-15','2026-11-15',''),
  ('Oliveira & Cia',       'e-CNPJ A1','Fernando Oliveira','2025-01-10','2027-01-10','');

-- ══════════════════════════════════════════════
--  USUÁRIOS DE DEMO (criar via Supabase Auth)
--  Execute no terminal ou via Dashboard > Auth
-- ══════════════════════════════════════════════
-- Para criar os usuários de demo, acesse:
--   Supabase Dashboard > Auth > Users > Add User
--   admin@cscontabil.com.br  senha: admin123  metadata: {"nome":"Admin","perfil":"admin"}
--   ana@cscontabil.com.br    senha: cs123     metadata: {"nome":"Ana Lima","perfil":"cs"}
--   vis@cscontabil.com.br    senha: view123   metadata: {"nome":"Visualizador","perfil":"visualizador"}
