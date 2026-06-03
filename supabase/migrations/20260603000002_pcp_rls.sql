-- Enable RLS for all PCP Architecture tables
ALTER TABLE public.actor_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actor_quarantine ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_admission_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_job_quarantine ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.quads ENABLE ROW LEVEL SECURITY;

-- If these tables are strictly for backend service_role usage, enabling RLS (which defaults to deny-all for anon/authenticated) is sufficient.
-- If authenticated users need to read their own events, we provide strict policies based on auth.uid() where applicable.
-- For now, we lock them down to service_role only (which bypasses RLS) as is best practice for event-sourcing ledgers unless explicitly exposed.

-- We also explicitly drop any accidental public grants that might bypass RLS (if any)
REVOKE ALL ON public.actor_commands FROM PUBLIC;
REVOKE ALL ON public.actor_events FROM PUBLIC;
REVOKE ALL ON public.actor_receipts FROM PUBLIC;
REVOKE ALL ON public.actor_outbox FROM PUBLIC;
REVOKE ALL ON public.actor_quarantine FROM PUBLIC;
REVOKE ALL ON public.sync_queue FROM PUBLIC;
REVOKE ALL ON public.sync_admission_receipts FROM PUBLIC;
REVOKE ALL ON public.sync_job_quarantine FROM PUBLIC;
REVOKE ALL ON public.quads FROM PUBLIC;
