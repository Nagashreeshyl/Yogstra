# Archived SQL (legacy)

These ad-hoc migration files were used before Sprint 1 database consolidation.
They are **superseded** by `supabase/migrations/000`–`008`.

| Legacy file | Consolidated into |
|-------------|-------------------|
| `schema.sql` | `001_core_schema.sql` |
| `auth-fix.sql` | `000_extensions_and_helpers.sql` |
| `profile-gender.sql` | `001_core_schema.sql` |
| `setup-messaging.sql`, `chat-*.sql` | `002_chat_and_orders.sql` |
| `marketplace-payouts.sql`, `security-hardening.sql`, `teacher-upi-payouts.sql` | `003_marketplace_payouts.sql`, `008_upgrade_from_legacy.sql` |
| `teacher-coupons*.sql`, `teacher-notifications.sql`, etc. | `004_teacher_platform.sql` |
| `academy-foundation.sql` | `005_academy_domain.sql` |
| `competition-foundation.sql` | `006_competition_domain.sql` |
| `live-sync.sql`, `avatars-storage.sql`, etc. | `007_realtime_storage_admin.sql` |

Do not run archive files on new environments.
