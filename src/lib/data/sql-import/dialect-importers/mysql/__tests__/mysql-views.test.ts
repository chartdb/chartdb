import { describe, it, expect } from 'vitest';
import { fromMySQL } from '../mysql';

const SQL_WITH_VIEWS = `
-- MySQL 8+ example schema: 12 tables + 6 views
-- Domain: small SaaS app (orgs, users, projects, issues, billing, events)

CREATE DATABASE IF NOT EXISTS demo;
USE demo;

-- ----------------
-- Tables (12)
-- ----------------

CREATE TABLE organizations (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200) NOT NULL,
  slug       VARCHAR(80)  NOT NULL,
  plan_tier  VARCHAR(30)  NOT NULL DEFAULT 'free',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_organizations_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE users (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email      VARCHAR(320) NOT NULL,
  full_name  VARCHAR(200) NULL,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE org_memberships (
  org_id    BIGINT UNSIGNED NOT NULL,
  user_id   BIGINT UNSIGNED NOT NULL,
  role      VARCHAR(30) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (org_id, user_id),
  CONSTRAINT fk_org_memberships_org
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_memberships_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE projects (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  project_key VARCHAR(20)  NOT NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_org_key (org_id, project_key),
  KEY ix_projects_org_id (org_id),
  CONSTRAINT fk_projects_org
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE labels (
  id     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id BIGINT UNSIGNED NOT NULL,
  name   VARCHAR(80) NOT NULL,
  color  VARCHAR(20) NOT NULL DEFAULT '#999999',
  PRIMARY KEY (id),
  UNIQUE KEY uq_labels_org_name (org_id, name),
  KEY ix_labels_org_id (org_id),
  CONSTRAINT fk_labels_org
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE issues (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  BIGINT UNSIGNED NOT NULL,
  title       VARCHAR(300) NOT NULL,
  description TEXT NULL,
  status      VARCHAR(30) NOT NULL DEFAULT 'open',
  priority    INT NOT NULL DEFAULT 3,
  created_by  BIGINT UNSIGNED NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  closed_at   TIMESTAMP(3) NULL,
  PRIMARY KEY (id),
  KEY ix_issues_project_status (project_id, status),
  KEY ix_issues_created_by (created_by),
  CONSTRAINT fk_issues_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_issues_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT ck_issues_status CHECK (status IN ('open','in_progress','closed')),
  CONSTRAINT ck_issues_priority CHECK (priority BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE issue_labels (
  issue_id BIGINT UNSIGNED NOT NULL,
  label_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (issue_id, label_id),
  KEY ix_issue_labels_label (label_id),
  CONSTRAINT fk_issue_labels_issue
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_issue_labels_label
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comments (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id   BIGINT UNSIGNED NOT NULL,
  author_id  BIGINT UNSIGNED NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_comments_issue_created_at (issue_id, created_at),
  KEY ix_comments_author_id (author_id),
  CONSTRAINT fk_comments_issue
    FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE api_keys (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id       BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(120) NOT NULL,
  key_hash     VARCHAR(200) NOT NULL,
  last_used_at TIMESTAMP(3) NULL,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_api_keys_org_name (org_id, name),
  KEY ix_api_keys_org_id (org_id),
  CONSTRAINT fk_api_keys_org
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id       BIGINT UNSIGNED NOT NULL,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       VARCHAR(30) NOT NULL DEFAULT 'open',
  total_cents  INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_invoices_org_status (org_id, status),
  CONSTRAINT fk_invoices_org
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT ck_invoices_period CHECK (period_end >= period_start),
  CONSTRAINT ck_invoices_status CHECK (status IN ('open','paid','void')),
  CONSTRAINT ck_invoices_total_cents CHECK (total_cents >= 0)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  invoice_id  BIGINT UNSIGNED NOT NULL,
  provider    VARCHAR(30) NOT NULL,
  amount_cents INT NOT NULL,
  paid_at     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_payments_invoice_id (invoice_id),
  CONSTRAINT fk_payments_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT ck_payments_amount CHECK (amount_cents > 0)
) ENGINE=InnoDB;

CREATE TABLE events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NULL,
  event_type  VARCHAR(80) NOT NULL,
  metadata    JSON NOT NULL,
  occurred_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_events_org_occurred_at (org_id, occurred_at),
  KEY ix_events_user_id (user_id),
  CONSTRAINT fk_events_org
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_events_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------
-- Views (6)
-- ----------------

CREATE OR REPLACE VIEW v_active_org_members AS
SELECT
  o.id   AS org_id,
  o.slug AS org_slug,
  u.id   AS user_id,
  u.email,
  u.full_name,
  m.role,
  m.joined_at
FROM org_memberships m
JOIN organizations o ON o.id = m.org_id
JOIN users u         ON u.id = m.user_id
WHERE u.is_active = 1;

CREATE OR REPLACE VIEW v_project_issue_summary AS
SELECT
  p.id AS project_id,
  p.org_id,
  p.name AS project_name,
  p.project_key,
  SUM(CASE WHEN i.status = 'open'        THEN 1 ELSE 0 END) AS open_issues,
  SUM(CASE WHEN i.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_issues,
  SUM(CASE WHEN i.status = 'closed'      THEN 1 ELSE 0 END) AS closed_issues,
  COUNT(i.id)                                               AS total_issues,
  MAX(i.created_at)                                         AS last_issue_created_at
FROM projects p
LEFT JOIN issues i ON i.project_id = p.id
GROUP BY p.id, p.org_id, p.name, p.project_key;

CREATE OR REPLACE VIEW v_issue_details AS
SELECT
  i.id AS issue_id,
  i.project_id,
  p.org_id,
  i.title,
  i.status,
  i.priority,
  i.created_at,
  i.closed_at,
  i.created_by,
  u.email AS created_by_email,
  (SELECT COUNT(*) FROM comments c WHERE c.issue_id = i.id) AS comment_count
FROM issues i
JOIN projects p ON p.id = i.project_id
LEFT JOIN users u ON u.id = i.created_by;

CREATE OR REPLACE VIEW v_invoice_balances AS
SELECT
  inv.id AS invoice_id,
  inv.org_id,
  inv.period_start,
  inv.period_end,
  inv.status,
  inv.total_cents,
  COALESCE(SUM(pay.amount_cents), 0) AS paid_cents,
  GREATEST(inv.total_cents - COALESCE(SUM(pay.amount_cents), 0), 0) AS due_cents,
  MAX(pay.paid_at) AS last_payment_at
FROM invoices inv
LEFT JOIN payments pay ON pay.invoice_id = inv.id
GROUP BY inv.id, inv.org_id, inv.period_start, inv.period_end, inv.status, inv.total_cents;

CREATE OR REPLACE VIEW v_recent_events AS
SELECT
  e.id,
  e.org_id,
  o.slug AS org_slug,
  e.user_id,
  u.email AS user_email,
  e.event_type,
  e.metadata,
  e.occurred_at
FROM events e
JOIN organizations o ON o.id = e.org_id
LEFT JOIN users u ON u.id = e.user_id
WHERE e.occurred_at >= (UTC_TIMESTAMP(3) - INTERVAL 7 DAY);

CREATE OR REPLACE VIEW v_org_activity_daily AS
SELECT
  e.org_id,
  DATE(e.occurred_at) AS day,
  COUNT(*) AS events_count,
  SUM(CASE WHEN e.event_type = 'login' THEN 1 ELSE 0 END) AS logins
FROM events e
WHERE e.occurred_at >= (UTC_TIMESTAMP(3) - INTERVAL 30 DAY)
GROUP BY e.org_id, DATE(e.occurred_at);
`;

