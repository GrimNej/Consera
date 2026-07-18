-- Isolated, idempotent Phase 0 contract schema. This is not a production migration.
-- Apply only to the smallest H-04 PostgreSQL resource through
-- `pnpm sub0-contract:setup` after the user supplies the connection string locally.

CREATE SCHEMA IF NOT EXISTS consera_contract;

CREATE TABLE IF NOT EXISTS consera_contract.contract_subjects (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS consera_contract.contract_organizations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label text NOT NULL UNIQUE,
  current_version bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE IF NOT EXISTS consera_contract.contract_memberships (
  organization_id bigint NOT NULL REFERENCES consera_contract.contract_organizations(id),
  subject_id bigint NOT NULL REFERENCES consera_contract.contract_subjects(id),
  role text NOT NULL CHECK (role IN ('owner', 'viewer')),
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  PRIMARY KEY (organization_id, subject_id)
);

CREATE TABLE IF NOT EXISTS consera_contract.contract_unique_claims (
  organization_id bigint NOT NULL REFERENCES consera_contract.contract_organizations(id),
  claim_key text NOT NULL,
  created_by_subject_id bigint NOT NULL REFERENCES consera_contract.contract_subjects(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (organization_id, claim_key)
);

CREATE TABLE IF NOT EXISTS consera_contract.contract_mutations (
  organization_id bigint NOT NULL REFERENCES consera_contract.contract_organizations(id),
  mutation_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (organization_id, mutation_key)
);

CREATE TABLE IF NOT EXISTS consera_contract.contract_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES consera_contract.contract_organizations(id),
  job_key text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'leased', 'completed')),
  lease_owner text,
  lease_token uuid,
  lease_generation bigint NOT NULL DEFAULT 0,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  completed_at timestamptz,
  UNIQUE (organization_id, job_key)
);

CREATE TABLE IF NOT EXISTS consera_contract.contract_schedule_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES consera_contract.contract_organizations(id),
  schedule_key text NOT NULL,
  created_by_subject_id bigint NOT NULL REFERENCES consera_contract.contract_subjects(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (organization_id, schedule_key)
);

CREATE OR REPLACE FUNCTION consera_contract.contract_create_organization(
  p_subject_id bigint,
  p_label text
)
RETURNS TABLE(organization_id bigint, label text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_organization_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_subjects
    WHERE id = p_subject_id
  ) THEN
    RAISE EXCEPTION 'CONTRACT_UNKNOWN_SUBJECT';
  END IF;

  INSERT INTO consera_contract.contract_organizations (label)
  VALUES (p_label)
  RETURNING id INTO v_organization_id;

  INSERT INTO consera_contract.contract_memberships (
    organization_id,
    subject_id,
    role,
    status
  )
  VALUES (v_organization_id, p_subject_id, 'owner', 'active');

  RETURN QUERY
  SELECT v_organization_id, p_label;
