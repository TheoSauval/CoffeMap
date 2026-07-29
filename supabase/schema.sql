-- CoffeeMap — schéma des données liées au compte utilisateur.
-- À exécuter dans Supabase (Dashboard > SQL Editor). Documentation uniquement,
-- Supabase ne lit pas ce fichier automatiquement.
--
-- Ce script est réexécutable : quand une nouvelle table est ajoutée ici, on peut
-- recoller le fichier entier sans que les objets déjà créés fassent échouer la
-- requête (Postgres n'a pas de "create policy if not exists", d'où les drop).

-- On ne conserve que l'identifiant Google du lieu (cafe_id) : les conditions
-- de Google Maps Platform interdisent de stocker durablement le contenu des
-- fiches (nom, adresse, note, photos). Ce contenu est rechargé à l'affichage
-- et mis en cache temporairement sur l'appareil — voir lib/cafeCache.ts.
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cafe_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, cafe_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
drop policy if exists "favorites_update_own" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;

create policy "favorites_select_own" on public.favorites for select using (auth.uid() = user_id);
create policy "favorites_insert_own" on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites_update_own" on public.favorites for update using (auth.uid() = user_id);
create policy "favorites_delete_own" on public.favorites for delete using (auth.uid() = user_id);

create table if not exists public.visited (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cafe_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, cafe_id)
);

-- Migration depuis la version qui stockait la fiche complète. Sans effet sur
-- une base déjà à jour ; les favoris et visites sont conservés (seul le
-- contenu Google mis en cache à tort disparaît, il sera rechargé).
alter table public.favorites drop column if exists cafe;
alter table public.visited drop column if exists cafe;

alter table public.visited enable row level security;

drop policy if exists "visited_select_own" on public.visited;
drop policy if exists "visited_insert_own" on public.visited;
drop policy if exists "visited_update_own" on public.visited;
drop policy if exists "visited_delete_own" on public.visited;

create policy "visited_select_own" on public.visited for select using (auth.uid() = user_id);
create policy "visited_insert_own" on public.visited for insert with check (auth.uid() = user_id);
create policy "visited_update_own" on public.visited for update using (auth.uid() = user_id);
create policy "visited_delete_own" on public.visited for delete using (auth.uid() = user_id);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  source_url text,
  created_at timestamptz not null default now()
);

alter table public.recipes enable row level security;

drop policy if exists "recipes_select_own" on public.recipes;
drop policy if exists "recipes_insert_own" on public.recipes;
drop policy if exists "recipes_delete_own" on public.recipes;

create policy "recipes_select_own" on public.recipes for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.recipes for insert with check (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes for delete using (auth.uid() = user_id);

-- Permet à un utilisateur connecté de supprimer son propre compte depuis
-- l'app (le client anon/publishable n'a pas les droits admin nécessaires
-- pour supprimer directement dans auth.users — cette fonction s'exécute
-- avec les privilèges du propriétaire, mais est verrouillée à auth.uid()
-- donc chacun ne peut supprimer que soi-même).
-- favorites, visited et recipes sont supprimés automatiquement (on delete cascade).
create or replace function public.delete_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_user() to authenticated;
