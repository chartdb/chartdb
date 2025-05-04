import { DatabaseEdition } from '@/lib/domain/database-edition';

const sqlServerQuery = `${`/* SQL Server 2017 and above edition (14.0, 15.0, 16.0, 17.0)*/`}
WITH fk_info AS (
    SELECT
        JSON_QUERY(
            N'[' + STRING_AGG(
                CONVERT(nvarchar(max),
                    JSON_QUERY(N'{
                        "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(tp_schema.name, '"', ''), ''), 'json') +
                        '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(tp.name, '"', ''), ''), 'json') +
                        '", "column": "' + STRING_ESCAPE(COALESCE(REPLACE(cp.name, '"', ''), ''), 'json') +
                        '", "foreign_key_name": "' + STRING_ESCAPE(COALESCE(REPLACE(fk.name, '"', ''), ''), 'json') +
                        '", "reference_schema": "' + STRING_ESCAPE(COALESCE(REPLACE(tr_schema.name, '"', ''), ''), 'json') +
                        '", "reference_table": "' + STRING_ESCAPE(COALESCE(REPLACE(tr.name, '"', ''), ''), 'json') +
                        '", "reference_column": "' + STRING_ESCAPE(COALESCE(REPLACE(cr.name, '"', ''), ''), 'json') +
                        '", "fk_def": "FOREIGN KEY (' + STRING_ESCAPE(COALESCE(REPLACE(cp.name, '"', ''), ''), 'json') +
                        ') REFERENCES ' + STRING_ESCAPE(COALESCE(REPLACE(tr.name, '"', ''), ''), 'json') +
                        '(' + STRING_ESCAPE(COALESCE(REPLACE(cr.name, '"', ''), ''), 'json') +
                        ') ON DELETE ' + STRING_ESCAPE(fk.delete_referential_action_desc, 'json') +
                        ' ON UPDATE ' + STRING_ESCAPE(fk.update_referential_action_desc, 'json') +
                    '"}') COLLATE DATABASE_DEFAULT
                ), N','
            ) + N']'
        ) AS all_fks_json
    FROM sys.foreign_keys AS fk
    JOIN sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
    JOIN sys.tables AS tp ON fkc.parent_object_id = tp.object_id
    JOIN sys.schemas AS tp_schema ON tp.schema_id = tp_schema.schema_id
    JOIN sys.columns AS cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
    JOIN sys.tables AS tr ON fkc.referenced_object_id = tr.object_id
    JOIN sys.schemas AS tr_schema ON tr.schema_id = tr_schema.schema_id
    JOIN sys.columns AS cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
), pk_info AS (
    SELECT
        JSON_QUERY(
            N'[' +
                STRING_AGG(
                    CONVERT(nvarchar(max),
                        JSON_QUERY(N'{
                            "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(pk.TABLE_SCHEMA, '"', ''), ''), 'json') +
                            '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(pk.TABLE_NAME, '"', ''), ''), 'json') +
                            '", "column": "' + STRING_ESCAPE(COALESCE(REPLACE(pk.COLUMN_NAME, '"', ''), ''), 'json') +
                            '", "pk_def": "PRIMARY KEY (' + STRING_ESCAPE(pk.COLUMN_NAME, 'json') + N')"}') COLLATE DATABASE_DEFAULT
                        ), N','
                ) + N']'
        ) AS all_pks_json
    FROM (
        SELECT
            kcu.TABLE_SCHEMA,
            kcu.TABLE_NAME,
            kcu.COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
        JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
            AND kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
        WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    ) pk
),
cols AS (
    SELECT
        JSON_QUERY(N'[' +
            STRING_AGG(
                CONVERT(nvarchar(max),
                    JSON_QUERY(N'{
                        "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(cols.TABLE_SCHEMA, '"', ''), ''), 'json') +
                        '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(cols.TABLE_NAME, '"', ''), ''), 'json') +
                        '", "name": "' + STRING_ESCAPE(COALESCE(REPLACE(cols.COLUMN_NAME, '"', ''), ''), 'json') +
                        '", "ordinal_position": ' + CAST(cols.ORDINAL_POSITION AS NVARCHAR(MAX)) +
                        ', "type": "' + STRING_ESCAPE(LOWER(cols.DATA_TYPE), 'json') +
                        '", "character_maximum_length": "' +
                            CASE
                                WHEN cols.CHARACTER_MAXIMUM_LENGTH IS NULL THEN 'null'
                                ELSE CAST(cols.CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(MAX))
                            END +
                        '", "precision": ' +
                            CASE
                                WHEN cols.DATA_TYPE IN ('numeric', 'decimal')
                                THEN '{"precision":' + COALESCE(CAST(cols.NUMERIC_PRECISION AS NVARCHAR(MAX)), 'null') +
                                     ',"scale":' + COALESCE(CAST(cols.NUMERIC_SCALE AS NVARCHAR(MAX)), 'null') + '}'
                                ELSE 'null'
                            END +
                        ', "nullable": ' + CASE WHEN cols.IS_NULLABLE = 'YES' THEN 'true' ELSE 'false' END +
                        ', "default": ' +
                            '"' + STRING_ESCAPE(COALESCE(REPLACE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '"', '\\"'), ''), 'json') + '"' +
                        ', "collation": ' + CASE
                            WHEN cols.COLLATION_NAME IS NULL THEN 'null'
                            ELSE '"' + STRING_ESCAPE(cols.COLLATION_NAME, 'json') + '"'
                        END +
                    N'}') COLLATE DATABASE_DEFAULT
                ), N','
            ) +
        N']') AS all_columns_json
    FROM INFORMATION_SCHEMA.COLUMNS cols
    WHERE cols.TABLE_CATALOG = DB_NAME()
),
indexes AS (
    SELECT
        N'[' +
            STRING_AGG(
                CONVERT(nvarchar(max),
                    JSON_QUERY(N'{
                        "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(s.name, '"', ''), ''), 'json') +
                        '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(t.name, '"', ''), ''), 'json') +
                        '", "name": "' + STRING_ESCAPE(COALESCE(REPLACE(i.name, '"', ''), ''), 'json') +
                        '", "column": "' + STRING_ESCAPE(COALESCE(REPLACE(c.name, '"', ''), ''), 'json') +
                        '", "index_type": "' + STRING_ESCAPE(LOWER(i.type_desc), 'json') +
                        '", "unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
                        ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END +
                        '", "column_position": ' + CAST(ic.key_ordinal AS nvarchar(max)) + N'}'
                    ) COLLATE DATABASE_DEFAULT
                ), N','
            ) +
        N']' AS all_indexes_json
    FROM sys.indexes i
    JOIN sys.tables t ON i.object_id = t.object_id
    JOIN sys.schemas s ON t.schema_id = s.schema_id
    JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE s.name LIKE '%' AND i.name IS NOT NULL AND ic.is_included_column = 0
),
tbls AS (
    SELECT
        N'[' + STRING_AGG(
                CONVERT(nvarchar(max),
                        JSON_QUERY(N'{
                            "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(aggregated.schema_name, '"', ''), ''), 'json') +
                            '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(aggregated.table_name, '"', ''), ''), 'json') +
                            '", "row_count": ' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
                            ', "table_type": "' + STRING_ESCAPE(aggregated.table_type, 'json') +
                            '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + N'"}'
                        ) COLLATE DATABASE_DEFAULT
                    ), N','
                ) +
        N']' AS all_tables_json
    FROM (
        SELECT
            COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
            COALESCE(REPLACE(t.name, '"', ''), '') AS table_name,
            SUM(p.rows) AS row_count,
            t.type_desc AS table_type,
            t.create_date AS creation_date
        FROM sys.tables t
        JOIN sys.schemas s ON t.schema_id = s.schema_id
        JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
        WHERE s.name LIKE '%'
        GROUP BY s.name, t.name, t.type_desc, t.create_date

        UNION ALL

        SELECT
            COALESCE(REPLACE(s.name, '"', ''), '') AS table_name,
            COALESCE(REPLACE(v.name, '"', ''), '') AS object_name,
            0 AS row_count,
            'VIEW' AS table_type,
            v.create_date AS creation_date
        FROM sys.views v
        JOIN sys.schemas s ON v.schema_id = s.schema_id
        WHERE s.name LIKE '%'
    ) AS aggregated
),
views AS (
    SELECT
        '[' + STRING_AGG(
                CONVERT(nvarchar(max),
                JSON_QUERY(N'{
                    "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(s.name, '"', ''), ''), 'json') +
                    '", "view_name": "' + STRING_ESCAPE(COALESCE(REPLACE(v.name, '"', ''), ''), 'json') +
                    '", "view_definition": "' +
                    STRING_ESCAPE(
                        CAST(
                            '' AS XML
                        ).value(
                            'xs:base64Binary(sql:column("DefinitionBinary"))',
                            'VARCHAR(MAX)'
                        ), 'json') +
                    N'"}') COLLATE DATABASE_DEFAULT
                ), N','
        ) + N']' AS all_views_json
    FROM sys.views v
    JOIN sys.schemas s ON v.schema_id = s.schema_id
    JOIN sys.sql_modules m ON v.object_id = m.object_id
    CROSS APPLY
        (SELECT CONVERT(VARBINARY(MAX), m.definition) AS DefinitionBinary) AS bin
    WHERE s.name LIKE '%'
)
SELECT JSON_QUERY(
    N'{
        "fk_info": ' + ISNULL((SELECT cast(all_fks_json as nvarchar(max)) FROM fk_info), N'[]') +
        ', "pk_info": ' + ISNULL((SELECT cast(all_pks_json as nvarchar(max)) FROM pk_info), N'[]') +
        ', "columns": ' + ISNULL((SELECT cast(all_columns_json as nvarchar(max)) FROM cols), N'[]') +
        ', "indexes": ' + ISNULL((SELECT cast(all_indexes_json as nvarchar(max)) FROM indexes), N'[]') +
        ', "tables": ' + ISNULL((SELECT cast(all_tables_json as nvarchar(max)) FROM tbls), N'[]') +
        ', "views": ' + ISNULL((SELECT cast(all_views_json as nvarchar(max)) FROM views), N'[]') +
        ', "database_name": "' + STRING_ESCAPE(DB_NAME(), 'json') +
        '", "version": ""
    }'
) AS metadata_json_to_import;
`;

