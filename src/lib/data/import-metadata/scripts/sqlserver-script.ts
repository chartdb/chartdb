import { DatabaseEdition } from '@/lib/domain/database-edition';

const sqlServerQuery = `WITH fk_info AS (
    SELECT
        JSON_QUERY(
            '[' + STRING_AGG(
                CONVERT(nvarchar(max),
                JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(kcu.CONSTRAINT_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "table": "' + COALESCE(REPLACE(kcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "column": "' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "foreign_key_name": "' + COALESCE(REPLACE(kcu.CONSTRAINT_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "reference_table": "' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "reference_column": "' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '", "fk_def": "FOREIGN KEY (' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            ') REFERENCES ' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            '(' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                            ') ON DELETE ' + rc.DELETE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS +
                            ' ON UPDATE ' + rc.UPDATE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS + '"}')
                ), ','
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
                CONVERT(nvarchar(max),
                JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(pk.TABLE_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "table": "' + COALESCE(REPLACE(pk.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "column": "' + COALESCE(REPLACE(pk.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "pk_def": "PRIMARY KEY (' + pk.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS + ')"}')
                ), ','
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
                CONVERT(nvarchar(max),
                JSON_QUERY('{"schema": "' + COALESCE(REPLACE(cols.TABLE_SCHEMA, '"', ''), '') +
                '", "table": "' + COALESCE(REPLACE(cols.TABLE_NAME, '"', ''), '') +
                '", "name": "' + COALESCE(REPLACE(cols.COLUMN_NAME, '"', ''), '') +
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
                    COALESCE(REPLACE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '"', '\\"'), '') +
                '", "collation": "' +
                    COALESCE(cols.COLLATION_NAME, '') +
                '"}')
                ), ','
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
            CONVERT(nvarchar(max),
            JSON_QUERY(
                N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "table": "' + COALESCE(REPLACE(t.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "index_name": "' + COALESCE(REPLACE(i.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "column_name": "' + COALESCE(REPLACE(c.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "index_type": "' + LOWER(i.type_desc) COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "is_unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
                ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'
            )
            ), ','
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
            CONVERT(nvarchar(max),
            JSON_QUERY(
                N'{"schema": "' + COALESCE(REPLACE(aggregated.schema_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "table": "' + COALESCE(REPLACE(aggregated.table_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "row_count": "' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
                '", "table_type": "' + aggregated.table_type COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + '"}'
            )
            ), ','
        ) + N']' AS all_tables_json
    FROM
        (
            SELECT
                COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                COALESCE(REPLACE(t.name, '"', ''), '') AS table_name,
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
            CONVERT(nvarchar(max),
            JSON_QUERY(
                N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                '", "view_name": "' + COALESCE(REPLACE(v.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'
            )
            ), ','
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
) AS metadata_json_to_import;
`;

const sqlServer2016AndBelowQuery = `WITH fk_info AS (
    SELECT
        JSON_QUERY(
            '[' + ISNULL(
                STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(kcu.CONSTRAINT_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "table": "' + COALESCE(REPLACE(kcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "column": "' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "foreign_key_name": "' + COALESCE(REPLACE(kcu.CONSTRAINT_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "reference_table": "' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "reference_column": "' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "fk_def": "FOREIGN KEY (' + COALESCE(REPLACE(kcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    ') REFERENCES ' + COALESCE(REPLACE(rcu.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '(' + COALESCE(REPLACE(rcu.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    ') ON DELETE ' + rc.DELETE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    ' ON UPDATE ' + rc.UPDATE_RULE COLLATE SQL_Latin1_General_CP1_CI_AS + '"}')
                        )
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
                    FOR XML PATH('')
                ), 1, 1, ''), '')
            + N']'
        ) AS all_fks_json
),
pk_info AS (
    SELECT
        JSON_QUERY(
            '[' + ISNULL(
                STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY(N'{"schema": "' + COALESCE(REPLACE(pk.TABLE_SCHEMA, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "table": "' + COALESCE(REPLACE(pk.TABLE_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "column": "' + COALESCE(REPLACE(pk.COLUMN_NAME, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                                    '", "pk_def": "PRIMARY KEY (' + pk.COLUMN_NAME COLLATE SQL_Latin1_General_CP1_CI_AS + ')"}')
                        )
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
                    FOR XML PATH('')
                ), 1, 1, ''), '')
            + N']'
        ) AS all_pks_json
),
cols AS (
    SELECT
        JSON_QUERY(
            '[' + ISNULL(
                STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY('{"schema": "' + COALESCE(REPLACE(cols.TABLE_SCHEMA, '"', ''), '') +
                                    '", "table": "' + COALESCE(REPLACE(cols.TABLE_NAME, '"', ''), '') +
                                    '", "name": "' + COALESCE(REPLACE(cols.COLUMN_NAME, '"', ''), '') +
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
                                        COALESCE(REPLACE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '"', '"'), '') +
                                    '", "collation": "' +
                                        COALESCE(cols.COLLATION_NAME, '') +
                                    '"}')
                        )
                    FROM
                        INFORMATION_SCHEMA.COLUMNS cols
                    WHERE
                        cols.TABLE_CATALOG = DB_NAME()
                    FOR XML PATH('')
                ), 1, 1, ''), '')
            + ']'
        ) AS all_columns_json
),
indexes AS (
    SELECT
        '[' + ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                    JSON_QUERY(
                        N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "table": "' + COALESCE(REPLACE(t.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "index_name": "' + COALESCE(REPLACE(i.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "column_name": "' + COALESCE(REPLACE(c.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "index_type": "' + LOWER(i.type_desc) COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "is_unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
                        ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'
                    )
                )
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
                FOR XML PATH('')
            ), 1, 1, ''), '')
        + N']' AS all_indexes_json
),
tbls AS (
    SELECT
        '[' + ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                    JSON_QUERY(
                        N'{"schema": "' + COALESCE(REPLACE(aggregated.schema_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "table": "' + COALESCE(REPLACE(aggregated.table_name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "row_count": "' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
                        '", "table_type": "' + aggregated.table_type COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + '"}'
                    )
                )
                FROM
                    (
                        SELECT
                            COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                            COALESCE(REPLACE(t.name, '"', ''), '') AS table_name,
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
                FOR XML PATH('')
            ), 1, 1, ''), '')
        + N']' AS all_tables_json
),
views AS (
    SELECT
        '[' + ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                    JSON_QUERY(
                        N'{"schema": "' + COALESCE(REPLACE(s.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS +
                        '", "view_name": "' + COALESCE(REPLACE(v.name, '"', ''), '') COLLATE SQL_Latin1_General_CP1_CI_AS + '"}'
                    )
                )
                FROM
                    sys.views v
                JOIN
                    sys.schemas s ON v.schema_id = s.schema_id
                WHERE
                    s.name LIKE '%'
                FOR XML PATH('')
            ), 1, 1, ''), '')
        + N']' AS all_views_json
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
) AS metadata_json_to_import;`;

export const getSqlServerQuery = (
    options: {
        databaseEdition?: DatabaseEdition;
    } = {}
): string => {
    if (options.databaseEdition === DatabaseEdition.SQL_SERVER_2016_AND_BELOW) {
        return sqlServer2016AndBelowQuery;
    }

    return sqlServerQuery;
};
