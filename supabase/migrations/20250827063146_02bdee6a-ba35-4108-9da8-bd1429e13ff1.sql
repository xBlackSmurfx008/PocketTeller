-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily notifications at 7 PM UTC
SELECT cron.schedule(
  'daily-notifications',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "daily"}'::jsonb
  );
  $$
);

-- Schedule weekly notifications on Sunday at 9 AM UTC
SELECT cron.schedule(
  'weekly-notifications',
  '0 9 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "weekly"}'::jsonb
  );
  $$
);

-- Schedule monthly notifications on the last day of month at 6 PM UTC
SELECT cron.schedule(
  'monthly-notifications',
  '0 18 L * *',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "monthly"}'::jsonb
  );
  $$
);

-- Schedule transaction sync reminders every 6 hours
SELECT cron.schedule(
  'transaction-sync-reminders',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "transaction_sync"}'::jsonb
  );
  $$
);

-- Schedule bill reminders daily at 10 AM UTC
SELECT cron.schedule(
  'bill-reminders',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "bill_reminders"}'::jsonb
  );
  $$
);

-- Schedule goal progress updates weekly on Friday at 5 PM UTC
SELECT cron.schedule(
  'goal-progress-updates',
  '0 17 * * 5',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "goal_progress"}'::jsonb
  );
  $$
);

-- Schedule inactivity reminders weekly on Wednesday at 2 PM UTC
SELECT cron.schedule(
  'inactivity-reminders',
  '0 14 * * 3',
  $$
  SELECT net.http_post(
    url := 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0"}'::jsonb,
    body := '{"scheduleType": "inactivity"}'::jsonb
  );
  $$
);