END;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_read_organization(
  p_subject_id bigint,
  p_organization_id bigint
)
RETURNS TABLE(organization_id bigint, label text, current_version bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT o.id, o.label, o.current_version
  FROM consera_contract.contract_organizations AS o
  INNER JOIN consera_contract.contract_memberships AS m
    ON m.organization_id = o.id
  WHERE o.id = p_organization_id
    AND m.subject_id = p_subject_id
    AND m.status = 'active';
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_list_organizations(
  p_subject_id bigint,
  p_cursor_id bigint
)
RETURNS TABLE(organization_id bigint, label text)
LANGUAGE sql
STABLE
AS $$
  SELECT o.id, o.label
  FROM consera_contract.contract_organizations AS o
  INNER JOIN consera_contract.contract_memberships AS m
    ON m.organization_id = o.id
  WHERE m.subject_id = p_subject_id
    AND m.status = 'active'
    AND o.id > p_cursor_id
  ORDER BY o.id
  LIMIT 20;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_rename_organization(
  p_subject_id bigint,
  p_organization_id bigint,
  p_label text
)
RETURNS TABLE(updated_label text)
LANGUAGE sql
AS $$
  UPDATE consera_contract.contract_organizations AS o
  SET label = p_label
  WHERE o.id = p_organization_id
    AND EXISTS (
      SELECT 1
      FROM consera_contract.contract_memberships AS m
      WHERE m.organization_id = o.id
        AND m.subject_id = p_subject_id
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  RETURNING o.label;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_claim_unique(
  p_subject_id bigint,
  p_organization_id bigint,
  p_claim_key text
)
RETURNS TABLE(claim_state text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_memberships AS m
    WHERE m.organization_id = p_organization_id
      AND m.subject_id = p_subject_id
      AND m.role = 'owner'
      AND m.status = 'active'
  ) THEN
    RETURN QUERY SELECT 'NOT_AUTHORIZED'::text;
    RETURN;
  END IF;

  INSERT INTO consera_contract.contract_unique_claims (
    organization_id,
    claim_key,
    created_by_subject_id
  )
  VALUES (p_organization_id, p_claim_key, p_subject_id)
  ON CONFLICT (organization_id, claim_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN QUERY SELECT CASE WHEN v_inserted = 1 THEN 'CREATED' ELSE 'CONFLICT' END;
END;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_compare_and_set(
  p_subject_id bigint,
  p_organization_id bigint,
  p_expected_version bigint
)
RETURNS TABLE(updated_version bigint)
LANGUAGE sql
AS $$
  UPDATE consera_contract.contract_organizations AS o
  SET current_version = current_version + 1
  WHERE o.id = p_organization_id
    AND o.current_version = p_expected_version
    AND EXISTS (
      SELECT 1
      FROM consera_contract.contract_memberships AS m
      WHERE m.organization_id = o.id
        AND m.subject_id = p_subject_id
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  RETURNING o.current_version;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_insert_then_fail(
  p_subject_id bigint,
  p_organization_id bigint,
  p_mutation_key text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_memberships AS m
    WHERE m.organization_id = p_organization_id
      AND m.subject_id = p_subject_id
      AND m.role = 'owner'
      AND m.status = 'active'
  ) THEN
    RAISE EXCEPTION 'CONTRACT_NOT_AUTHORIZED';
  END IF;

  INSERT INTO consera_contract.contract_mutations (organization_id, mutation_key)
  VALUES (p_organization_id, p_mutation_key);
  RAISE EXCEPTION 'CONTRACT_INJECTED_FAILURE';
END;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_mutation_count(
  p_subject_id bigint,
  p_organization_id bigint,
  p_mutation_key text
)
RETURNS TABLE(mutation_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT count(*)
  FROM consera_contract.contract_mutations AS x
  WHERE x.organization_id = p_organization_id
    AND x.mutation_key = p_mutation_key
    AND EXISTS (
      SELECT 1
      FROM consera_contract.contract_memberships AS m
      WHERE m.organization_id = x.organization_id
        AND m.subject_id = p_subject_id
        AND m.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_enqueue_job(
  p_subject_id bigint,
  p_organization_id bigint,
  p_job_key text
)
RETURNS TABLE(job_id bigint, enqueue_state text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_job_id bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_memberships AS m
    WHERE m.organization_id = p_organization_id
      AND m.subject_id = p_subject_id
      AND m.role = 'owner'
      AND m.status = 'active'
  ) THEN
    RETURN QUERY SELECT NULL::bigint, 'NOT_AUTHORIZED'::text;
    RETURN;
  END IF;

  INSERT INTO consera_contract.contract_jobs (organization_id, job_key, state)
  VALUES (p_organization_id, p_job_key, 'pending')
  ON CONFLICT (organization_id, job_key) DO NOTHING
  RETURNING id INTO v_job_id;

  IF v_job_id IS NULL THEN
    SELECT id INTO v_job_id
    FROM consera_contract.contract_jobs
    WHERE organization_id = p_organization_id AND job_key = p_job_key;
    RETURN QUERY SELECT v_job_id, 'DUPLICATE'::text;
  ELSE
    RETURN QUERY SELECT v_job_id, 'ENQUEUED'::text;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_claim_job(
  p_subject_id bigint,
  p_organization_id bigint,
  p_job_key text,
  p_lease_owner text
)
RETURNS TABLE(job_id bigint, lease_token text, lease_generation bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_memberships AS m
    WHERE m.organization_id = p_organization_id
      AND m.subject_id = p_subject_id
      AND m.role = 'owner'
      AND m.status = 'active'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE consera_contract.contract_jobs AS j
  SET state = 'leased',
      lease_owner = p_lease_owner,
      lease_token = gen_random_uuid(),
      lease_generation = j.lease_generation + 1,
      lease_expires_at = clock_timestamp() + interval '30 seconds',
      heartbeat_at = clock_timestamp()
  WHERE j.organization_id = p_organization_id
    AND j.job_key = p_job_key
    AND j.state <> 'completed'
    AND (j.state = 'pending' OR j.lease_expires_at < clock_timestamp())
  RETURNING j.id, j.lease_token::text, j.lease_generation;
END;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_expire_job_lease(
  p_subject_id bigint,
  p_organization_id bigint,
  p_job_key text
)
RETURNS TABLE(expire_state text)
LANGUAGE sql
AS $$
  UPDATE consera_contract.contract_jobs AS j
  SET lease_expires_at = clock_timestamp() - interval '1 second'
  WHERE j.organization_id = p_organization_id
    AND j.job_key = p_job_key
    AND EXISTS (
      SELECT 1
      FROM consera_contract.contract_memberships AS m
      WHERE m.organization_id = j.organization_id
        AND m.subject_id = p_subject_id
        AND m.role = 'owner'
        AND m.status = 'active'
    )
  RETURNING 'EXPIRED'::text;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_complete_job(
  p_subject_id bigint,
  p_organization_id bigint,
  p_job_key text,
  p_lease_owner text,
  p_lease_token uuid,
  p_lease_generation bigint
)
RETURNS TABLE(completion_state text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_memberships AS m
    WHERE m.organization_id = p_organization_id
      AND m.subject_id = p_subject_id
      AND m.role = 'owner'
      AND m.status = 'active'
  ) THEN
    RETURN QUERY SELECT 'NOT_AUTHORIZED'::text;
    RETURN;
  END IF;

  UPDATE consera_contract.contract_jobs AS j
  SET state = 'completed',
      completed_at = clock_timestamp()
  WHERE j.organization_id = p_organization_id
    AND j.job_key = p_job_key
    AND j.state = 'leased'
    AND j.lease_owner = p_lease_owner
    AND j.lease_token = p_lease_token
    AND j.lease_generation = p_lease_generation
    AND j.lease_expires_at > clock_timestamp();
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN QUERY SELECT CASE WHEN v_updated = 1 THEN 'COMPLETED' ELSE 'STALE_LEASE' END;
END;
$$;

CREATE OR REPLACE FUNCTION consera_contract.contract_schedule_tick(
  p_subject_id bigint,
  p_organization_id bigint,
  p_schedule_key text
)
RETURNS TABLE(schedule_state text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted integer;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM consera_contract.contract_memberships AS m
    WHERE m.organization_id = p_organization_id
      AND m.subject_id = p_subject_id
      AND m.role = 'owner'
      AND m.status = 'active'
  ) THEN
    RETURN QUERY SELECT 'NOT_AUTHORIZED'::text;
    RETURN;
  END IF;

  INSERT INTO consera_contract.contract_schedule_runs (
    organization_id,
    schedule_key,
    created_by_subject_id
  )
  VALUES (p_organization_id, p_schedule_key, p_subject_id)
  ON CONFLICT (organization_id, schedule_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN QUERY SELECT CASE WHEN v_inserted = 1 THEN 'RUN_STARTED' ELSE 'DUPLICATE' END;
END;
$$;
