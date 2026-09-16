-- ============================================================
-- VibeNet — схема базы данных для Supabase
-- Скопируйте весь этот файл и выполните в Supabase Dashboard:
-- SQL Editor -> New query -> вставить -> Run
-- ============================================================

-- 1. Профили (расширяют встроенную auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text,
  bio text default '',
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Профили видны всем" on profiles
  for select using (true);

create policy "Пользователь редактирует только свой профиль" on profiles
  for update using (auth.uid() = id);

-- Автоматически создаём профиль при регистрации нового пользователя
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Посты
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  caption text default '',
  location text default '',
  created_at timestamptz default now()
);

alter table posts enable row level security;

create policy "Посты видны всем" on posts for select using (true);
create policy "Пользователь создаёт только свои посты" on posts
  for insert with check (auth.uid() = user_id);
create policy "Пользователь удаляет только свои посты" on posts
  for delete using (auth.uid() = user_id);

-- 3. Лайки
create table if not exists likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table likes enable row level security;

create policy "Лайки видны всем" on likes for select using (true);
create policy "Пользователь лайкает от своего имени" on likes
  for insert with check (auth.uid() = user_id);
create policy "Пользователь убирает только свой лайк" on likes
  for delete using (auth.uid() = user_id);

-- 4. Комментарии
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

alter table comments enable row level security;

create policy "Комментарии видны всем" on comments for select using (true);
create policy "Пользователь комментирует от своего имени" on comments
  for insert with check (auth.uid() = user_id);
create policy "Пользователь удаляет только свои комментарии" on comments
  for delete using (auth.uid() = user_id);

-- 5. Подписки
create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade not null,
  following_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

alter table follows enable row level security;

create policy "Подписки видны всем" on follows for select using (true);
create policy "Пользователь подписывается от своего имени" on follows
  for insert with check (auth.uid() = follower_id);
create policy "Пользователь отписывается только сам" on follows
  for delete using (auth.uid() = follower_id);

-- 6. Личные сообщения
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id) on delete cascade not null,
  receiver_id uuid references profiles(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Участники видят только свою переписку" on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Отправлять можно только от своего имени" on messages
  for insert with check (auth.uid() = sender_id);

-- Включаем realtime для чата (мгновенная доставка сообщений)
alter publication supabase_realtime add table messages;

-- 7. Хранилище для фото постов и аватаров
insert into storage.buckets (id, name, public)
values ('vibenet-media', 'vibenet-media', true)
on conflict (id) do nothing;

create policy "Медиафайлы доступны всем на чтение" on storage.objects
  for select using (bucket_id = 'vibenet-media');

create policy "Авторизованные пользователи загружают файлы" on storage.objects
  for insert with check (bucket_id = 'vibenet-media' and auth.role() = 'authenticated');

create policy "Пользователь удаляет только свои файлы" on storage.objects
  for delete using (bucket_id = 'vibenet-media' and auth.uid()::text = (storage.foldername(name))[1]);
