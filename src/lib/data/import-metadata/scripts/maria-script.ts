const withExtras = false;
const withDefault = `IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', 'ֿֿֿ\\"'), '')`;
const withoutDefault = `""`;

export const mariaDBQuery = `SELECT CAST(CONCAT(
    '{"fk_info": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(fk.table_schema as CHAR),
               '","table":"', fk.table_name,
               '","column":"', IFNULL(fk.fk_column, ''),
               '","foreign_key_name":"', IFNULL(fk.foreign_key_name, ''),
               '","reference_table":"', IFNULL(fk.reference_table, ''),
               '","reference_schema":"', IFNULL(fk.reference_schema, ''),
               '","reference_column":"', IFNULL(fk.reference_column, ''),
               '","fk_def":"', IFNULL(fk.fk_def, ''), '"}')
    ) FROM (
        SELECT kcu.table_schema,
               kcu.table_name,
               kcu.column_name AS fk_column,
               kcu.constraint_name AS foreign_key_name,
               kcu.referenced_table_schema as reference_schema,
               kcu.referenced_table_name AS reference_table,
               kcu.referenced_column_name AS reference_column,
               CONCAT('FOREIGN KEY (', kcu.column_name, ') REFERENCES ',
                      kcu.referenced_table_name, '(', kcu.referenced_column_name, ') ',
                      'ON UPDATE ', rc.update_rule,
                      ' ON DELETE ', rc.delete_rule) AS fk_def
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc
          ON kcu.constraint_name = rc.constraint_name
         AND kcu.table_schema = rc.constraint_schema
         AND kcu.table_name = rc.table_name
        WHERE kcu.referenced_table_name IS NOT NULL
          AND kcu.table_schema = DATABASE()
    ) AS fk), ''),
    '], "pk_info": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(pk.TABLE_SCHEMA as CHAR),
               '","table":"', pk.pk_table,
               '","column":"', pk.pk_column,
               '","pk_def":"', IFNULL(pk.pk_def, ''), '"}')
    ) FROM (
        SELECT TABLE_SCHEMA,
               TABLE_NAME AS pk_table,
               COLUMN_NAME AS pk_column,
               (SELECT CONCAT('PRIMARY KEY (', GROUP_CONCAT(inc.COLUMN_NAME ORDER BY inc.ORDINAL_POSITION SEPARATOR ', '), ')')
                               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as inc
                               WHERE inc.CONSTRAINT_NAME = 'PRIMARY' and
                                     outc.TABLE_SCHEMA = inc.TABLE_SCHEMA and
                                     outc.TABLE_NAME = inc.TABLE_NAME) AS pk_def
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as outc
        WHERE CONSTRAINT_NAME = 'PRIMARY'
              and table_schema LIKE IFNULL(NULL, '%')
              AND table_schema = DATABASE()
        GROUP BY TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
    ) AS pk), ''),
    '], "columns": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(cols.table_schema as CHAR),
               '","table":"', cols.table_name,
               '","name":"', REPLACE(cols.column_name, '"', '\\"'),
               '","type":"', LOWER(cols.data_type),
               '","character_maximum_length":"', IFNULL(cols.character_maximum_length, 'null'),
               '","precision":',
               IF(cols.data_type IN ('decimal', 'numeric'),
                  CONCAT('{"precision":', IFNULL(cols.numeric_precision, 'null'),
                         ',"scale":', IFNULL(cols.numeric_scale, 'null'), '}'), 'null'),
               ',"ordinal_position":', cols.ordinal_position,
               ',"nullable":', IF(cols.is_nullable = 'YES', 'true', 'false'),
               ',"default":"', ${withExtras ? withDefault : withoutDefault},
               '","collation":"', IFNULL(cols.collation_name, ''), '"}')
    ) FROM (
        SELECT cols.table_schema,
               cols.table_name,
               cols.column_name,
               LOWER(cols.data_type) AS data_type,
               cols.character_maximum_length,
               cols.numeric_precision,
               cols.numeric_scale,
               cols.ordinal_position,
               cols.is_nullable,
               cols.column_default,
               cols.collation_name
        FROM information_schema.columns cols
        WHERE cols.table_schema = DATABASE()
    ) AS cols), ''),
    '], "indexes": [',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(idx.table_schema as CHAR),
               '","table":"', idx.table_name,
               '","name":"', idx.index_name,
               '","size":', IFNULL(
                    (SELECT SUM(stat_value * @@innodb_page_size)
                     FROM mysql.innodb_index_stats
                     WHERE stat_name = 'size'
                       AND index_name != 'PRIMARY'
                       AND index_name = idx.index_name
                       AND TABLE_NAME = idx.table_name
                       AND database_name = idx.table_schema), -1),
               ',"column":"', idx.column_name,
               '","index_type":"', LOWER(idx.index_type),
               '","cardinality":', idx.cardinality,
               ',"direction":"', (CASE WHEN idx.collation = 'D' THEN 'desc' ELSE 'asc' END),
               '","column_position":', idx.seq_in_index,
               ',"unique":', IF(idx.non_unique = 1, 'false', 'true'), '}')
    ) FROM (
        SELECT indexes.table_schema,
               indexes.table_name,
               indexes.index_name,
               indexes.column_name,
               LOWER(indexes.index_type) AS index_type,
               indexes.cardinality,
               indexes.collation,
               indexes.non_unique,
               indexes.seq_in_index
        FROM information_schema.statistics indexes
        WHERE indexes.table_schema = DATABASE()
    ) AS idx), ''),
    '], "tables":[',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(tbls.TABLE_SCHEMA as CHAR),
               '","table":"', tbls.TABLE_NAME,
               '","rows":', IFNULL(tbls.TABLE_ROWS, 0),
               ',"type":"', IFNULL(tbls.TABLE_TYPE, ''),
               '","engine":"', IFNULL(tbls.ENGINE, ''),
               '","collation":"', IFNULL(tbls.TABLE_COLLATION, ''), '"}')
    ) FROM (
        SELECT \`TABLE_SCHEMA\`,
               \`TABLE_NAME\`,
               \`TABLE_ROWS\`,
               \`TABLE_TYPE\`,
               \`ENGINE\`,
               \`TABLE_COLLATION\`
        FROM information_schema.tables tbls
        WHERE tbls.table_schema = DATABASE()
    ) AS tbls), ''),
    '], "views":[',
    IFNULL((SELECT GROUP_CONCAT(
        CONCAT('{"schema":"', cast(vws.TABLE_SCHEMA as CHAR),
               '","view_name":"', vws.view_name,
               '","view_definition":"', view_definition, '"}')
    ) FROM (
        SELECT \`TABLE_SCHEMA\`,
               \`TABLE_NAME\` AS view_name,
               null AS view_definition
        FROM information_schema.views vws
        WHERE vws.table_schema = DATABASE()
    ) AS vws), ''),
    '], "database_name": "', DATABASE(),
    '", "version": "', VERSION(), '"}') AS CHAR) AS metadata_json_to_import
`;
