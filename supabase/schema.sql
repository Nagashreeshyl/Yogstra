-- Yogstra V2 database entry point
--
-- DEPRECATED: Do not run this file directly on new projects.
--
-- Use the ordered migration sequence in supabase/migrations/ instead.
-- See docs/database/MIGRATION_GUIDE.md for full instructions.

select 'Apply supabase/migrations/*.sql in numeric order (000–007 fresh, +008 for legacy upgrades)' as yogstra_migration_notice;
