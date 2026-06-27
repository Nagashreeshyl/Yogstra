-- Enable realtime on teacher_profiles so teachers get instant approval updates
-- Run in Supabase Dashboard → SQL Editor

do $$ begin
  alter publication supabase_realtime add table teacher_profiles;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
