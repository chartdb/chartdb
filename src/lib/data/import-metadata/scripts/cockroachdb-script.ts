const cockroachdbFilters = `
AND connamespace::regnamespace::text NOT IN ('pg_extension', 'crdb_internal')
`;

const cockroachdbColFilter = `
AND cols.table_schema NOT IN ('pg_extension', 'crdb_internal')
`;

const cockroachdbTableFilter = `
AND tbls.table_schema NOT IN ('pg_extension', 'crdb_internal')
`;

const cockroachdbIndexesFilter = `
WHERE schema_name NOT IN ('pg_extension', 'crdb_internal')
`;

const cockroachdbViewsFilter = `
AND views.schemaname NOT IN ('pg_extension', 'crdb_internal')
`;

export const cockroachdbQuery = `${`/* CockroachDB - PostgreSQL edition */`}
WITH fk_info AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', replace(schema_name::TEXT, '"', ''), '"',
                                            ',"table":"', replace(table_name::TEXT, '"', ''), '"',
                                            ',"column":"', replace(fk_column::TEXT, '"', ''), '"',
                                            ',"foreign_key_name":"', foreign_key_name::TEXT, '"',
                                            ',"reference_schema":"', COALESCE(replace(reference_schema::TEXT, '"', ''), 'public'), '"',
                                            ',"reference_table":"', replace(reference_table::TEXT, '"', ''), '"',
                                            ',"reference_column":"', replace(reference_column::TEXT, '"', ''), '"',
                                            ',"fk_def":"', replace(fk_def::TEXT, '"', ''),
                                            '"}')), ',') as fk_metadata
    FROM (
            SELECT c.conname AS foreign_key_name,
                    n.nspname AS schema_name,
                    CASE
                        WHEN position('.' in conrelid::regclass::text) > 0
                        THEN split_part(conrelid::regclass::text, '.', 2)
                        ELSE conrelid::regclass::text
                    END AS table_name,
                    a.attname AS fk_column,
                    nr.nspname AS reference_schema,
                    CASE
                        WHEN position('.' in confrelid::regclass::text) > 0
                        THEN split_part(confrelid::regclass::text, '.', 2)
                        ELSE confrelid::regclass::text
                    END AS reference_table,
                    af.attname AS reference_column,
                    pg_get_constraintdef(c.oid) as fk_def
                FROM
                    pg_constraint AS c
                JOIN
                    pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
                JOIN
                    pg_class AS cl ON cl.oid = c.conrelid
                JOIN
                    pg_namespace AS n ON n.oid = cl.relnamespace
                JOIN
                    pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
                JOIN
                    pg_class AS clf ON clf.oid = c.confrelid
                JOIN
                    pg_namespace AS nr ON nr.oid = clf.relnamespace
                WHERE
                    c.contype = 'f'
                    AND connamespace::regnamespace::text NOT IN ('information_schema', 'pg_catalog')${cockroachdbFilters}
    ) AS x
), pk_info AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', replace(schema_name::TEXT, '"', ''), '"',
                                            ',"table":"', replace(pk_table::TEXT, '"', ''), '"',
                                            ',"column":"', replace(pk_column::TEXT, '"', ''), '"',
                                            ',"pk_def":"', replace(pk_def::TEXT, '"', ''),
                                            '"}')), ',') AS pk_metadata
    FROM (
            SELECT connamespace::regnamespace::text AS schema_name,
                CASE
                    WHEN strpos(conrelid::regclass::text, '.') > 0
                    THEN split_part(conrelid::regclass::text, '.', 2)
                    ELSE conrelid::regclass::text
                END AS pk_table,
                unnest(string_to_array(substring(pg_get_constraintdef(oid) FROM '\\((.*?)\\)'), ',')) AS pk_column,
                pg_get_constraintdef(oid) as pk_def
            FROM
              pg_constraint
            WHERE
              contype = 'p'
              AND connamespace::regnamespace::text NOT IN ('information_schema', 'pg_catalog')${cockroachdbFilters}
    ) AS y
),
indexes_cols AS (
    SELECT  tnsp.nspname                                                                AS schema_name,
        trel.relname                                                                    AS table_name,
            null                                                                        AS index_size,
            irel.relname                                                                AS index_name,
            am.amname                                                                   AS index_type,
            a.attname                                                                   AS col_name,
            (CASE WHEN i.indisunique = TRUE THEN 'true' ELSE 'false' END)               AS is_unique,
            irel.reltuples                                                              AS cardinality,
            1 + Array_position(i.indkey, a.attnum)                                      AS column_position,
            CASE o.OPTION & 1 WHEN 1 THEN 'DESC' ELSE 'ASC' END                         AS direction
    FROM pg_index AS i
        JOIN pg_class AS trel ON trel.oid = i.indrelid
        JOIN pg_namespace AS tnsp ON trel.relnamespace = tnsp.oid
        JOIN pg_class AS irel ON irel.oid = i.indexrelid
        JOIN pg_am AS am ON irel.relam = am.oid
        CROSS JOIN LATERAL unnest (i.indkey)
        WITH ORDINALITY AS c (colnum, ordinality) LEFT JOIN LATERAL unnest (i.indoption)
        WITH ORDINALITY AS o (option, ordinality)
        ON c.ordinality = o.ordinality JOIN pg_attribute AS a ON trel.oid = a.attrelid AND a.attnum = c.colnum
    WHERE tnsp.nspname NOT LIKE 'pg_%'
    GROUP BY tnsp.nspname, trel.relname, irel.relname, am.amname, i.indisunique, i.indexrelid, irel.reltuples, a.attname, Array_position(i.indkey, a.attnum), o.OPTION, i.indpred
),
cols AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', cols.table_schema::TEXT,
                                            '","table":"', cols.table_name::TEXT,
                                            '","name":"', cols.column_name::TEXT,
                                            '","ordinal_position":', cols.ordinal_position::TEXT,
                                            ',"type":"', LOWER(replace(cols.data_type::TEXT, '"', '')),
                                            '","character_maximum_length":"', COALESCE(cols.character_maximum_length::TEXT, 'null'),
                                            '","precision":',
                                                CASE
                                                    WHEN cols.data_type = 'numeric' OR cols.data_type = 'decimal'
                                                    THEN CONCAT('{"precision":', COALESCE(cols.numeric_precision::TEXT, 'null'),
                                                                ',"scale":', COALESCE(cols.numeric_scale::TEXT, 'null'), '}')
                                                    ELSE 'null'
                                                END,
                                            ',"nullable":', CASE WHEN (cols.IS_NULLABLE = 'YES') THEN true ELSE false END::TEXT,
                                            ',"default":"', COALESCE(replace(replace(cols.column_default::TEXT, '"', '\\"'), '\\x', '\\\\x'), ''),
                                            '","collation":"', COALESCE(cols.COLLATION_NAME::TEXT, ''),
                                            '","comment":"', COALESCE(replace(replace(dsc.description::TEXT, '"', '\\"'), '\\x', '\\\\x'), ''),
                                            '","is_identity":', CASE 
                                                WHEN cols.is_identity = 'YES' THEN 'true'
                                                WHEN cols.column_default IS NOT NULL AND cols.column_default LIKE 'nextval(%' THEN 'true'
                                                WHEN cols.column_default LIKE 'unique_rowid()%' THEN 'true'
                                                ELSE 'false'
                                            END,
                                            '}')), ',') AS cols_metadata
    FROM information_schema.columns cols
    LEFT JOIN pg_catalog.pg_class c
        ON c.relname = cols.table_name
    JOIN pg_catalog.pg_namespace n
        ON n.oid = c.relnamespace AND n.nspname = cols.table_schema
    LEFT JOIN pg_catalog.pg_description dsc ON dsc.objoid = c.oid
                                        AND dsc.objsubid = cols.ordinal_position
    WHERE cols.table_schema NOT IN ('information_schema', 'pg_catalog')${cockroachdbColFilter}
), indexes_metadata AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', schema_name::TEXT,
                                            '","table":"', table_name::TEXT,
                                            '","name":"', index_name::TEXT,
                                            '","column":"', replace(col_name::TEXT, '"', E'"'),
                                            '","index_type":"', index_type::TEXT,
                                            '","cardinality":', COALESCE(cardinality::TEXT, '0'),
                                            ',"size":', COALESCE(index_size::TEXT, 'null'),
                                            ',"unique":', is_unique::TEXT,
                                            ',"column_position":', column_position::TEXT,
                                            ',"direction":"', LOWER(direction::TEXT),
                                            '"}')), ',') AS indexes_metadata
    FROM indexes_cols x${cockroachdbIndexesFilter}
), tbls AS (
    SELECT array_to_string(array_agg(CONCAT('{',
                        '"schema":"', tbls.TABLE_SCHEMA::TEXT, '",',
                        '"table":"', tbls.TABLE_NAME::TEXT, '",',
                        '"rows":', COALESCE((SELECT s.n_live_tup::TEXT
                                                FROM pg_stat_user_tables s
                                                WHERE tbls.TABLE_SCHEMA = s.schemaname AND tbls.TABLE_NAME = s.relname),
                                                '0'), ', "type":"', tbls.TABLE_TYPE::TEXT, '",', '"engine":"",', '"collation":"",',
                        '"comment":"', COALESCE(replace(replace(dsc.description::TEXT, '"', '\\"'), '\\x', '\\\\x'), ''),
                        '"}'
                )),
                ',') AS tbls_metadata
        FROM information_schema.tables tbls
        LEFT JOIN pg_catalog.pg_class c ON c.relname = tbls.TABLE_NAME
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                                            AND n.nspname = tbls.TABLE_SCHEMA
        LEFT JOIN pg_catalog.pg_description dsc ON dsc.objoid = c.oid
                                                AND dsc.objsubid = 0
        WHERE tbls.TABLE_SCHEMA NOT IN ('information_schema', 'pg_catalog')${cockroachdbTableFilter}
), config AS (
    SELECT array_to_string(
                      array_agg(CONCAT('{"name":"', conf.name, '","value":"', replace(conf.setting, '"', E'"'), '"}')),
                      ',') AS config_metadata
    FROM pg_settings conf
), views AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', views.schemaname::TEXT,
                      '","view_name":"', viewname::TEXT,
                      '","view_definition":""}')),
                      ',') AS views_metadata
    FROM pg_views views
    WHERE views.schemaname NOT IN ('information_schema', 'pg_catalog')${cockroachdbViewsFilter}
)
SELECT CONCAT('{    "fk_info": [', COALESCE(fk_metadata, ''),
                    '], "pk_info": [', COALESCE(pk_metadata, ''),
                    '], "columns": [', COALESCE(cols_metadata, ''),
                    '], "indexes": [', COALESCE(indexes_metadata, ''),
                    '], "tables":[', COALESCE(tbls_metadata, ''),
                    '], "views":[', COALESCE(views_metadata, ''),
                    '], "database_name": "', CURRENT_DATABASE(), '', '", "version": "', '',
              '"}') AS metadata_json_to_import
FROM fk_info, pk_info, cols, indexes_metadata, tbls, config, views;
`;
