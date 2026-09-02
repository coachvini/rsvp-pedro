-- ============================================================
-- SETUP SUPABASE - Confirmação de presença (Aniversário do Pedro)
-- Rode este script no: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Tabela de confirmações
create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

-- 2. Ativa Row Level Security (protege os dados dos convidados)
alter table public.responses enable row level security;

-- 3. Somente usuários logados (painel admin) podem LER e EXCLUIR
create policy "auth select responses" on public.responses
  for select to authenticated using (true);

create policy "auth delete responses" on public.responses
  for delete to authenticated using (true);

-- 4. Função de confirmação (insere novo ou atualiza confirmação existente
--    para o mesmo e-mail + nome). O formulário público só pode chamar esta
--    função (não tem acesso direto à tabela).
create or replace function public.confirm_response(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_updated boolean := false;
begin
  select id into v_id
  from public.responses
  where email = lower(p_email)
    and first_name ilike p_first_name
  limit 1;

  if v_id is not null then
    update public.responses
    set last_name = p_last_name, phone = p_phone, created_at = now()
    where id = v_id;
    v_updated := true;
  else
    insert into public.responses (first_name, last_name, email, phone)
    values (p_first_name, p_last_name, lower(p_email), p_phone);
  end if;

  return jsonb_build_object('ok', true, 'updated', v_updated);
end;
$$;

grant execute on function public.confirm_response(text, text, text, text) to anon, authenticated;

-- ============================================================
-- PRÓXIMO PASSO (no Dashboard do Supabase):
-- Authentication > Users > "Add user" e crie um usuário com
-- e-mail + senha. É esse login que você usará no painel admin.
-- ============================================================
