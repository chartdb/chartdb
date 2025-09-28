import { DatabaseEdition } from '@/lib/domain/database-edition';
import { DatabaseClient } from '@/lib/domain/database-clients';

const withExtras = true;

const withDefault = `COALESCE(REPLACE(p.dflt_value, '"', '\\"'), '')`;
const withoutDefault = `null`;

const sqliteQuery = `${`/* Standard SQLite */`}
WITH fk_info AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'column', fk."from",
              'foreign_key_name',
                  'fk_' || m.name || '_' || fk."from" || '_' || fk."table" || '_' || fk."to",  -- Generated foreign key name
              'reference_schema', '', -- SQLite does not have schemas
              'reference_table', fk."table",
              'reference_column', fk."to",
              'fk_def',
                  'FOREIGN KEY (' || fk."from" || ') REFERENCES ' || fk."table" || '(' || fk."to" || ')' ||
                  ' ON UPDATE ' || fk.on_update || ' ON DELETE ' || fk.on_delete
          )
      ) AS fk_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_foreign_key_list(m.name) fk
  ON
      m.type = 'table'
), pk_info AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', pk.table_name,
              'field_count', pk.field_count,
              'column', pk.pk_column,
              'pk_def', 'PRIMARY KEY (' || pk.pk_column || ')'
          )
      ) AS pk_metadata
  FROM
  (
      SELECT
          m.name AS table_name,
          COUNT(p.name) AS field_count,  -- Count of primary key columns
          GROUP_CONCAT(p.name) AS pk_column  -- Concatenated list of primary key columns
      FROM
          sqlite_master m
      JOIN
          pragma_table_info(m.name) p
      ON
          m.type = 'table' AND p.pk > 0
      GROUP BY
          m.name
  ) pk
), indexes_metadata AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'name', idx.name,
              'column', ic.name,
              'index_type', 'B-TREE',  -- SQLite uses B-Trees for indexing
              'cardinality', null,  -- SQLite does not provide cardinality
              'size', null,  -- SQLite does not provide index size
              'unique', (CASE WHEN idx."unique" = 1 THEN true ELSE false END),
              'direction', '',  -- SQLite does not provide direction info
              'column_position', ic.seqno + 1  -- Adding 1 to convert from zero-based to one-based index
          )
      ) AS indexes_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_index_list(m.name) idx
  ON
      m.type = 'table'
  JOIN
      pragma_index_info(idx.name) ic
), cols AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'name', p.name,
              'type',
                  CASE
                      WHEN INSTR(LOWER(p.type), '(') > 0 THEN
                          SUBSTR(LOWER(p.type), 1, INSTR(LOWER(p.type), '(') - 1)
                      ELSE LOWER(p.type)
                  END,
              'ordinal_position', p.cid,
              'nullable', (CASE WHEN p."notnull" = 0 THEN true ELSE false END),
              'collation', '',
              'character_maximum_length',
                  CASE
                      WHEN LOWER(p.type) LIKE 'char%' OR LOWER(p.type) LIKE 'varchar%' THEN
                          CASE
                              WHEN INSTR(p.type, '(') > 0 THEN
                                  REPLACE(SUBSTR(p.type, INSTR(p.type, '(') + 1, LENGTH(p.type) - INSTR(p.type, '(') - 1), ')', '')
                              ELSE 'null'
                          END
                      ELSE 'null'
                  END,
              'precision',
              CASE
                  WHEN LOWER(p.type) LIKE 'decimal%' OR LOWER(p.type) LIKE 'numeric%' THEN
                      CASE
                          WHEN instr(p.type, '(') > 0 THEN
                              json_object(
                                  'precision', CAST(substr(p.type, instr(p.type, '(') + 1, instr(p.type, ',') - instr(p.type, '(') - 1) AS INTEGER),
                                  'scale', CAST(substr(p.type, instr(p.type, ',') + 1, instr(p.type, ')') - instr(p.type, ',') - 1) AS INTEGER)
                              )
                          ELSE null
                      END
                  ELSE null
              END,
              'default', ${withExtras ? withDefault : withoutDefault},
              'is_identity', 
              CASE 
                  WHEN p.pk = 1 AND LOWER(p.type) LIKE '%int%' THEN json('true')
                  WHEN LOWER((SELECT sql FROM sqlite_master WHERE name = m.name)) LIKE '%' || p.name || '%autoincrement%' THEN json('true')
                  ELSE json('false')
              END
          )
      ) AS cols_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_table_info(m.name) p
  ON
      m.type in ('table', 'view')
), tbls AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',  -- SQLite does not have schemas
              'table', m.name,
              'rows', -1,
              'type', 'table',
              'engine', '',  -- SQLite does not use storage engines
              'collation', ''  -- Collation information is not available
          )
      ) AS tbls_metadata
  FROM
      sqlite_master m
  WHERE
      m.type in ('table', 'view')
), views AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'view_name', m.name
          )
      ) AS views_metadata
  FROM
      sqlite_master m
  WHERE
      m.type = 'view'
)
SELECT
replace(replace(replace(
      json_object(
          'fk_info', (SELECT fk_metadata FROM fk_info),
          'pk_info', (SELECT pk_metadata FROM pk_info),
          'columns', (SELECT cols_metadata FROM cols),
          'indexes', (SELECT indexes_metadata FROM indexes_metadata),
          'tables', (SELECT tbls_metadata FROM tbls),
          'views', (SELECT views_metadata FROM views),
          'database_name', 'sqlite',
          'version', sqlite_version()
      ),
      '\\"', '"'),'"[', '['), ']"', ']'
) AS metadata_json_to_import;
`;

