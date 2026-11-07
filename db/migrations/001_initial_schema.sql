-- AHOE initial data model. Apply with a managed PostgreSQL role that can install
-- PostGIS and pgvector. Request handlers must set app.organization_id only after
-- validating the authenticated user's organization membership.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'demo',
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text,
  email_verified_at timestamptz,
  is_platform_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('organization_admin','analyst','viewer','government_planner')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','suspended')),
  invited_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX organization_members_user_idx ON organization_members(user_id, status);

CREATE TABLE jurisdictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  jurisdiction_type text NOT NULL CHECK (jurisdiction_type IN ('city','county','region','state')),
  state_code char(2) NOT NULL,
  external_id text,
  boundary geometry(MultiPolygon, 4326),
  data_readiness text NOT NULL DEFAULT 'unverified',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, jurisdiction_type, name, state_code)
);
CREATE INDEX jurisdictions_boundary_gix ON jurisdictions USING gist(boundary);

CREATE TABLE parcels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jurisdiction_id uuid REFERENCES jurisdictions(id),
  provider_id text NOT NULL,
  provider_record_id text NOT NULL,
  apn text,
  address text,
  city text,
  state_code char(2),
  postal_code text,
  land_use text,
  zoning_code text,
  area_sqft numeric(16,2),
  assessed_value numeric(18,2),
  opportunity_category text,
  source_classification text NOT NULL DEFAULT 'unverified' CHECK (source_classification IN ('synthetic_demo','official_source','third_party','user_supplied','unverified')),
  source_retrieved_at timestamptz,
  confidence text CHECK (confidence IN ('high','medium','low')),
  attributes jsonb NOT NULL DEFAULT '{}',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider_id, provider_record_id)
);
CREATE INDEX parcels_org_jurisdiction_idx ON parcels(organization_id, jurisdiction_id);
CREATE INDEX parcels_apn_idx ON parcels(organization_id, apn);
CREATE INDEX parcels_category_idx ON parcels(organization_id, opportunity_category);
CREATE INDEX parcels_area_idx ON parcels(organization_id, area_sqft);
CREATE TABLE parcel_geometries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  geom geometry(MultiPolygon, 4326) NOT NULL,
  source_id uuid,
  source_classification text NOT NULL DEFAULT 'unverified',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parcel_id, valid_from)
);
CREATE INDEX parcel_geometries_geom_gix ON parcel_geometries USING gist(geom);
CREATE INDEX parcel_geometries_org_idx ON parcel_geometries(organization_id, parcel_id);

CREATE TABLE zoning_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jurisdiction_id uuid NOT NULL REFERENCES jurisdictions(id), code text NOT NULL, name text,
  description text, geom geometry(MultiPolygon, 4326), source_id uuid, valid_from date, valid_to date,
  metadata jsonb NOT NULL DEFAULT '{}', UNIQUE (organization_id, jurisdiction_id, code, valid_from)
);
CREATE INDEX zoning_districts_geom_gix ON zoning_districts USING gist(geom);
CREATE TABLE zoning_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jurisdiction_id uuid REFERENCES jurisdictions(id), title text NOT NULL, document_type text NOT NULL,
  source_url text, storage_key text, checksum text, version_label text, published_at date, retrieved_at timestamptz,
  source_classification text NOT NULL DEFAULT 'unverified', status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE zoning_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES zoning_documents(id) ON DELETE CASCADE, chunk_index integer NOT NULL,
  page_number integer, section_label text, content text NOT NULL, embedding vector(1536), metadata jsonb NOT NULL DEFAULT '{}',
  UNIQUE (document_id, chunk_index)
);
CREATE INDEX zoning_chunks_embedding_hnsw ON zoning_document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE TABLE zoning_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  zoning_district_id uuid NOT NULL REFERENCES zoning_districts(id) ON DELETE CASCADE, document_id uuid REFERENCES zoning_documents(id),
  rule_type text NOT NULL, rule_value jsonb NOT NULL, source_page text, confidence text,
  valid_from date, valid_to date, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE land_use_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid NOT NULL REFERENCES parcels(id) ON DELETE CASCADE, land_use_code text, description text,
  source_id uuid, observed_at timestamptz, attributes jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE housing_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  jurisdiction_id uuid REFERENCES jurisdictions(id), parcel_id uuid REFERENCES parcels(id), indicator text NOT NULL,
  value numeric, unit text, period_start date, period_end date, source_id uuid, source_classification text NOT NULL DEFAULT 'unverified',
  metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX housing_indicators_lookup_idx ON housing_indicators(organization_id, indicator, jurisdiction_id);
CREATE TABLE environmental_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid REFERENCES parcels(id), jurisdiction_id uuid REFERENCES jurisdictions(id), constraint_type text NOT NULL,
  severity text, geom geometry(Geometry, 4326), source_id uuid, source_classification text NOT NULL DEFAULT 'unverified',
  observed_at timestamptz, attributes jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX environmental_constraints_geom_gix ON environmental_constraints USING gist(geom);
CREATE TABLE infrastructure_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid REFERENCES parcels(id), jurisdiction_id uuid REFERENCES jurisdictions(id), infrastructure_type text NOT NULL,
  distance_m numeric, capacity_status text, geom geometry(Geometry, 4326), source_id uuid,
  source_classification text NOT NULL DEFAULT 'unverified', attributes jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX infrastructure_records_geom_gix ON infrastructure_records USING gist(geom);

