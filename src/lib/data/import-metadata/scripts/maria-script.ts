export const mariaDBQuery = `WITH fk_info as (
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
                       ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION) AS pk
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
                ',"default":"', IFNULL(REPLACE(REPLACE(cols.column_default, '\\\\', ''), '"', '\\"'), ''),
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
