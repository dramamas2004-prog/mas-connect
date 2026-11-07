-- MAS CONNECT — المرحلة 1: الحسابات والملف الشخصي والإعدادات
-- شغّل هذا الملف كاملًا مرة واحدة من Supabase → SQL Editor.

-- ───────────── جدول الملفات الشخصية ─────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  mas_id         text not null unique,
  username       text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name   text not null check (char_length(display_name) between 1 and 60),
  bio            text not null default '' check (char_length(bio) <= 200),
  status_text    text not null default '' check (char_length(status_text) <= 80),
  avatar_url     text,
  is_deactivated boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ───────────── الإعدادات (خاصة بصاحبها فقط) ─────────────
create table if not exists public.user_settings (
  id                 uuid primary key references auth.users(id) on delete cascade,
  phone              text check (phone is null or phone ~ '^\+?[0-9]{6,15}$'),
  last_seen          text not null default 'everyone'  check (last_seen in ('everyone','contacts','nobody')),
  read_receipts      boolean not null default true,
  who_can_message    text not null default 'everyone'  check (who_can_message in ('everyone','contacts','nobody')),
  story_visibility   text not null default 'contacts'  check (story_visibility in ('everyone','contacts','nobody')),
  profile_visibility text not null default 'everyone'  check (profile_visibility in ('everyone','contacts','nobody')),
  notify_messages    boolean not null default true,
  notify_calls       boolean not null default true,
  notify_communities boolean not null default true,
  notify_stories     boolean not null default true,
  notify_social      boolean not null default true,
  updated_at         timestamptz not null default now()
);

-- ───────────── دوال مساعدة ─────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.user_settings;
create trigger settings_touch before update on public.user_settings
  for each row execute function public.touch_updated_at();

-- MAS ID فريد بصيغة MAS-XXXXXXXX (بدون أحرف متشابهة)
create or replace function public.generate_mas_id()
returns text language plpgsql as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  i int;
begin
  loop
    candidate := 'MAS-';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where mas_id = candidate);
  end loop;
  return candidate;
end $$;

-- إنشاء الملف الشخصي والإعدادات تلقائيًا عند التسجيل
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uname text;
  dname text;
begin
  uname := lower(coalesce(new.raw_user_meta_data->>'username', ''));
  dname := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(coalesce(new.email, 'user'), '@', 1));

  if uname !~ '^[a-z0-9_]{3,24}$' or exists (select 1 from public.profiles where username = uname) then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 10);
  end if;

  insert into public.profiles (id, mas_id, username, display_name)
  values (new.id, public.generate_mas_id(), uname, left(dname, 60));

  insert into public.user_settings (id) values (new.id);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- هل اسم المستخدم متاح؟ (تُستدعى قبل التسجيل لذلك مسموحة للزائر)
create or replace function public.is_username_available(p_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_username ~ '^[a-z0-9_]{3,24}$'
     and not exists (select 1 from public.profiles where username = lower(p_username));
$$;

-- تعطيل الحساب مؤقتًا / إعادة تفعيله
create or replace function public.set_account_deactivated(p_value boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  update public.profiles set is_deactivated = p_value where id = auth.uid();
end $$;

-- حذف الحساب نهائيًا (يحذف الملف والإعدادات تلقائيًا بالـ cascade)
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ───────────── الصلاحيات و RLS ─────────────
alter table public.profiles      enable row level security;
alter table public.user_settings enable row level security;

revoke all on public.profiles      from anon, authenticated;
revoke all on public.user_settings from anon, authenticated;

-- الملفات: أي مستخدم مسجّل يقرأ الملفات غير المعطّلة + ملفه هو. التعديل لأعمدة محددة فقط.
grant select on public.profiles to authenticated;
grant update (username, display_name, bio, status_text, avatar_url) on public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or is_deactivated = false);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- الإعدادات: صاحبها فقط يقرأ ويعدّل
grant select on public.user_settings to authenticated;
grant update (phone, last_seen, read_receipts, who_can_message, story_visibility, profile_visibility,
              notify_messages, notify_calls, notify_communities, notify_stories, notify_social)
  on public.user_settings to authenticated;

drop policy if exists settings_select_own on public.user_settings;
create policy settings_select_own on public.user_settings for select to authenticated
  using (id = auth.uid());

drop policy if exists settings_update_own on public.user_settings;
create policy settings_update_own on public.user_settings for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- الدوال: لا تُستدعى إلا من الجهة المقصودة
revoke execute on function public.is_username_available(text)    from public;
revoke execute on function public.set_account_deactivated(boolean) from public;
revoke execute on function public.delete_my_account()            from public;
grant execute on function public.is_username_available(text)     to anon, authenticated;
grant execute on function public.set_account_deactivated(boolean) to authenticated;
grant execute on function public.delete_my_account()             to authenticated;

-- ───────────── تخزين الصور الشخصية ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