CREATE TABLE development_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid NOT NULL REFERENCES parcels(id), project_id uuid, name text NOT NULL, assumptions jsonb NOT NULL,
  created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE feasibility_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid NOT NULL REFERENCES parcels(id), scenario_id uuid REFERENCES development_scenarios(id), status text NOT NULL DEFAULT 'completed',
  inputs jsonb NOT NULL, outputs jsonb NOT NULL, calculation_version text NOT NULL, disclaimer text NOT NULL,
  created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE financial_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feasibility_analysis_id uuid NOT NULL REFERENCES feasibility_analyses(id) ON DELETE CASCADE,
  model_type text NOT NULL, assumptions jsonb NOT NULL, outputs jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE opportunity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid NOT NULL REFERENCES parcels(id) ON DELETE CASCADE, score numeric(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  components jsonb NOT NULL, weights jsonb NOT NULL, explanation jsonb NOT NULL, confidence text NOT NULL,
  model_version text NOT NULL, scored_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunity_scores_rank_idx ON opportunity_scores(organization_id, score DESC);

CREATE TABLE funding_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL, agency text, geography text, eligibility jsonb NOT NULL DEFAULT '{}', source_url text,
  source_classification text NOT NULL DEFAULT 'unverified', current_status text NOT NULL DEFAULT 'unverified', updated_at timestamptz
);
CREATE TABLE data_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL, provider_type text NOT NULL, config jsonb NOT NULL DEFAULT '{}', credential_ref text,
  status text NOT NULL DEFAULT 'disabled', last_checked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES data_providers(id), name text NOT NULL, source_url text, source_type text,
  source_classification text NOT NULL DEFAULT 'unverified', license text, retrieved_at timestamptz,
  valid_from timestamptz, valid_to timestamptz, metadata jsonb NOT NULL DEFAULT '{}'
);
ALTER TABLE parcel_geometries ADD CONSTRAINT parcel_geometries_source_fk FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL;
ALTER TABLE zoning_districts ADD CONSTRAINT zoning_districts_source_fk FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL;
ALTER TABLE land_use_records ADD CONSTRAINT land_use_records_source_fk FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL;
ALTER TABLE housing_indicators ADD CONSTRAINT housing_indicators_source_fk FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL;
ALTER TABLE environmental_constraints ADD CONSTRAINT environmental_constraints_source_fk FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL;
ALTER TABLE infrastructure_records ADD CONSTRAINT infrastructure_records_source_fk FOREIGN KEY (source_id) REFERENCES data_sources(id) ON DELETE SET NULL;
CREATE TABLE ai_analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid REFERENCES parcels(id), run_type text NOT NULL, status text NOT NULL, model_provider text,
  model_name text, prompt_version text, inputs jsonb NOT NULL DEFAULT '{}', output jsonb, citations jsonb NOT NULL DEFAULT '[]',
  confidence text, created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE ai_agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_id uuid NOT NULL REFERENCES ai_analysis_runs(id) ON DELETE CASCADE, agent_name text NOT NULL,
  event_type text NOT NULL, payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parcel_id uuid REFERENCES parcels(id), title text NOT NULL, report_type text NOT NULL, status text NOT NULL DEFAULT 'ready',
  storage_key text, content jsonb NOT NULL DEFAULT '{}', source_classification text NOT NULL DEFAULT 'unverified',
  created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, parcel_id uuid NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  notes text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, user_id, parcel_id)
);
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL, description text, status text NOT NULL DEFAULT 'active', jurisdiction_id uuid REFERENCES jurisdictions(id),
  created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE development_scenarios ADD CONSTRAINT development_scenarios_project_fk FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id), action text NOT NULL, resource_type text, resource_id uuid,
  ip_hash text, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_org_created_idx ON audit_logs(organization_id, created_at DESC);
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id), notification_type text NOT NULL, title text NOT NULL, body text,
  read_at timestamptz, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  provider text, external_subscription_id text, plan text NOT NULL DEFAULT 'demo', status text NOT NULL DEFAULT 'inactive',
  period_start timestamptz, period_end timestamptz, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);

-- Organization scoping is enforced here after trusted server middleware sets
-- app.organization_id. Policies do not replace authentication or role checks.
CREATE FUNCTION app_current_organization_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.organization_id', true), '')::uuid $$;
CREATE FUNCTION app_current_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::uuid $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'jurisdictions','parcels','parcel_geometries','zoning_districts','zoning_documents','zoning_document_chunks',
    'zoning_rules','land_use_records','housing_indicators','environmental_constraints','infrastructure_records',
    'development_scenarios','feasibility_analyses','financial_models','opportunity_scores','funding_programs',
    'data_providers','data_sources','ai_analysis_runs','ai_agent_logs','reports','saved_properties','projects',
    'audit_logs','notifications','subscriptions','organization_members'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY organization_scope ON %I USING (organization_id = app_current_organization_id()) WITH CHECK (organization_id = app_current_organization_id())', t);
  END LOOP;
  ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
  CREATE POLICY organization_scope ON organizations USING (id = app_current_organization_id());
  CREATE POLICY user_membership_lookup ON organization_members FOR SELECT USING (user_id = app_current_user_id());
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  CREATE POLICY user_profile_scope ON users USING (
    id = app_current_user_id() OR EXISTS (
      SELECT 1 FROM organization_members m
      WHERE m.user_id = users.id AND m.organization_id = app_current_organization_id()
    )
  );
END $$;

COMMIT;
