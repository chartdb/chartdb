import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

const SQL_WITH_VIEWS = `
/* SQL Server (T-SQL) simple, "flat" schema: 12 tables + 6 views
   No dynamic EXEC, just straightforward CREATE statements.
*/

CREATE SCHEMA demo;
GO

-- ----------------
-- Tables (12)
-- ----------------

CREATE TABLE demo.organizations (
  id         bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_organizations PRIMARY KEY,
  name       nvarchar(200) NOT NULL,
  slug       nvarchar(80)  NOT NULL,
  plan_tier  nvarchar(30)  NOT NULL CONSTRAINT DF_organizations_plan_tier DEFAULT ('free'),
  created_at datetime2(3)  NOT NULL CONSTRAINT DF_organizations_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT UQ_organizations_slug UNIQUE (slug)
);
GO

CREATE TABLE demo.users (
  id         bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
  email      nvarchar(320) NOT NULL,
  full_name  nvarchar(200) NULL,
  is_active  bit NOT NULL CONSTRAINT DF_users_is_active DEFAULT (1),
  created_at datetime2(3) NOT NULL CONSTRAINT DF_users_created_at DEFAULT (SYSUTCDATETIME())
);
GO

CREATE TABLE demo.org_memberships (
  org_id    bigint NOT NULL,
  user_id   bigint NOT NULL,
  role      nvarchar(30) NOT NULL CONSTRAINT DF_org_memberships_role DEFAULT ('member'),
  joined_at datetime2(3) NOT NULL CONSTRAINT DF_org_memberships_joined_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT PK_org_memberships PRIMARY KEY (org_id, user_id),
  CONSTRAINT FK_org_memberships_org  FOREIGN KEY (org_id)  REFERENCES demo.organizations(id) ON DELETE CASCADE,
  CONSTRAINT FK_org_memberships_user FOREIGN KEY (user_id) REFERENCES demo.users(id)         ON DELETE CASCADE
);
GO

CREATE TABLE demo.projects (
  id          bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_projects PRIMARY KEY,
  org_id      bigint NOT NULL,
  name        nvarchar(200) NOT NULL,
  [key]       nvarchar(20)  NOT NULL,
  is_archived bit NOT NULL CONSTRAINT DF_projects_is_archived DEFAULT (0),
  created_at  datetime2(3) NOT NULL CONSTRAINT DF_projects_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_projects_org FOREIGN KEY (org_id) REFERENCES demo.organizations(id) ON DELETE CASCADE,
  CONSTRAINT UQ_projects_org_key UNIQUE (org_id, [key])
);
GO

CREATE TABLE demo.labels (
  id     bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_labels PRIMARY KEY,
  org_id bigint NOT NULL,
  name   nvarchar(80) NOT NULL,
  color  nvarchar(20) NOT NULL CONSTRAINT DF_labels_color DEFAULT ('#999999'),
  CONSTRAINT FK_labels_org FOREIGN KEY (org_id) REFERENCES demo.organizations(id) ON DELETE CASCADE,
  CONSTRAINT UQ_labels_org_name UNIQUE (org_id, name)
);
GO

CREATE TABLE demo.issues (
  id            bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_issues PRIMARY KEY,
  project_id    bigint NOT NULL,
  title         nvarchar(300) NOT NULL,
  [description] nvarchar(max) NULL,
  status        nvarchar(30) NOT NULL CONSTRAINT DF_issues_status DEFAULT ('open'),
  priority      int NOT NULL CONSTRAINT DF_issues_priority DEFAULT (3),
  created_by    bigint NULL,
  created_at    datetime2(3) NOT NULL CONSTRAINT DF_issues_created_at DEFAULT (SYSUTCDATETIME()),
  closed_at     datetime2(3) NULL,
  CONSTRAINT FK_issues_project    FOREIGN KEY (project_id) REFERENCES demo.projects(id) ON DELETE CASCADE,
  CONSTRAINT FK_issues_created_by FOREIGN KEY (created_by) REFERENCES demo.users(id)    ON DELETE SET NULL,
  CONSTRAINT CK_issues_status   CHECK (status IN ('open','in_progress','closed')),
  CONSTRAINT CK_issues_priority CHECK (priority BETWEEN 1 AND 5)
);
GO

CREATE TABLE demo.issue_labels (
  issue_id bigint NOT NULL,
  label_id bigint NOT NULL,
  CONSTRAINT PK_issue_labels PRIMARY KEY (issue_id, label_id),
  CONSTRAINT FK_issue_labels_issue FOREIGN KEY (issue_id) REFERENCES demo.issues(id)  ON DELETE CASCADE,
  CONSTRAINT FK_issue_labels_label FOREIGN KEY (label_id) REFERENCES demo.labels(id) ON DELETE CASCADE
);
GO

CREATE TABLE demo.comments (
  id         bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_comments PRIMARY KEY,
  issue_id   bigint NOT NULL,
  author_id  bigint NULL,
  body       nvarchar(max) NOT NULL,
  created_at datetime2(3) NOT NULL CONSTRAINT DF_comments_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_comments_issue  FOREIGN KEY (issue_id)  REFERENCES demo.issues(id) ON DELETE CASCADE,
  CONSTRAINT FK_comments_author FOREIGN KEY (author_id) REFERENCES demo.users(id)  ON DELETE SET NULL
);
GO

CREATE TABLE demo.api_keys (
  id           bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_api_keys PRIMARY KEY,
  org_id       bigint NOT NULL,
  name         nvarchar(120) NOT NULL,
  key_hash     nvarchar(200) NOT NULL,
  last_used_at datetime2(3) NULL,
  created_at   datetime2(3) NOT NULL CONSTRAINT DF_api_keys_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_api_keys_org FOREIGN KEY (org_id) REFERENCES demo.organizations(id) ON DELETE CASCADE,
  CONSTRAINT UQ_api_keys_org_name UNIQUE (org_id, name)
);
GO

CREATE TABLE demo.invoices (
  id           bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_invoices PRIMARY KEY,
  org_id       bigint NOT NULL,
  period_start date NOT NULL,
  period_end   date NOT NULL,
  status       nvarchar(30) NOT NULL CONSTRAINT DF_invoices_status DEFAULT ('open'),
  total_cents  int NOT NULL CONSTRAINT DF_invoices_total_cents DEFAULT (0),
  created_at   datetime2(3) NOT NULL CONSTRAINT DF_invoices_created_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_invoices_org FOREIGN KEY (org_id) REFERENCES demo.organizations(id) ON DELETE CASCADE,
  CONSTRAINT CK_invoices_period CHECK (period_end >= period_start),
  CONSTRAINT CK_invoices_status CHECK (status IN ('open','paid','void')),
  CONSTRAINT CK_invoices_total_cents CHECK (total_cents >= 0)
);
GO

CREATE TABLE demo.payments (
  id          bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_payments PRIMARY KEY,
  invoice_id  bigint NOT NULL,
  provider    nvarchar(30) NOT NULL,
  amount_cents int NOT NULL,
  paid_at     datetime2(3) NOT NULL CONSTRAINT DF_payments_paid_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_payments_invoice FOREIGN KEY (invoice_id) REFERENCES demo.invoices(id) ON DELETE CASCADE,
  CONSTRAINT CK_payments_amount CHECK (amount_cents > 0)
);
GO

CREATE TABLE demo.events (
  id          bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_events PRIMARY KEY,
  org_id      bigint NOT NULL,
  user_id     bigint NULL,
  event_type  nvarchar(80) NOT NULL,
  metadata    nvarchar(max) NOT NULL CONSTRAINT DF_events_metadata DEFAULT (N'{}'),
  occurred_at datetime2(3) NOT NULL CONSTRAINT DF_events_occurred_at DEFAULT (SYSUTCDATETIME()),
  CONSTRAINT FK_events_org  FOREIGN KEY (org_id) REFERENCES demo.organizations(id) ON DELETE CASCADE,
  CONSTRAINT FK_events_user FOREIGN KEY (user_id) REFERENCES demo.users(id)         ON DELETE SET NULL,
  CONSTRAINT CK_events_metadata_isjson CHECK (ISJSON(metadata) = 1)
);
GO

-- ----------------
-- Views (6)
-- ----------------

CREATE VIEW demo.v_active_org_members AS
SELECT
  o.id   AS org_id,
  o.slug AS org_slug,
  u.id   AS user_id,
  u.email,
  u.full_name,
  m.role,
  m.joined_at
FROM demo.org_memberships m
JOIN demo.organizations o ON o.id = m.org_id
JOIN demo.users u         ON u.id = m.user_id
WHERE u.is_active = 1;
GO

CREATE VIEW demo.v_project_issue_summary AS
SELECT
  p.id     AS project_id,
  p.org_id,
  p.name   AS project_name,
  p.[key]  AS project_key,
  SUM(CASE WHEN i.status = 'open'        THEN 1 ELSE 0 END) AS open_issues,
  SUM(CASE WHEN i.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_issues,
  SUM(CASE WHEN i.status = 'closed'      THEN 1 ELSE 0 END) AS closed_issues,
  COUNT(i.id)                                               AS total_issues,
  MAX(i.created_at)                                         AS last_issue_created_at
FROM demo.projects p
LEFT JOIN demo.issues i ON i.project_id = p.id
GROUP BY p.id, p.org_id, p.name, p.[key];
GO

CREATE VIEW demo.v_issue_details AS
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
  (SELECT COUNT(*) FROM demo.comments c WHERE c.issue_id = i.id) AS comment_count
FROM demo.issues i
JOIN demo.projects p ON p.id = i.project_id
LEFT JOIN demo.users u ON u.id = i.created_by;
GO

CREATE VIEW demo.v_invoice_balances AS
SELECT
  inv.id AS invoice_id,
  inv.org_id,
  inv.period_start,
  inv.period_end,
  inv.status,
  inv.total_cents,
  ISNULL(SUM(pay.amount_cents), 0) AS paid_cents,
  CASE
    WHEN inv.total_cents - ISNULL(SUM(pay.amount_cents), 0) < 0 THEN 0
    ELSE inv.total_cents - ISNULL(SUM(pay.amount_cents), 0)
  END AS due_cents,
  MAX(pay.paid_at) AS last_payment_at
FROM demo.invoices inv
LEFT JOIN demo.payments pay ON pay.invoice_id = inv.id
GROUP BY inv.id, inv.org_id, inv.period_start, inv.period_end, inv.status, inv.total_cents;
GO

CREATE VIEW demo.v_recent_events AS
SELECT
  e.id,
  e.org_id,
  o.slug AS org_slug,
  e.user_id,
  u.email AS user_email,
  e.event_type,
  e.metadata,
  e.occurred_at
FROM demo.events e
JOIN demo.organizations o ON o.id = e.org_id
LEFT JOIN demo.users u ON u.id = e.user_id
WHERE e.occurred_at >= DATEADD(day, -7, SYSUTCDATETIME());
GO

CREATE VIEW demo.v_org_activity_daily AS
SELECT
  e.org_id,
  CAST(e.occurred_at AS date) AS [day],
  COUNT(*) AS events_count,
  SUM(CASE WHEN e.event_type = 'login' THEN 1 ELSE 0 END) AS logins
FROM demo.events e
WHERE e.occurred_at >= DATEADD(day, -30, SYSUTCDATETIME())
GROUP BY e.org_id, CAST(e.occurred_at AS date);
GO
`;