const cloudflareD1Query = `${`/* Cloudflare D1 SQLite */`}
WITH fk_info AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'table', m.name,
              'column', fk.[from],
              'foreign_key_name',
                  'fk_' || m.name || '_' || fk.[from] || '_' || fk.[table] || '_' || fk.[to],
              'reference_schema', '',
              'reference_table', fk.[table],
              'reference_column', fk.[to],
              'fk_def',
                  'FOREIGN KEY (' || fk.[from] || ') REFERENCES ' || fk.[table] || '(' || fk.[to] || ')' ||
                  ' ON UPDATE ' || fk.on_update || ' ON DELETE ' || fk.on_delete
          )
      ) AS fk_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_foreign_key_list(m.name) fk
  ON
      m.type = 'table'
  WHERE
      m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
), pk_info AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'table', pk.table_name,
              'field_count', pk.field_count,
              'column', pk.pk_column,
              'pk_def', 'PRIMARY KEY (' || pk.pk_column || ')'
          )
      ) AS pk_metadata
  FROM
  (
      SELECT
          m.name AS table_name,
          COUNT(p.name) AS field_count,
          GROUP_CONCAT(p.name) AS pk_column
      FROM
          sqlite_master m
      JOIN
          pragma_table_info(m.name) p
      ON
          m.type = 'table' AND p.pk > 0
      WHERE
          m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
      GROUP BY
          m.name
  ) pk
), indexes_metadata AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'table', m.name,
              'name', idx.name,
              'column', ic.name,
              'index_type', 'B-TREE',
              'cardinality', null,
              'size', null,
              'unique', (CASE WHEN idx.[unique] = 1 THEN true ELSE false END),
              'direction', '',
              'column_position', ic.seqno + 1
          )
      ) AS indexes_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_index_list(m.name) idx
  ON
      m.type = 'table'
  JOIN
      pragma_index_info(idx.name) ic
  WHERE
      m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
), cols AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'table', m.name,
              'name', p.name,
              'type',
                  CASE
                      WHEN INSTR(LOWER(p.type), '(') > 0 THEN
                          SUBSTR(LOWER(p.type), 1, INSTR(LOWER(p.type), '(') - 1)
                      ELSE LOWER(p.type)
                  END,
              'ordinal_position', p.cid,
              'nullable', (CASE WHEN p.[notnull] = 0 THEN true ELSE false END),
              'collation', '',
              'character_maximum_length',
                  CASE
                      WHEN LOWER(p.type) LIKE 'char%' OR LOWER(p.type) LIKE 'varchar%' THEN
                          CASE
                              WHEN INSTR(p.type, '(') > 0 THEN
                                  REPLACE(SUBSTR(p.type, INSTR(p.type, '(') + 1, LENGTH(p.type) - INSTR(p.type, '(') - 1), ')', '')
                              ELSE 'null'
                          END
                      ELSE 'null'
                  END,
              'precision',
              CASE
                  WHEN LOWER(p.type) LIKE 'decimal%' OR LOWER(p.type) LIKE 'numeric%' THEN
                      CASE
                          WHEN instr(p.type, '(') > 0 THEN
                              json_object(
                                  'precision', CAST(substr(p.type, instr(p.type, '(') + 1, instr(p.type, ',') - instr(p.type, '(') - 1) AS INTEGER),
                                  'scale', CAST(substr(p.type, instr(p.type, ',') + 1, instr(p.type, ')') - instr(p.type, ',') - 1) AS INTEGER)
                              )
                          ELSE null
                      END
                  ELSE null
              END,
              'default', ${withExtras ? withDefault : withoutDefault},
              'is_identity', 
              CASE 
                  WHEN p.pk = 1 AND LOWER(p.type) LIKE '%int%' THEN json('true')
                  WHEN LOWER((SELECT sql FROM sqlite_master WHERE name = m.name)) LIKE '%' || p.name || '%autoincrement%' THEN json('true')
                  ELSE json('false')
              END
          )
      ) AS cols_metadata
  FROM
      sqlite_master m
  JOIN
      pragma_table_info(m.name) p
  ON
      m.type in ('table', 'view')
  WHERE
      m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
), tbls AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'table', m.name,
              'rows', -1,
              'type', 'table',
              'engine', '',
              'collation', ''
          )
      ) AS tbls_metadata
  FROM
      sqlite_master m
  WHERE
      m.type in ('table', 'view') AND m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
), views AS (
  SELECT
      json_group_array(
          json_object(
              'schema', '',
              'view_name', m.name
          )
      ) AS views_metadata
  FROM
      sqlite_master m
  WHERE
      m.type = 'view' AND m.name NOT LIKE '\\_cf\\_%' ESCAPE '\\'
)
SELECT
replace(replace(replace(
      json_object(
          'fk_info', (SELECT fk_metadata FROM fk_info),
          'pk_info', (SELECT pk_metadata FROM pk_info),
          'columns', (SELECT cols_metadata FROM cols),
          'indexes', (SELECT indexes_metadata FROM indexes_metadata),
          'tables', (SELECT tbls_metadata FROM tbls),
          'views', (SELECT views_metadata FROM views),
          'database_name', 'sqlite',
          'version', ''
      ),
      '\\"', '"'),'"[', '['), ']"', ']'
) AS metadata_json_to_import;
`;

