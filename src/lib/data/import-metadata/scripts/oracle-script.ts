export const oracleDBQuery = `----------------------------------------------------------------------------
-- 1.  FOREIGN-KEY METADATA
----------------------------------------------------------------------------
WITH fk_info AS (
	SELECT JSON_OBJECT(
	       KEY 'schema'            VALUE a.owner,
	       KEY 'table'             VALUE a.table_name,
	       KEY 'column'            VALUE b.column_name,
	       KEY 'foreign_key_name'  VALUE a.constraint_name,
	       KEY 'reference_schema'  VALUE c.owner,
	       KEY 'reference_table'   VALUE c.table_name,
	       KEY 'reference_column'  VALUE d.column_name,
	       KEY 'fk_def'            VALUE
	            'FOREIGN KEY ('||b.column_name||') REFERENCES '||
	            c.table_name||'('||d.column_name||') ON DELETE '||
	            DECODE(a.delete_rule,
	                   'CASCADE' , 'CASCADE' ,
	                   'SET NULL', 'SET NULL',
	                   'RESTRICT', 'RESTRICT',
	                   'NO ACTION')
	       RETURNING CLOB
	     ) AS json_data
	FROM   all_constraints     a
	JOIN   all_cons_columns    b
	     ON  b.owner = a.owner
	    AND b.constraint_name = a.constraint_name
	JOIN   all_constraints     c
	     ON  c.owner = a.r_owner
	    AND c.constraint_name = a.r_constraint_name
	JOIN   all_cons_columns    d
	     ON  d.owner = c.owner
	    AND d.constraint_name = c.constraint_name
	    AND d.position        = b.position
	WHERE  a.constraint_type = 'R'
	AND    a.owner           = SYS_CONTEXT('USERENV','CURRENT_SCHEMA')
	),

	/* ==============================================================
	2.  PRIMARY-KEY METADATA
	==============================================================*/
	pk_info AS (
	SELECT JSON_OBJECT(
	       KEY 'schema' VALUE a.owner,
	       KEY 'table'  VALUE a.table_name,
	       KEY 'column' VALUE LISTAGG(b.column_name, ', ')
	                        WITHIN GROUP (ORDER BY b.position),
	       KEY 'pk_def' VALUE 'PRIMARY KEY ('||
	                         LISTAGG(b.column_name, ', ')
	                           WITHIN GROUP (ORDER BY b.position)||')'
	       RETURNING CLOB
	     ) AS json_data
	FROM   all_constraints  a
	JOIN   all_cons_columns b
	     ON b.owner            = a.owner
	    AND b.constraint_name  = a.constraint_name
	WHERE  a.constraint_type = 'P'
	AND    a.owner           = SYS_CONTEXT('USERENV','CURRENT_SCHEMA')
	GROUP  BY a.owner, a.table_name
	),

	/* ==============================================================
	3.  COLUMN METADATA
	==============================================================*/
	cols AS (
	SELECT JSON_OBJECT(
	       KEY 'schema'                   VALUE owner,
	       KEY 'table'                    VALUE table_name,
	       KEY 'name'                     VALUE column_name,
	       KEY 'type'                     VALUE LOWER(data_type),
	       KEY 'character_maximum_length' VALUE CASE
	                                              WHEN data_type LIKE '%CHAR%'
	                                              THEN TO_CHAR(char_length)
	                                            END,
	       KEY 'precision'                VALUE CASE
	                                              WHEN data_type IN ('NUMBER','FLOAT','DECIMAL')
	                                              THEN JSON_OBJECT(
	                                                     KEY 'precision' VALUE data_precision,
	                                                     KEY 'scale'     VALUE data_scale)
	                                            END,
	       KEY 'ordinal_position'         VALUE column_id,
	       KEY 'nullable'                 VALUE CASE nullable
	                                            WHEN 'Y' THEN 'true' ELSE 'false' END FORMAT JSON,
	       KEY 'default'                  VALUE '""' FORMAT JSON,
	       KEY 'collation'                VALUE '""' FORMAT JSON
	       RETURNING CLOB
	     ) AS json_data
	FROM   all_tab_columns
	WHERE  owner = SYS_CONTEXT('USERENV','CURRENT_SCHEMA')
	),

	/* ==============================================================
	4.  INDEX METADATA
	==============================================================*/
	indexes AS (
	SELECT JSON_OBJECT(
	         KEY 'schema'          VALUE i.owner,
	         KEY 'table'           VALUE i.table_name,
	         KEY 'name'            VALUE i.index_name,
	         KEY 'size'            VALUE -1,
	         KEY 'column'          VALUE c.column_name,
	         KEY 'index_type'      VALUE LOWER(i.index_type),
	         KEY 'cardinality'     VALUE 0,
	         KEY 'direction'       VALUE CASE c.descend WHEN 'DESC' THEN 'desc' ELSE 'asc' END,
	         KEY 'column_position' VALUE c.column_position,
	         /* boolean → use FORMAT JSON so true/false are not quoted */
	         KEY 'unique'          VALUE CASE i.uniqueness WHEN 'UNIQUE' THEN 'true' ELSE 'false' END FORMAT JSON
	         RETURNING CLOB
	       ) AS json_data
	FROM   all_indexes      i
	JOIN   all_ind_columns  c
	       ON  c.index_owner = i.owner
	      AND c.index_name  = i.index_name
	WHERE  i.owner = SYS_CONTEXT('USERENV','CURRENT_SCHEMA')
	),

	/* ==============================================================
	5.  TABLE & VIEW METADATA
	==============================================================*/
	tbls AS (
	SELECT JSON_OBJECT(
	       KEY 'schema'    VALUE owner,
	       KEY 'table'     VALUE table_name,
	       KEY 'rows'      VALUE num_rows,
	       KEY 'type'      VALUE 'TABLE',
	       KEY 'engine'    VALUE '""' FORMAT JSON,
	       KEY 'collation' VALUE '""' FORMAT JSON
	       RETURNING CLOB
	     ) AS json_data
	FROM   all_tables
	WHERE  owner = SYS_CONTEXT('USERENV','CURRENT_SCHEMA')
	),
	views AS (
	SELECT JSON_OBJECT(
	         KEY 'schema'          VALUE owner,
	         KEY 'view_name'       VALUE view_name,
	         /* JSON literal for empty string */
	         KEY 'view_definition' VALUE '""' FORMAT JSON
	         RETURNING CLOB
	       ) AS json_data
	FROM   all_views
	WHERE  owner = SYS_CONTEXT('USERENV','CURRENT_SCHEMA')
	)

	/* ==============================================================
	6.  COMPOSE THE FINAL JSON DOCUMENT
	==============================================================*/
	SELECT JSON_OBJECT(
	     KEY 'fk_info'       VALUE (SELECT JSON_ARRAYAGG(json_data RETURNING CLOB) FROM fk_info),
	     KEY 'pk_info'       VALUE (SELECT JSON_ARRAYAGG(json_data RETURNING CLOB) FROM pk_info),
	     KEY 'columns'       VALUE (SELECT JSON_ARRAYAGG(json_data RETURNING CLOB) FROM cols),
	     KEY 'indexes'       VALUE (SELECT JSON_ARRAYAGG(json_data RETURNING CLOB) FROM indexes),
	     KEY 'tables'        VALUE (SELECT JSON_ARRAYAGG(json_data RETURNING CLOB) FROM tbls),
	     KEY 'views'         VALUE (SELECT JSON_ARRAYAGG(json_data RETURNING CLOB) FROM views),
	     KEY 'schema'        VALUE SYS_CONTEXT('USERENV','CURRENT_SCHEMA'),
	     KEY 'database_name' VALUE SYS_CONTEXT('USERENV','DB_NAME'),
	     KEY 'version' 		 VALUE SYS_CONTEXT('USERENV','DB_NAME')
	     RETURNING CLOB
	   ) AS metadata_json_to_import
	FROM   dual
`;
