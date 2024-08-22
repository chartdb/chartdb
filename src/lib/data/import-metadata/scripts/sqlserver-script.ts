import { minimizeQuery } from './minimize-script';

const rawSqlServerQuery = `
WITH fk_info AS (
  SELECT
      JSON_QUERY(
          '[' + STRING_AGG(
              JSON_QUERY(N'{"schema": "' + kcu.CONSTRAINT_SCHEMA COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "table": "' + kcu.TABLE_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "column": "' + kcu.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "foreign_key_name": "' + kcu.CONSTRAINT_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "reference_table": "' + rcu.TABLE_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "reference_column": "' + rcu.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "fk_def": "FOREIGN KEY (' + kcu.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              ') REFERENCES ' + rcu.TABLE_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '(' + rcu.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              ') ON DELETE ' + rc.DELETE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS +
              ' ON UPDATE ' + rc.UPDATE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'),
              ','
          ) + N']'
      ) AS all_fks_json
  FROM
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
  JOIN
      INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
      ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
      AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
  JOIN
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE rcu
      ON rcu.CONSTRAINT_NAME = rc.UNIQUE_CONSTRAINT_NAME
      AND rcu.CONSTRAINT_SCHEMA = rc.UNIQUE_CONSTRAINT_SCHEMA
      AND rcu.ORDINAL_POSITION = kcu.ORDINAL_POSITION
), pk_info AS (
  SELECT
      JSON_QUERY(
          '[' + STRING_AGG(
              JSON_QUERY(N'{"schema": "' + pk.TABLE_SCHEMA COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "table": "' + pk.TABLE_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "column": "' + pk.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "pk_def": "PRIMARY KEY (' + pk.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS + ')"}'),
              ','
          ) + N']'
      ) AS all_pks_json
  FROM
      (
          SELECT
              kcu.TABLE_SCHEMA,
              kcu.TABLE_NAME,
              kcu.COLUMN_NAME
          FROM
              INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
          JOIN
              INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
              ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
              AND kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
          WHERE
              tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
      ) pk
),
cols AS (
  SELECT
      JSON_QUERY(
          '[' + STRING_AGG(
              JSON_QUERY('{"schema": "' + cols.TABLE_SCHEMA +
              '", "table": "' + cols.TABLE_NAME +
              '", "name": "' + cols.COLUMN_NAME +
              '", "ordinal_position": "' + CAST(cols.ORDINAL_POSITION AS NVARCHAR(MAX)) +
              '", "type": "' + LOWER(cols.DATA_TYPE) +
              '", "character_maximum_length": "' +
                  COALESCE(CAST(cols.CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(MAX)), 'null') +
              '", "precision": ' +
                  CASE
                      WHEN cols.DATA_TYPE IN ('numeric', 'decimal') THEN
                          CONCAT('{"precision":', COALESCE(CAST(cols.NUMERIC_PRECISION AS NVARCHAR(MAX)), 'null'),
                          ',"scale":', COALESCE(CAST(cols.NUMERIC_SCALE AS NVARCHAR(MAX)), 'null'), '}')
                      ELSE
                          'null'
                  END +
              ', "nullable": "' +
                  CASE WHEN cols.IS_NULLABLE = 'YES' THEN 'true' ELSE 'false' END +
              '", "default": "' +
                  COALESCE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '') +
              '", "collation": "' +
                  COALESCE(cols.COLLATION_NAME, '') +
              '"}'),
              ','
          ) + ']'
      ) AS all_columns_json
  FROM
      INFORMATION_SCHEMA.COLUMNS cols
  WHERE
      cols.TABLE_CATALOG = DB_NAME()
),
indexes AS (
  SELECT
      '[' + STRING_AGG(
          JSON_QUERY(
              N'{"schema": "' + s.name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "table": "' + t.name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "index_name": "' + i.name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "column_name": "' + c.name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "index_type": "' + LOWER(i.type_desc) COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "is_unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
              ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'
          ),
          ','
      ) + N']' AS all_indexes_json
  FROM
      sys.indexes i
  JOIN
      sys.tables t ON i.object_id = t.object_id
  JOIN
      sys.schemas s ON t.schema_id = s.schema_id
  JOIN
      sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
  JOIN
      sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
  WHERE
      s.name LIKE '%'
      AND i.name IS NOT NULL
),
tbls AS (
  SELECT
      '[' + STRING_AGG(
          JSON_QUERY(
              N'{"schema": "' + aggregated.schema_name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "table": "' + aggregated.table_name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "row_count": "' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
              '", "table_type": "' + aggregated.table_type COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + '"}'
          ),
          ','
      ) + N']' AS all_tables_json
  FROM
      (
          SELECT
              s.name AS schema_name,
              t.name AS table_name,
              SUM(p.rows) AS row_count,
              t.type_desc AS table_type,
              t.create_date AS creation_date
          FROM
              sys.tables t
          JOIN
              sys.schemas s ON t.schema_id = s.schema_id
          JOIN
              sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
          WHERE
              s.name LIKE '%'
          GROUP BY
              s.name, t.name, t.type_desc, t.create_date
      ) AS aggregated
),
views AS (
  SELECT
      '[' + STRING_AGG(
          JSON_QUERY(
              N'{"schema": "' + s.name COLLATE SQL_Latin1_General_CP1_CI_AS +
              '", "view_name": "' + v.name COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'
          ),
          ','
      ) + N']' AS all_views_json
  FROM
      sys.views v
  JOIN
      sys.schemas s ON v.schema_id = s.schema_id
  WHERE
      s.name LIKE '%'
)
SELECT JSON_QUERY(
      N'{"fk_info": ' + ISNULL((SELECT cast(all_fks_json as nvarchar(max)) FROM fk_info), N'[]') +
      ', "pk_info": ' + ISNULL((SELECT cast(all_pks_json as nvarchar(max)) FROM pk_info), N'[]') +
      ', "columns": ' + ISNULL((SELECT cast(all_columns_json as nvarchar(max)) FROM cols), N'[]') +
      ', "indexes": ' + ISNULL((SELECT cast(all_indexes_json as nvarchar(max)) FROM indexes), N'[]') +
      ', "tables": ' + ISNULL((SELECT cast(all_tables_json as nvarchar(max)) FROM tbls), N'[]') +
      ', "views": ' + ISNULL((SELECT cast(all_views_json as nvarchar(max)) FROM views), N'[]') +
      ', "database_name": "' + DB_NAME() + '"' +
      ', "version": ""}'
) AS full_json_result;
`;
export const SqlServerQuery = minimizeQuery(rawSqlServerQuery);
