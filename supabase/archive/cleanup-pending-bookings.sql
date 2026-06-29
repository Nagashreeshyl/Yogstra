-- Remove stale pending booking requests (created before pay-first flow).
-- Safe to run once after deploying the payment-first booking update.
delete from public.bookings
where status = 'pending'
  and payment_status = 'pending';
