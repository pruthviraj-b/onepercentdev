-- Reminder/email tables for OnePercentDev.
-- Run this in Supabase SQL Editor after smart_tasks already exists.

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id TEXT PRIMARY KEY,
  browser_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_address TEXT,
  reminder_offsets_minutes INTEGER[] NOT NULL DEFAULT ARRAY[10, 0],
  daily_digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  daily_digest_time TIME NOT NULL DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminder_deliveries (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id BIGINT REFERENCES public.smart_tasks(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('browser', 'email', 'push')),
  delivery_key TEXT NOT NULL UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'skipped', 'failed')),
  provider TEXT,
  provider_id TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS reminder_deliveries_user_task
  ON public.reminder_deliveries (user_id, task_id, channel);

CREATE INDEX IF NOT EXISTS reminder_deliveries_scheduled
  ON public.reminder_deliveries (scheduled_for);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_deliveries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_preferences_updated_at ON public.user_notification_preferences;

CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();