describe('MySQL View Import', () => {
    it('should import 12 tables and 6 views', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        // Count tables and views
        const tables = result.tables.filter((t) => !t.isView);
        const views = result.tables.filter((t) => t.isView);

        expect(tables.length).toBe(12);
        expect(views.length).toBe(6);
    });

    it('should correctly parse view names', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        const views = result.tables.filter((t) => t.isView);
        const viewNames = views.map((v) => v.name).sort();

        expect(viewNames).toEqual([
            'v_active_org_members',
            'v_invoice_balances',
            'v_issue_details',
            'v_org_activity_daily',
            'v_project_issue_summary',
            'v_recent_events',
        ]);
    });

    it('should correctly parse table names', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        const tables = result.tables.filter((t) => !t.isView);
        const tableNames = tables.map((t) => t.name).sort();

        expect(tableNames).toEqual([
            'api_keys',
            'comments',
            'events',
            'invoices',
            'issue_labels',
            'issues',
            'labels',
            'org_memberships',
            'organizations',
            'payments',
            'projects',
            'users',
        ]);
    });

    it('should parse relationships correctly', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        // Expected foreign key relationships (15 total):
        // 1. org_memberships.org_id -> organizations.id
        // 2. org_memberships.user_id -> users.id
        // 3. projects.org_id -> organizations.id
        // 4. labels.org_id -> organizations.id
        // 5. issues.project_id -> projects.id
        // 6. issues.created_by -> users.id
        // 7. issue_labels.issue_id -> issues.id
        // 8. issue_labels.label_id -> labels.id
        // 9. comments.issue_id -> issues.id
        // 10. comments.author_id -> users.id
        // 11. api_keys.org_id -> organizations.id
        // 12. invoices.org_id -> organizations.id
        // 13. payments.invoice_id -> invoices.id
        // 14. events.org_id -> organizations.id
        // 15. events.user_id -> users.id

        // Should have exactly 15 relationships (no duplicates)
        expect(result.relationships.length).toBe(15);

        // Create a map for easier lookup
        const relationshipMap = new Map<
            string,
            (typeof result.relationships)[0]
        >();
        for (const rel of result.relationships) {
            const key = `${rel.sourceTable}.${rel.sourceColumn}->${rel.targetTable}.${rel.targetColumn}`;
            relationshipMap.set(key, rel);
        }

        // Validate each relationship exists and is correctly defined
        const expectedRelationships = [
            {
                sourceTable: 'org_memberships',
                sourceColumn: 'org_id',
                targetTable: 'organizations',
                targetColumn: 'id',
            },
            {
                sourceTable: 'org_memberships',
                sourceColumn: 'user_id',
                targetTable: 'users',
                targetColumn: 'id',
            },
            {
                sourceTable: 'projects',
                sourceColumn: 'org_id',
                targetTable: 'organizations',
                targetColumn: 'id',
            },
            {
                sourceTable: 'labels',
                sourceColumn: 'org_id',
                targetTable: 'organizations',
                targetColumn: 'id',
            },
            {
                sourceTable: 'issues',
                sourceColumn: 'project_id',
                targetTable: 'projects',
                targetColumn: 'id',
            },
            {
                sourceTable: 'issues',
                sourceColumn: 'created_by',
                targetTable: 'users',
                targetColumn: 'id',
            },
            {
                sourceTable: 'issue_labels',
                sourceColumn: 'issue_id',
                targetTable: 'issues',
                targetColumn: 'id',
            },
            {
                sourceTable: 'issue_labels',
                sourceColumn: 'label_id',
                targetTable: 'labels',
                targetColumn: 'id',
            },
            {
                sourceTable: 'comments',
                sourceColumn: 'issue_id',
                targetTable: 'issues',
                targetColumn: 'id',
            },
            {
                sourceTable: 'comments',
                sourceColumn: 'author_id',
                targetTable: 'users',
                targetColumn: 'id',
            },
            {
                sourceTable: 'api_keys',
                sourceColumn: 'org_id',
                targetTable: 'organizations',
                targetColumn: 'id',
            },
            {
                sourceTable: 'invoices',
                sourceColumn: 'org_id',
                targetTable: 'organizations',
                targetColumn: 'id',
            },
            {
                sourceTable: 'payments',
                sourceColumn: 'invoice_id',
                targetTable: 'invoices',
                targetColumn: 'id',
            },
            {
                sourceTable: 'events',
                sourceColumn: 'org_id',
                targetTable: 'organizations',
                targetColumn: 'id',
            },
            {
                sourceTable: 'events',
                sourceColumn: 'user_id',
                targetTable: 'users',
                targetColumn: 'id',
            },
        ];

        for (const expected of expectedRelationships) {
            const key = `${expected.sourceTable}.${expected.sourceColumn}->${expected.targetTable}.${expected.targetColumn}`;
            expect(
                relationshipMap.has(key),
                `Missing relationship: ${key}`
            ).toBe(true);
        }

        // Verify all relationships have valid sourceTableId and targetTableId
        for (const rel of result.relationships) {
            expect(
                rel.sourceTableId,
                `Relationship ${rel.sourceTable}.${rel.sourceColumn} missing sourceTableId`
            ).toBeTruthy();
            expect(
                rel.targetTableId,
                `Relationship ${rel.sourceTable}.${rel.sourceColumn} missing targetTableId`
            ).toBeTruthy();
        }
    });

    it('should correctly parse the organizations table', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        const orgsTable = result.tables.find((t) => t.name === 'organizations');

        expect(orgsTable).toBeDefined();
        expect(orgsTable?.isView).toBeFalsy();

        // Check columns
        const columnNames = orgsTable?.columns.map((c) => c.name);
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('name');
        expect(columnNames).toContain('slug');
        expect(columnNames).toContain('plan_tier');
        expect(columnNames).toContain('created_at');

        // Check id column properties
        const idColumn = orgsTable?.columns.find((c) => c.name === 'id');
        expect(idColumn?.primaryKey).toBe(true);
        expect(idColumn?.increment).toBe(true);

        // Check name column properties
        const nameColumn = orgsTable?.columns.find((c) => c.name === 'name');
        expect(nameColumn?.nullable).toBe(false);
        expect(nameColumn?.type.toLowerCase()).toContain('varchar');
    });

    it('should correctly parse the issues table', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        const issuesTable = result.tables.find((t) => t.name === 'issues');

        expect(issuesTable).toBeDefined();
        expect(issuesTable?.isView).toBeFalsy();

        // Check columns
        const columnNames = issuesTable?.columns.map((c) => c.name);
        expect(columnNames).toContain('id');
        expect(columnNames).toContain('project_id');
        expect(columnNames).toContain('title');
        expect(columnNames).toContain('description');
        expect(columnNames).toContain('status');
        expect(columnNames).toContain('priority');
        expect(columnNames).toContain('created_by');
        expect(columnNames).toContain('created_at');
        expect(columnNames).toContain('closed_at');

        // Check id column properties
        const idColumn = issuesTable?.columns.find((c) => c.name === 'id');
        expect(idColumn?.primaryKey).toBe(true);
        expect(idColumn?.increment).toBe(true);

        // Check nullable columns
        const descColumn = issuesTable?.columns.find(
            (c) => c.name === 'description'
        );
        expect(descColumn?.nullable).toBe(true);

        const createdByColumn = issuesTable?.columns.find(
            (c) => c.name === 'created_by'
        );
        expect(createdByColumn?.nullable).toBe(true);

        const closedAtColumn = issuesTable?.columns.find(
            (c) => c.name === 'closed_at'
        );
        expect(closedAtColumn?.nullable).toBe(true);
    });

    it('should extract columns from views', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        const activeOrgMembersView = result.tables.find(
            (t) => t.name === 'v_active_org_members'
        );

        expect(activeOrgMembersView).toBeDefined();
        expect(activeOrgMembersView?.isView).toBe(true);

        // Check that columns were extracted from the SELECT clause
        const columnNames = activeOrgMembersView?.columns.map((c) => c.name);
        expect(columnNames).toContain('org_id');
        expect(columnNames).toContain('org_slug');
        expect(columnNames).toContain('user_id');
        expect(columnNames).toContain('email');
        expect(columnNames).toContain('full_name');
        expect(columnNames).toContain('role');
        expect(columnNames).toContain('joined_at');
    });

    it('should mark views with isView=true and tables with isView falsy', async () => {
        const result = await fromMySQL(SQL_WITH_VIEWS);

        const tables = result.tables.filter((t) => !t.isView);
        const views = result.tables.filter((t) => t.isView);

        // All tables should NOT have isView set
        tables.forEach((table) => {
            expect(table.isView).toBeFalsy();
        });

        // All views should have isView=true
        views.forEach((view) => {
            expect(view.isView).toBe(true);
        });
    });
});
