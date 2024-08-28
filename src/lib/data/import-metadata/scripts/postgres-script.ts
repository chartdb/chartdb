export const postgresQuery = `WITH fk_info AS (
    select array_to_string(array_agg(CONCAT('{"schema":"', schema_name, '"',
                                            ',"table":"', replace(table_name::text, '"', ''), '"',
                                            ',"column":"', replace(fk_column::text, '"', ''), '"',
                                            ',"foreign_key_name":"', foreign_key_name, '"',
                                            ',"reference_table":"', reference_table, '"',
                                            ',"reference_column":"', reference_column, '"',
                                            ',"fk_def":"', fk_def,
                                            '"}')), ',') as fk_metadata
    from (
        SELECT  connamespace::regnamespace::text as schema_name,
                conname AS foreign_key_name,
                conrelid::regclass AS table_name,
                (regexp_matches(pg_get_constraintdef(oid), 'FOREIGN KEY \\((\\w+)\\) REFERENCES (\\w+)\\((\\w+)\\)', 'g'))[1] AS fk_column,
                (regexp_matches(pg_get_constraintdef(oid), 'FOREIGN KEY \\((\\w+)\\) REFERENCES (\\w+)\\((\\w+)\\)', 'g'))[2] AS reference_table,
                (regexp_matches(pg_get_constraintdef(oid), 'FOREIGN KEY \\((\\w+)\\) REFERENCES (\\w+)\\((\\w+)\\)', 'g'))[3] AS reference_column,
                pg_get_constraintdef(oid) as fk_def
              FROM
                pg_constraint
              WHERE
                contype = 'f'
                AND connamespace::regnamespace::text not in ('information_schema', 'pg_catalog')
    ) as x
), pk_info AS (
    SELECT array_to_string(array_agg(CONCAT('{"schema":"', schema_name, '"',
                                            ',"table":"', replace(pk_table, '"', ''), '"',
                                            ',"column":"', replace(pk_column, '"', ''), '"',
                                            ',"pk_def":"', replace(pk_def, '"', ''),
                                            '"}')), ',') as pk_metadata
    FROM (
            SELECT connamespace::regnamespace::text as schema_name,
                conrelid::regclass::text AS pk_table,
                unnest(string_to_array(substring(pg_get_constraintdef(oid) FROM '\\((.*?)\\)'), ',')) AS pk_column,
                pg_get_constraintdef(oid) as pk_def
            FROM
              pg_constraint
            WHERE
              contype = 'p'
              AND connamespace::regnamespace::text not in ('information_schema', 'pg_catalog')
    ) as y
),
indexes_cols as ( select tnsp.nspname                                                 as schema_name,
                  trel.relname                                                        as table_name,
                  pg_relation_size(tnsp.nspname || '.' || '"' || irel.relname || '"') as index_size,
                  irel.relname                                                        as index_name,
                  am.amname                                                           as index_type,
                  a.attname                                                           as col_name,
                  (case when i.indisunique = true then 'true' else 'false' end)       as is_unique,
                  irel.reltuples                                                      as cardinality,
                  1 + Array_position(i.indkey, a.attnum)                              as column_position,
                  case o.OPTION & 1 when 1 then 'DESC' else 'ASC' end                 as direction,
         CASE WHEN indpred IS NOT NULL THEN 'true' ELSE 'false' END as is_partial_index
                    from pg_index as i
                             join pg_class as trel on trel.oid = i.indrelid
                             join pg_namespace as tnsp on trel.relnamespace = tnsp.oid
                             join pg_class as irel on irel.oid = i.indexrelid
                             join pg_am as am on irel.relam = am.oid
                             cross join lateral unnest (i.indkey)
                    with ordinality as c (colnum, ordinality) left join lateral unnest (i.indoption)
                    with ordinality as o (option, ordinality)
                    on c.ordinality = o.ordinality join pg_attribute as a on trel.oid = a.attrelid and a.attnum = c.colnum
                    where tnsp.nspname not like 'pg_%'
                    group by tnsp.nspname, trel.relname, irel.relname, am.amname, i.indisunique, i.indexrelid, irel.reltuples, a.attname, array_position(i.indkey, a.attnum), o.OPTION, i.indpred
),
cols as (
    select array_to_string(array_agg(CONCAT('{"schema":"', cols.table_schema,
                                                '","table":"', cols.table_name,
                                                '","name":"', cols.column_name,
                                                '","ordinal_position":"', cols.ordinal_position,
                                                '","type":"', LOWER(replace(cols.data_type, '"', '')),
                                                '","character_maximum_length":"', COALESCE(cols.character_maximum_length::text, 'null'),
                                                '","precision":',
                                                    CASE
                                                        WHEN cols.data_type = 'numeric' OR cols.data_type = 'decimal'
                                                        THEN CONCAT('{"precision":', COALESCE(cols.numeric_precision::text, 'null'),
                                                                    ',"scale":', COALESCE(cols.numeric_scale::text, 'null'), '}')
                                                        ELSE 'null'
                                                    END,
                                                ',"nullable":', case when (cols.IS_NULLABLE = 'YES') then 'true' else 'false' end,
                                                ',"default":"', COALESCE(replace(replace(cols.column_default, '"', '\\"'), '\\x', '\\\\x'), ''),
                                                '","collation":"', coalesce(cols.COLLATION_NAME, ''), '"}')), ',') as cols_metadata
      from information_schema.columns cols
      where cols.table_schema not in ('information_schema', 'pg_catalog')
), indexes_metadata as (
    select array_to_string(array_agg(CONCAT('{"schema":"', schema_name,
                                            '","table":"', table_name,
                                            '","name":"', index_name,
                                            '","column":"', replace(col_name :: text, '"', E'"'),
                                            '","index_type":"', index_type,
                                            '","cardinality":', cardinality,
                                            ',"size":', index_size,
                                            ',"unique":', is_unique,
                                            ',"is_partial_index":', is_partial_index,
                                            ',"direction":"', lower(direction),
                                            '"}')), ',') as indexes_metadata
          from indexes_cols x
), tbls as (
    select array_to_string(array_agg(CONCAT('{', '"schema":"', TABLE_SCHEMA, '",', '"table":"', TABLE_NAME, '",', '"rows":',
                                      coalesce((select s.n_live_tup
                                                from pg_stat_user_tables s
                                                where tbls.TABLE_SCHEMA = s.schemaname and tbls.TABLE_NAME = s.relname),
                                               0), ', "type":"', TABLE_TYPE, '",', '"engine":"",', '"collation":""}')),
                     ',') as tbls_metadata
      from information_schema.tables tbls
      where tbls.TABLE_SCHEMA not in ('information_schema', 'pg_catalog')
), config as (
    select array_to_string(
                     array_agg(CONCAT('{"name":"', conf.name, '","value":"', replace(conf.setting, '"', E'"'), '"}')),
                     ',') as config_metadata
      from pg_settings conf
), views as
(
    select array_to_string(array_agg(CONCAT('{"schema":"', views.schemaname, '","view_name":"', viewname, '"}')),
                     ',') as views_metadata
      from pg_views views
    where views.schemaname not in ('information_schema', 'pg_catalog')
)
select CONCAT('{    "fk_info": [', coalesce(fk_metadata, ''),
                    '], "pk_info": [', COALESCE(pk_metadata, ''),
                    '], "columns": [', coalesce(cols_metadata, ''),
                    '], "indexes": [', coalesce(indexes_metadata, ''),
                    '], "tables":[', coalesce(tbls_metadata, ''),
                    '], "views":[', coalesce(views_metadata, ''),
                    '], "database_name": "', current_database(), '', '", "version": "', '',
              '"}') as " "
from fk_info, pk_info, cols, indexes_metadata, tbls, config, views;
`;
