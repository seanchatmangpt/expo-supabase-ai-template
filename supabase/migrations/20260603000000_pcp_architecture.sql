-- Migration: Integrate PCP Architecture Tables
-- Translates the local SQLite TrueX/PCP architecture into PostgreSQL

-- 1. Actor Architecture (Event Sourcing & CQRS)
CREATE TABLE IF NOT EXISTS public.actor_commands (
    id TEXT PRIMARY KEY,
    actor_ref TEXT NOT NULL,
    command TEXT NOT NULL,
    principal TEXT NOT NULL,
    payload TEXT NOT NULL,
    idempotency_key TEXT,
    status TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.actor_events (
    id TEXT PRIMARY KEY,
    command_id TEXT NOT NULL,
    actor_ref TEXT NOT NULL,
    event TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'simulated',
    created_at BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000
);

CREATE TABLE IF NOT EXISTS public.actor_receipts (
    id TEXT PRIMARY KEY,
    command_id TEXT NOT NULL,
    actor_ref TEXT NOT NULL,
    status TEXT NOT NULL,
    event_ids TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.actor_outbox (
    id TEXT PRIMARY KEY,
    command_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.actor_quarantine (
    id TEXT PRIMARY KEY,
    command_id TEXT NOT NULL,
    actor_ref TEXT NOT NULL,
    payload TEXT NOT NULL,
    error TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

-- 2. Synchronous & Pre-Admission Tension Queue (PATQ)
CREATE TABLE IF NOT EXISTS public.sync_queue (
    id BIGSERIAL PRIMARY KEY,
    job_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    entity_id TEXT,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sync_admission_receipts (
    id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    receipt_hash TEXT NOT NULL,
    public_key TEXT NOT NULL,
    signature TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sync_job_quarantine (
    id BIGSERIAL PRIMARY KEY,
    job_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    entity_id TEXT,
    rejection_reason TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

-- 3. Virtual Knowledge Graph (VKG) Quads
CREATE TABLE IF NOT EXISTS public.quads (
    id BIGSERIAL PRIMARY KEY,
    subject TEXT NOT NULL,
    subject_term_type TEXT NOT NULL,
    predicate TEXT NOT NULL,
    object_value TEXT NOT NULL,
    object_term_type TEXT NOT NULL,
    object_datatype TEXT,
    object_language TEXT,
    graph TEXT NOT NULL,
    graph_term_type TEXT NOT NULL,
    transaction_id TEXT,
    created_at BIGINT NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_actor_events_actor_ref ON public.actor_events(actor_ref);
CREATE INDEX IF NOT EXISTS idx_actor_commands_actor_ref ON public.actor_commands(actor_ref);
CREATE INDEX IF NOT EXISTS idx_quads_subject ON public.quads(subject);
CREATE INDEX IF NOT EXISTS idx_quads_predicate ON public.quads(predicate);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON public.sync_queue(status);
