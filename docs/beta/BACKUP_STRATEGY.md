# Backup Strategy — Yogstra Beta

---

## Database (Supabase)

| Method | Frequency | Retention |
|--------|-----------|-----------|
| Supabase automatic backups | Daily (Pro plan) | Per plan |
| Point-in-time recovery | Pro+ | 7+ days |
| Manual `pg_dump` | Before major releases | Keep 30 days |

```bash
supabase db dump -f backup-$(date +%Y%m%d).sql
```

---

## Storage

- Supabase Storage buckets: avatars, academy assets, competition banners
- Enable bucket versioning if available
- Export critical assets before destructive migrations

---

## Application

- Git tags for each beta release (`beta-0.1.0`)
- Vercel deployment history — promote previous for instant rollback

---

## Recovery process

1. **App bug:** Rollback Vercel deployment
2. **Bad migration:** Restore Supabase from backup; redeploy compatible app version
3. **Payment data inconsistency:** Query `class_orders` + `bookings`; replay Razorpay webhook

---

## Disaster recovery checklist

- [ ] Supabase project ID and region documented
- [ ] Service role key in secure vault
- [ ] Razorpay dashboard access for 2 team members
- [ ] Latest migration number recorded (014)
- [ ] Test restore performed once in staging

---

## RPO / RTO targets (beta)

| Metric | Target |
|--------|--------|
| RPO (data loss) | < 24 hours (daily backup) |
| RTO (recovery time) | < 4 hours |

Upgrade to Pro PITR before public launch for tighter targets.
