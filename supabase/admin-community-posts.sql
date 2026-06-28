-- Admin community posts: pin to top + manage posts
-- Run once in Supabase Dashboard → SQL Editor

alter table posts
  add column if not exists pinned boolean not null default false;

create index if not exists posts_pinned_created_idx
  on posts (pinned desc, created_at desc);

do $$ begin
  create policy "Admin can update posts"
    on posts for update
    using (is_admin());
exception when duplicate_object then null;
end $$;
