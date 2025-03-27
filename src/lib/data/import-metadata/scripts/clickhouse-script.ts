export const clickhouseQuery = `WITH
cols AS (
    SELECT arrayStringConcat(arrayMap(col_tuple ->
        concat('{"schema":"', col_tuple.1, '"',
               ',"table":"', col_tuple.2, '"',
               ',"name":"', col_tuple.3, '"',
               ',"ordinal_position":', toString(col_tuple.4),
               ',"type":"', col_tuple.5, '"',
               ',"nullable":"', if(col_tuple.6 = 'NULLABLE', 'true', 'false'), '"',
               ',"default":"', if(col_tuple.7 = '', 'null', col_tuple.7), '"',
               ',"comment":', if(col_tuple.8 = '', '""', toString(toJSONString(col_tuple.8))), '}'),
        groupArray((
            col.database,
            col.table,
            col.name,
            col.position,
            col.type,
            col.default_kind,
            col.default_expression,
            col.comment
        ))
    ), ',') AS cols_metadata
    FROM system.columns AS col
    JOIN system.tables AS tbl
        ON col.database = tbl.database AND col.table = tbl.name
    WHERE lower(col.database) NOT IN ('system', 'information_schema')
            AND lower(col.table) NOT LIKE '.inner_id.%'
            AND tbl.is_temporary = 0  -- Exclude temporary tables if desired
),
tbl_sizes AS (
    SELECT database, table, sum(bytes_on_disk) AS size
    FROM system.parts
    GROUP BY database, table
),
tbls AS (
    SELECT arrayStringConcat(arrayMap(tbl_tuple ->
        concat('{"schema":"', tbl_tuple.1, '"',
               ',"table":"', tbl_tuple.2, '"',
               ',"rows":', toString(tbl_tuple.3),
               ',"type":"', tbl_tuple.4, '"',
               ',"engine":"', tbl_tuple.5, '"',
               ',"collation":"",',
               '"size":', toString(tbl_tuple.6), ',',
               '"comment":', if(tbl_tuple.7 = '', '""', toString(toJSONString(tbl_tuple.7))), '}'),
        groupArray((
            tbl.database,          -- tbl_tuple.1
            tbl.name,              -- tbl_tuple.2
            tbl.total_rows, -- tbl_tuple.3
            tbl.type,              -- tbl_tuple.4
            tbl.engine,            -- tbl_tuple.5
            coalesce(ts.size, 0),  -- tbl_tuple.6
            tbl.comment            -- tbl_tuple.7
        ))
    ), ',') AS tbls_metadata
    FROM (
        SELECT
            tbl.database,
            tbl.name,
            coalesce(tbl.total_rows, 0) as total_rows,
            -- Determine the type based on the engine
            if(tbl.engine = 'View', 'VIEW',
                if(tbl.engine = 'MaterializedView', 'MATERIALIZED VIEW', 'TABLE')) AS type,
            tbl.engine,
            tbl.comment
        FROM system.tables AS tbl
        WHERE lower(tbl.database) NOT IN ('system', 'information_schema')
            AND lower(tbl.name) NOT LIKE '.inner_id.%'
            AND tbl.is_temporary = 0
    ) AS tbl
    LEFT JOIN tbl_sizes AS ts
        ON tbl.database = ts.database AND tbl.name = ts.table
    -- GROUP BY tbl.database, tbl.name, tbl.total_rows, tbl.type, tbl.engine, tbl.comment, ts.size
),
indexes AS (
    SELECT arrayStringConcat(arrayMap((db, tbl, name) ->
        concat('{"schema":"', db, '"',
               ',"table":"', tbl, '"',
               ',"name":"', name, '"',
               ',"index_type":"",',
               '"cardinality":"",',
               '"size":"",',
               '"unique":"false"}'),
        groupArray((idx.database, idx.table, idx.name))
    ), ',') AS indexes_metadata
    FROM system.data_skipping_indices AS idx
    WHERE lower(idx.database) NOT IN ('system', 'information_schema')
            AND lower(idx.table) NOT LIKE '.inner_id.%'
),
views AS (
    SELECT arrayStringConcat(arrayMap((db, name, definition) ->
        concat('{"schema":"', db, '"',
               ',"view_name":"', name, '"',
               ',"view_definition":"',
               base64Encode(replaceAll(replaceAll(definition, '\\\\', '\\\\\\\\'), '"', '\\\\"')), '"}'),
        groupArray((vw.database, vw.name, vw.create_table_query))
    ), ',') AS views_metadata
    FROM system.tables AS vw
    WHERE vw.engine in ('View', 'MaterializedView')
      AND lower(vw.database) NOT IN ('system', 'information_schema')
),
pks AS (
    SELECT
        col.database AS schema_name,
        col.table AS table_name,
        groupArray(col.name) AS pk_columns,
        concat('PRIMARY KEY(', arrayStringConcat(groupArray(col.name), ', '), ')') AS pk_def
    FROM system.columns AS col
    WHERE col.is_in_primary_key = 1
        AND lower(col.database) NOT IN ('system', 'information_schema')
        AND lower(col.table) NOT LIKE '.inner_id.%'
    GROUP BY col.database, col.table
),
pks_metadata AS (
    SELECT arrayStringConcat(arrayMap(pk_tuple ->
        concat('{"schema":"', pk_tuple.1, '"',
                ',"table":"', pk_tuple.2, '"',
                ',"column":"', pk_tuple.3, '"',
                ',"pk_def":"', pk_tuple.4, '"}'),
        groupArray((
            pks.schema_name,
            pks.table_name,
            arrayJoin(pks.pk_columns),
            pks.pk_def
        ))
    ), ',') AS pk_metadata
    FROM pks
)
SELECT
    concat('{
        "fk_info": [],',
        '"pk_info": [', COALESCE((SELECT pk_metadata FROM pks_metadata), ''), '],',
        '"columns": [', COALESCE((SELECT cols_metadata FROM cols), ''),
        '], "indexes": [', COALESCE((SELECT indexes_metadata FROM indexes), ''),
        '], "tables":[', COALESCE((SELECT tbls_metadata FROM tbls), ''),
        '], "views":[', COALESCE((SELECT views_metadata FROM views), ''),
        '], "database_name": "', currentDatabase(), '", "version": "', version(), '"}'
) AS metadata_json_to_import;`;
