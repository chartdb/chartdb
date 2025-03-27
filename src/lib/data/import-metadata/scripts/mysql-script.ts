import { DatabaseEdition } from '@/lib/domain/database-edition';

export const getMySQLQuery = (
    options: {
        databaseEdition?: DatabaseEdition;
    } = {}
): string => {
    const databaseEdition: DatabaseEdition | undefined =
        options.databaseEdition;

    const newMySQLQuery = `WITH fk_info as (
(SELECT (@fk_info:=NULL),
    (SELECT (0)
    FROM (SELECT kcu.table_schema,
        kcu.table_name,
        kcu.column_name as fk_column,
        kcu.constraint_name as foreign_key_name,
        kcu.referenced_table_schema as reference_schema,
        kcu.referenced_table_name as reference_table,
        kcu.referenced_column_name as reference_column,
        CONCAT('FOREIGN KEY (', kcu.column_name, ') REFERENCES ',
            kcu.referenced_table_name, '(', kcu.referenced_column_name, ') ',
            'ON UPDATE ', rc.update_rule,
            ' ON DELETE ', rc.delete_rule) AS fk_def
    FROM
        information_schema.key_column_usage kcu
    JOIN
        information_schema.referential_constraints rc
        ON kcu.constraint_name = rc.constraint_name
            AND kcu.table_schema = rc.constraint_schema
        AND kcu.table_name = rc.table_name
    WHERE
        kcu.referenced_table_name IS NOT NULL) as fk
    WHERE table_schema LIKE IFNULL(NULL, '%')
        AND table_schema = DATABASE()
        AND (0x00) IN (@fk_info:=CONCAT_WS(',', @fk_info, CONCAT('{"schema":"',table_schema,
                                    '","table":"',table_name,
                                    '","column":"', IFNULL(fk_column, ''),
                                                '","foreign_key_name":"', IFNULL(foreign_key_name, ''),
                                                '","reference_schema":"', IFNULL(reference_schema, ''),
                                                '","reference_table":"', IFNULL(reference_table, ''),
                                                '","reference_column":"', IFNULL(reference_column, ''),
                                                '","fk_def":"', IFNULL(fk_def, ''),
                                    '"}')))))
), pk_info AS (
    (SELECT (@pk_info:=NULL),
              (SELECT (0)
               FROM (SELECT TABLE_SCHEMA,
                            TABLE_NAME AS pk_table,
                            COLUMN_NAME AS pk_column,
                            (SELECT CONCAT('PRIMARY KEY (', GROUP_CONCAT(inc.COLUMN_NAME ORDER BY inc.ORDINAL_POSITION SEPARATOR ', '), ')')
                               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as inc
                               WHERE inc.CONSTRAINT_NAME = 'PRIMARY' and
                                     outc.TABLE_SCHEMA = inc.TABLE_SCHEMA and
                             		 outc.TABLE_NAME = inc.TABLE_NAME) AS pk_def
                       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE as outc
                       WHERE CONSTRAINT_NAME = 'PRIMARY'
                       GROUP BY TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME
                       ORDER BY TABLE_SCHEMA, TABLE_NAME, MIN(ORDINAL_POSITION)) AS pk
               WHERE table_schema LIKE IFNULL(NULL, '%')
               AND table_schema = DATABASE()
               AND (0x00) IN (@pk_info:=CONCAT_WS(',', @pk_info, CONCAT('{"schema":"', table_schema,
                                                                        '","table":"', pk_table,
                                                                        '","column":"', pk_column,
                                                                        '","pk_def":"', IFNULL(pk_def, ''),
                                                                        '"}')))))
), cols as
(
  (SELECT (@cols := NULL),
        (SELECT (0)
         FROM information_schema.columns cols
         WHERE cols.table_schema LIKE IFNULL(NULL, '%')
           AND cols.table_schema = DATABASE()
           AND (0x00) IN (@cols := CONCAT_WS(',', @cols, CONCAT(
                '{"schema":"', cols.table_schema,
                '","table":"', cols.table_name,
                '","name":"', REPLACE(cols.column_name, '"', '\\"'),
                '","type":"', LOWER(cols.data_type),
                '","character_maximum_length":"', IFNULL(cols.character_maximum_length, 'null'),
                '","precision":',
                    CASE
                        WHEN cols.data_type IN ('decimal', 'numeric')
                        THEN CONCAT('{"precision":', IFNULL(cols.numeric_precision, 'null'),
                                    ',"scale":', IFNULL(cols.numeric_scale, 'null'), '}')
                        ELSE 'null'
                    END,
                ',"ordinal_position":', cols.ordinal_position,
                ',"nullable":', IF(cols.is_nullable = 'YES', 'true', 'false'),
                ',"default":"', IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', 'ֿֿֿ\\"'), ''),
                '","collation":"', IFNULL(cols.collation_name, ''), '"}'
            )))))
), indexes as (
  (SELECT (@indexes:=NULL),
                (SELECT (0)
                 FROM information_schema.statistics indexes
                 WHERE table_schema LIKE IFNULL(NULL, '%')
                     AND table_schema = DATABASE()
                     AND (0x00) IN  (@indexes:=CONCAT_WS(',', @indexes, CONCAT('{"schema":"',indexes.table_schema,
                                         '","table":"',indexes.table_name,
                                         '","name":"', indexes.index_name,
                                         '","size":',
                                                                      (SELECT IFNULL(SUM(stat_value * @@innodb_page_size), -1) AS size_in_bytes
                                                                       FROM mysql.innodb_index_stats
                                                                       WHERE stat_name = 'size'
                                                                           AND index_name != 'PRIMARY'
                                                                           AND index_name = indexes.index_name
                                                                           AND TABLE_NAME = indexes.table_name
                                                                           AND database_name = indexes.table_schema),
                                                                  ',"column":"', indexes.column_name,
                                                      '","index_type":"', LOWER(indexes.index_type),
                                                      '","cardinality":', indexes.cardinality,
                                                      ',"direction":"', (CASE WHEN indexes.collation = 'D' THEN 'desc' ELSE 'asc' END),
                                                      '","column_position":', indexes.seq_in_index,
                                                      ',"unique":', IF(indexes.non_unique = 1, 'false', 'true'), '}')))))
), tbls as
(
  (SELECT (@tbls:=NULL),
              (SELECT (0)
               FROM information_schema.tables tbls
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@tbls:=CONCAT_WS(',', @tbls, CONCAT('{', '"schema":"', \`TABLE_SCHEMA\`, '",',
                                               '"table":"', \`TABLE_NAME\`, '",',
                                             '"rows":', IFNULL(\`TABLE_ROWS\`, 0),
                                             ', "type":"', IFNULL(\`TABLE_TYPE\`, ''), '",',
                                             '"engine":"', IFNULL(\`ENGINE\`, ''), '",',
                                             '"collation":"', IFNULL(\`TABLE_COLLATION\`, ''), '"}')))))
), views as (
(SELECT (@views:=NULL),
              (SELECT (0)
               FROM information_schema.views views
               WHERE table_schema LIKE IFNULL(NULL, '%')
                   AND table_schema = DATABASE()
                   AND (0x00) IN (@views:=CONCAT_WS(',', @views, CONCAT('{', '"schema":"', \`TABLE_SCHEMA\`, '",',
                                                   '"view_name":"', \`TABLE_NAME\`, '",',
                                                   '"view_definition":"', REPLACE(REPLACE(TO_BASE64(VIEW_DEFINITION), ' ', ''), '\n', ''), '"}'))) ) )
)
(SELECT CAST(CONCAT('{"fk_info": [',IFNULL(@fk_info,''),
                '], "pk_info": [', IFNULL(@pk_info, ''),
            '], "columns": [',IFNULL(@cols,''),
            '], "indexes": [',IFNULL(@indexes,''),
            '], "tables":[',IFNULL(@tbls,''),
            '], "views":[',IFNULL(@views,''),
            '], "database_name": "', DATABASE(),
            '", "version": "', VERSION(), '"}') AS CHAR) AS metadata_json_to_import
 FROM fk_info, pk_info, cols, indexes, tbls, views);
`;

    const oldMySQLQuery = `SELECT CAST(CONCAT(
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
               ',"default":"', IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', '\\"'), ''),
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
               REPLACE(REPLACE(TO_BASE64(\`VIEW_DEFINITION\`), ' ', ''), '\n', '') AS view_definition
        FROM information_schema.views vws
        WHERE vws.table_schema = DATABASE()
    ) AS vws), ''),
    '], "database_name": "', DATABASE(),
    '", "version": "', VERSION(), '"}') AS CHAR) AS metadata_json_to_import
`;

    // To avoid the nondeterministic truncation and ensure that your query results are consistent.
    const beforeQuery = `SET SESSION group_concat_max_len = 1000000; -- large enough value to handle your expected result size
`;

    const query =
        databaseEdition === DatabaseEdition.MYSQL_5_7
            ? `${beforeQuery}${oldMySQLQuery}`
            : newMySQLQuery;

    return query;
};