describe('SQL Server View Import', () => {
    it('should import 12 tables and 6 views', async () => {
        const result = await fromSQLServer(SQL_WITH_VIEWS);

        // Count tables and views
        const tables = result.tables.filter((t) => !t.isView);
        const views = result.tables.filter((t) => t.isView);

        expect(tables.length).toBe(12);
        expect(views.length).toBe(6);
    });

    it('should correctly parse view names and schemas', async () => {
        const result = await fromSQLServer(SQL_WITH_VIEWS);

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

        // All views should be in the 'demo' schema
        views.forEach((view) => {
            expect(view.schema).toBe('demo');
        });
    });

    it('should correctly parse table names and schemas', async () => {
        const result = await fromSQLServer(SQL_WITH_VIEWS);

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

        // All tables should be in the 'demo' schema
        tables.forEach((table) => {
            expect(table.schema).toBe('demo');
        });
    });

    it('should extract columns from views', async () => {
        const result = await fromSQLServer(SQL_WITH_VIEWS);

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

    it('should parse relationships correctly', async () => {
        const result = await fromSQLServer(SQL_WITH_VIEWS);

        // Check that foreign key relationships are parsed
        expect(result.relationships.length).toBeGreaterThan(0);

        // Check for specific relationships
        const projectsOrgFk = result.relationships.find(
            (r) =>
                r.sourceTable === 'projects' &&
                r.targetTable === 'organizations'
        );
        expect(projectsOrgFk).toBeDefined();
        expect(projectsOrgFk?.sourceColumn).toBe('org_id');
        expect(projectsOrgFk?.targetColumn).toBe('id');
    });
});
