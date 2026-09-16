-- ============================================================
-- VibeNet — миграция: уведомления (лайки, комментарии, подписки)
-- Выполните в Supabase: SQL Editor -> New query -> вставить -> Run
-- ============================================================

create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('like','comment','follow')),
  post_id uuid references posts(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Пользователь видит только свои уведомления" on notifications
  for select using (auth.uid() = user_id);

create policy "Пользователь помечает свои уведомления прочитанными" on notifications
  for update using (auth.uid() = user_id);

-- Уведомление о лайке
create or replace function public.notify_on_like()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    insert into notifications (user_id, actor_id, type, post_id)
    values (post_owner, new.user_id, 'like', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_like_created on likes;
create trigger on_like_created
  after insert on likes
  for each row execute procedure public.notify_on_like();

-- Уведомление о комментарии
create or replace function public.notify_on_comment()
returns trigger as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    insert into notifications (user_id, actor_id, type, post_id)
    values (post_owner, new.user_id, 'comment', new.post_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_created on comments;
create trigger on_comment_created
  after insert on comments
  for each row execute procedure public.notify_on_comment();

-- Уведомление о подписке
create or replace function public.notify_on_follow()
returns trigger as $$
begin
  insert into notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follow_created on follows;
create trigger on_follow_created
  after insert on follows
  for each row execute procedure public.notify_on_follow();

-- Включаем realtime, чтобы колокольчик обновлялся мгновенно
alter publication supabase_realtime add table notifications;