const sqlServer2016AndBelowQuery = `${`/* SQL Server 2016 and below edition (13.0, 12.0, 11.0..) */`}
WITH fk_info AS (
    SELECT  JSON_QUERY('[' +
        ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                        JSON_QUERY(N'{
                            "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(tp_schema.name, '"', ''), ''), 'json') +
                            '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(tp.name, '"', ''), ''), 'json') +
                            '", "column": "' + STRING_ESCAPE(COALESCE(REPLACE(cp.name, '"', ''), ''), 'json') +
                            '", "foreign_key_name": "' + STRING_ESCAPE(COALESCE(REPLACE(fk.name, '"', ''), ''), 'json') +
                            '", "reference_schema": "' + STRING_ESCAPE(COALESCE(REPLACE(tr_schema.name, '"', ''), ''), 'json') +
                            '", "reference_table": "' + STRING_ESCAPE(COALESCE(REPLACE(tr.name, '"', ''), ''), 'json') +
                            '", "reference_column": "' + STRING_ESCAPE(COALESCE(REPLACE(cr.name, '"', ''), ''), 'json') +
                            '", "fk_def": "FOREIGN KEY (' + STRING_ESCAPE(COALESCE(REPLACE(cp.name, '"', ''), ''), 'json') +
                            ') REFERENCES ' + STRING_ESCAPE(COALESCE(REPLACE(tr.name, '"', ''), ''), 'json') +
                            '(' + STRING_ESCAPE(COALESCE(REPLACE(cr.name, '"', ''), ''), 'json') +
                            ') ON DELETE ' + STRING_ESCAPE(fk.delete_referential_action_desc, 'json') +
                            ' ON UPDATE ' + STRING_ESCAPE(fk.update_referential_action_desc, 'json') +
                        '"}') COLLATE DATABASE_DEFAULT
                    )
                FROM sys.foreign_keys AS fk
                JOIN sys.foreign_key_columns AS fkc ON fk.object_id = fkc.constraint_object_id
                JOIN sys.tables AS tp ON fkc.parent_object_id = tp.object_id
                JOIN sys.schemas AS tp_schema ON tp.schema_id = tp_schema.schema_id
                JOIN sys.columns AS cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
                JOIN sys.tables AS tr ON fkc.referenced_object_id = tr.object_id
                JOIN sys.schemas AS tr_schema ON tr.schema_id = tr_schema.schema_id
                JOIN sys.columns AS cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
                FOR XML PATH('')
            ), 1, 1, ''), '')
    + N']') AS all_fks_json
),
pk_info AS (
    SELECT  JSON_QUERY('[' +
                ISNULL(STUFF((
                    SELECT ',' +
                        CONVERT(nvarchar(max),
                        JSON_QUERY(N'{
                            "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(pk.TABLE_SCHEMA, '"', ''), ''), 'json') +
                            '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(pk.TABLE_NAME, '"', ''), ''), 'json') +
                            '", "column": "' + STRING_ESCAPE(COALESCE(REPLACE(pk.COLUMN_NAME, '"', ''), ''), 'json') +
                            '", "pk_def": "PRIMARY KEY (' + STRING_ESCAPE(pk.COLUMN_NAME, 'json') + N')"}') COLLATE DATABASE_DEFAULT
                        )
                    FROM
                        (
                            SELECT  kcu.TABLE_SCHEMA,
                                    kcu.TABLE_NAME,
                                    kcu.COLUMN_NAME
                            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                            JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                                ON kcu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
                                AND kcu.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA
                            WHERE   tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                        ) pk
                    FOR XML PATH('')
                ), 1, 1, ''), '')
    + N']') AS all_pks_json
),
cols AS (
    SELECT  JSON_QUERY('[' +
        ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                    JSON_QUERY('{
                                "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(cols.TABLE_SCHEMA, '"', ''), ''), 'json') +
                                '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(cols.TABLE_NAME, '"', ''), ''), 'json') +
                                '", "name": "' + STRING_ESCAPE(COALESCE(REPLACE(cols.COLUMN_NAME, '"', ''), ''), 'json') +
                                '", "ordinal_position": ' + CAST(cols.ORDINAL_POSITION AS NVARCHAR(MAX)) +
                                ', "type": "' + STRING_ESCAPE(LOWER(cols.DATA_TYPE), 'json') +
                                '", "character_maximum_length": "' +
                                    CASE
                                        WHEN cols.CHARACTER_MAXIMUM_LENGTH IS NULL THEN 'null'
                                        ELSE CAST(cols.CHARACTER_MAXIMUM_LENGTH AS NVARCHAR(MAX))
                                    END +
                                '", "precision": ' +
                                    CASE
                                        WHEN cols.DATA_TYPE IN ('numeric', 'decimal')
                                        THEN '{"precision":' + COALESCE(CAST(cols.NUMERIC_PRECISION AS NVARCHAR(MAX)), 'null') +
                                             ',"scale":' + COALESCE(CAST(cols.NUMERIC_SCALE AS NVARCHAR(MAX)), 'null') + '}'
                                        ELSE 'null'
                                    END +
                                ', "nullable": ' + CASE WHEN cols.IS_NULLABLE = 'YES' THEN 'true' ELSE 'false' END +
                                ', "default": ' +
                                    '"' + STRING_ESCAPE(COALESCE(REPLACE(CAST(cols.COLUMN_DEFAULT AS NVARCHAR(MAX)), '"', '\\"'), ''), 'json') + '"' +
                                ', "collation": ' +
                                    CASE
                                        WHEN cols.COLLATION_NAME IS NULL THEN 'null'
                                        ELSE '"' + STRING_ESCAPE(cols.COLLATION_NAME, 'json') + '"'
                                    END +
                                N'}')
                    )
                FROM
                    INFORMATION_SCHEMA.COLUMNS cols
                WHERE
                    cols.TABLE_CATALOG = DB_NAME()
                FOR XML PATH('')
            ), 1, 1, ''), '')
    + ']') AS all_columns_json
),
indexes AS (
    SELECT
        '[' + ISNULL(
            STUFF((
                SELECT ',' +
                    CONVERT(nvarchar(max),
                    JSON_QUERY(N'{
                        "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(s.name, '"', ''), ''), 'json') +
                        '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(t.name, '"', ''), ''), 'json') +
                        '", "name": "' + STRING_ESCAPE(COALESCE(REPLACE(i.name, '"', ''), ''), 'json') +
                        '", "column": "' + STRING_ESCAPE(COALESCE(REPLACE(c.name, '"', ''), ''), 'json') +
                        '", "index_type": "' + STRING_ESCAPE(LOWER(i.type_desc), 'json') +
                        '", "unique": ' + CASE WHEN i.is_unique = 1 THEN 'true' ELSE 'false' END +
                        ', "direction": "' + CASE WHEN ic.is_descending_key = 1 THEN 'desc' ELSE 'asc' END +
                        '", "column_position": ' + CAST(ic.key_ordinal AS nvarchar(max)) + N'}'
                    ) COLLATE DATABASE_DEFAULT
                )
                FROM sys.indexes i
                JOIN sys.tables t ON i.object_id = t.object_id
                JOIN sys.schemas s ON t.schema_id = s.schema_id
                JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
                WHERE s.name LIKE '%'
                        AND i.name IS NOT NULL
                        AND ic.is_included_column = 0
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
                JSON_QUERY(N'{
                    "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(aggregated.schema_name, '"', ''), ''), 'json') +
                    '", "table": "' + STRING_ESCAPE(COALESCE(REPLACE(aggregated.table_name, '"', ''), ''), 'json') +
                    '", "row_count": ' + CAST(aggregated.row_count AS NVARCHAR(MAX)) +
                    ', "table_type": "' + STRING_ESCAPE(aggregated.table_type, 'json') +
                    '", "creation_date": "' + CONVERT(NVARCHAR(MAX), aggregated.creation_date, 120) + N'"}'
                )
            )
            FROM
                (
                    -- Select from tables
                    SELECT
                        COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                        COALESCE(REPLACE(t.name, '"', ''), '') AS table_name,
                        SUM(p.rows) AS row_count,
                        t.type_desc AS table_type,
                        t.create_date AS creation_date
                    FROM sys.tables t
                    JOIN sys.schemas s ON t.schema_id = s.schema_id
                    JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
                    WHERE s.name LIKE '%'
                    GROUP BY s.name, t.name, t.type_desc, t.create_date

                    UNION ALL

                    -- Select from views
                    SELECT
                        COALESCE(REPLACE(s.name, '"', ''), '') AS schema_name,
                        COALESCE(REPLACE(v.name, '"', ''), '') AS object_name,
                        0 AS row_count,  -- Views don't have row counts
                        'VIEW' AS object_type,
                        v.create_date AS creation_date
                    FROM sys.views v
                    JOIN sys.schemas s ON v.schema_id = s.schema_id
                    WHERE s.name LIKE '%'
                ) AS aggregated
            FOR XML PATH('')
        ), 1, 1, ''), '')
    + N']' AS all_objects_json
),
views AS (
    SELECT
        '[' +
        (
            SELECT  STUFF((
                        SELECT ',' + CONVERT(nvarchar(max),
                            JSON_QUERY(
                                N'{
                                "schema": "' + STRING_ESCAPE(COALESCE(REPLACE(s.name, '"', ''), ''), 'json') +
                                '", "view_name": "' + STRING_ESCAPE(COALESCE(REPLACE(v.name, '"', ''), ''), 'json') +
                                '", "view_definition": "' +
                                CAST(
                                    (
                                        SELECT CAST(OBJECT_DEFINITION(v.object_id) AS VARBINARY(MAX)) FOR XML PATH('')
                                    ) AS NVARCHAR(MAX)
                                ) + N'"}'
                            )
                        )
                        FROM
                            sys.views v
                        JOIN
                            sys.schemas s ON v.schema_id = s.schema_id
                        WHERE
                            s.name LIKE '%'
                        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, '')
        ) + ']' AS all_views_json
)
SELECT JSON_QUERY(
    N'{
        "fk_info": ' + ISNULL((SELECT cast(all_fks_json as nvarchar(max)) FROM fk_info), N'[]') +
        ', "pk_info": ' + ISNULL((SELECT cast(all_pks_json as nvarchar(max)) FROM pk_info), N'[]') +
        ', "columns": ' + ISNULL((SELECT cast(all_columns_json as nvarchar(max)) FROM cols), N'[]') +
        ', "indexes": ' + ISNULL((SELECT cast(all_indexes_json as nvarchar(max)) FROM indexes), N'[]') +
        ', "tables": ' + ISNULL((SELECT cast(all_objects_json as nvarchar(max)) FROM tbls), N'[]') +
        ', "views": ' + ISNULL((SELECT cast(all_views_json as nvarchar(max)) FROM views), N'[]') +
        ', "database_name": "' + DB_NAME() + '"' +
        ', "version": ""
    }'
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
