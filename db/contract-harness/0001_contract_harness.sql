CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS contract_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  current_version bigint NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS contract_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES contract_organizations(id),
  subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'viewer')),
  status text NOT NULL CHECK (status IN ('active', 'suspended')),
  UNIQUE (organization_id, subject),
  UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS contract_mutations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES contract_organizations(id),
  mutation_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (organization_id, mutation_key)
);

CREATE OR REPLACE FUNCTION contract_compare_and_set(
  p_organization_id uuid,
  p_expected_version bigint
)
RETURNS TABLE(updated_version bigint)
LANGUAGE sql
AS $$
  UPDATE contract_organizations
  SET current_version = current_version + 1
  WHERE id = p_organization_id
    AND current_version = p_expected_version
  RETURNING current_version;
$$;

CREATE OR REPLACE FUNCTION contract_insert_then_fail(
  p_organization_id uuid,
  p_mutation_key text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO contract_mutations (organization_id, mutation_key)
  VALUES (p_organization_id, p_mutation_key);
  RAISE EXCEPTION 'CONTRACT_INJECTED_FAILURE';
END;
$$;