// Generate Wrangler CLI command wrapper around the D1 query
const generateWranglerCommand = (): string => {
    return `# Cloudflare D1 (via Wrangler CLI) Import Script
# ------------------------------------------------------
# This query will extract your D1 database schema using Cloudflare's Wrangler CLI
#
# Prerequisites:
# 1. Install Wrangler CLI if you haven't already: npm install -g wrangler
# 2. Login to your Cloudflare account: wrangler login
# 3. Make sure that your wrangler.jsonc or wrangler.toml file has the following:
# [d1_databases]
#   [d1_databases.DB]
#     database_name = "YOUR_DB_NAME"
#     database_id = "YOUR_DB_ID"
# 4. Replace YOUR_DB_NAME with your actual D1 database name
# 5. Replace YOUR_DB_ID with your actual D1 database ID

# Step 1: Write the query to a file
wrangler d1 execute YOUR_DB_NAME --command $'WITH fk_info AS (  SELECT json_group_array(    json_object(      \\'schema\\', \\'\\',      \\'table\\', m.name,      \\'column\\', fk.[from],      \\'foreign_key_name\\', \\'fk_\\' || m.name || \\'_\\' || fk.[from] || \\'_\\' || fk.[table] || \\'_\\' || fk.[to],      \\'reference_schema\\', \\'\\',      \\'reference_table\\', fk.[table],      \\'reference_column\\', fk.[to],      \\'fk_def\\', \\'FOREIGN KEY (\\' || fk.[from] || \\') REFERENCES \\' || fk.[table] || \\'(\\' || fk.[to] || \\')\\' || \\' ON UPDATE \\' || fk.on_update || \\' ON DELETE \\' || fk.on_delete    )  ) AS fk_metadata  FROM sqlite_master m  JOIN pragma_foreign_key_list(m.name) fk   ON m.type = \\'table\\'  WHERE m.name NOT LIKE \\'\\\\_cf\\\\_%\\' ESCAPE \\'\\\\\\' ), pk_info AS (  SELECT json_group_array(    json_object(      \\'schema\\', \\'\\',      \\'table\\', pk.table_name,      \\'field_count\\', pk.field_count,      \\'column\\', pk.pk_column,      \\'pk_def\\', \\'PRIMARY KEY (\\' || pk.pk_column || \\')\\'    )  ) AS pk_metadata  FROM (    SELECT m.name AS table_name,           COUNT(p.name) AS field_count,           GROUP_CONCAT(p.name) AS pk_column    FROM sqlite_master m    JOIN pragma_table_info(m.name) p      ON m.type = \\'table\\' AND p.pk > 0    WHERE m.name NOT LIKE \\'\\\\_cf\\\\_%\\' ESCAPE \\'\\\\\\'    GROUP BY m.name  ) pk ), indexes_metadata AS (  SELECT json_group_array(    json_object(      \\'schema\\', \\'\\',      \\'table\\', m.name,      \\'name\\', idx.name,      \\'column\\', ic.name,      \\'index_type\\', \\'B-TREE\\',      \\'cardinality\\', \\'\\',      \\'size\\', null,      \\'unique\\', CASE WHEN idx.[unique] = 1 THEN true ELSE false END,      \\'direction\\', \\'\\',      \\'column_position\\', ic.seqno + 1    )  ) AS indexes_metadata  FROM sqlite_master m  JOIN pragma_index_list(m.name) idx   ON m.type = \\'table\\'  JOIN pragma_index_info(idx.name) ic  WHERE m.name NOT LIKE \\'\\\\_cf\\\\_%\\' ESCAPE \\'\\\\\\' ), cols AS (  SELECT json_group_array(    json_object(      \\'schema\\', \\'\\',      \\'table\\', m.name,      \\'name\\', p.name,      \\'type\\', CASE WHEN INSTR(LOWER(p.type), \\'(\\') > 0 THEN SUBSTR(LOWER(p.type), 1, INSTR(LOWER(p.type), \\'(\\') - 1) ELSE LOWER(p.type) END,      \\'ordinal_position\\', p.cid,      \\'nullable\\', CASE WHEN p.[notnull] = 0 THEN true ELSE false END,      \\'collation\\', \\'\\',      \\'character_maximum_length\\', CASE        WHEN LOWER(p.type) LIKE \\'char%\\' OR LOWER(p.type) LIKE \\'varchar%\\' THEN          CASE WHEN INSTR(p.type, \\'(\\') > 0 THEN            REPLACE(              SUBSTR(p.type, INSTR(p.type, \\'(\\') + 1, LENGTH(p.type) - INSTR(p.type, \\'(\\') - 1),              \\')\\', \\'\\'            )          ELSE \\'null\\' END        ELSE \\'null\\' END,      \\'precision\\', CASE        WHEN LOWER(p.type) LIKE \\'decimal%\\' OR LOWER(p.type) LIKE \\'numeric%\\' THEN          CASE WHEN instr(p.type, \\'(\\') > 0 THEN json_object(            \\'precision\\', CAST(substr(p.type, instr(p.type, \\'(\\') + 1, instr(p.type, \\',\\') - instr(p.type, \\'(\\') - 1) as INTIGER),            \\'scale\\',     CAST(substr(p.type, instr(p.type, \\',\\') + 1, instr(p.type, \\')\\') - instr(p.type, \\',\\') - 1) AS INTIGER)          ) ELSE null END        ELSE null END,      \\'default\\', COALESCE(REPLACE(p.dflt_value, \\'"\\', \\'\\\\\\"\\'), \\'\\')    )  ) AS cols_metadata  FROM sqlite_master m  JOIN pragma_table_info(m.name) p   ON m.type in (\\'table\\', \\'view\\')  WHERE m.name NOT LIKE \\'\\\\_cf\\\\_%\\' ESCAPE \\'\\\\\\' ), tbls AS (  SELECT json_group_array(    json_object(      \\'schema\\', \\'\\',      \\'table\\', m.name,      \\'rows\\', -1,      \\'type\\', \\'table\\',      \\'engine\\', \\'\\',      \\'collation\\', \\'\\'    )  ) AS tbls_metadata  FROM sqlite_master m  WHERE m.type in (\\'table\\', \\'view\\')    AND m.name NOT LIKE \\'\\\\_cf\\\\_%\\' ESCAPE \\'\\\\\\' ), views AS (  SELECT json_group_array(    json_object(      \\'schema\\', \\'\\',      \\'view_name\\', m.name    )  ) AS views_metadata  FROM sqlite_master m  WHERE m.type = \\'view\\'    AND m.name NOT LIKE \\'\\\\_cf\\\\_%\\' ESCAPE \\'\\\\\\' ) SELECT json_object(  \\'fk_info\\', json((SELECT fk_metadata      FROM fk_info)),  \\'pk_info\\', json((SELECT pk_metadata      FROM pk_info)),  \\'columns\\', json((SELECT cols_metadata    FROM cols)),  \\'indexes\\', json((SELECT indexes_metadata FROM indexes_metadata)),  \\'tables\\',  json((SELECT tbls_metadata    FROM tbls)),  \\'views\\',   json((SELECT views_metadata   FROM views)),  \\'database_name\\', \\'sqlite\\',  \\'version\\', \\'\\' ) AS metadata_json_to_import;' --remote

# Step 2: Copy the output of the command above and paste it into app.chartdb.io
`;
};

export const getSQLiteQuery = (
    options: {
        databaseEdition?: DatabaseEdition;
        databaseClient?: DatabaseClient;
    } = {}
): string => {
    // For Cloudflare D1 edition, return the D1 script
    if (options.databaseEdition === DatabaseEdition.SQLITE_CLOUDFLARE_D1) {
        // Generate the Wrangler CLI command based on client
        const isWranglerClient =
            options?.databaseClient === DatabaseClient.SQLITE_WRANGLER;

        if (isWranglerClient) {
            return generateWranglerCommand();
        }

        return cloudflareD1Query;
    }

    // Default SQLite script
    return sqliteQuery;
};
