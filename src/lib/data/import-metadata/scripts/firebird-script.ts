export const firebirdQuery = `with
  DB as (select (select
       case
         when position('/' in RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) > 0 then
           case
             when position('.' in substring(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME') from char_length(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) - position('/' in reverse(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME'))) + 2)) > 0
               then substring(substring(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME') from char_length(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) - position('/' in reverse(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME'))) + 2) from 1 for position('.' in substring(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME') from char_length(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) - position('/' in reverse(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME'))) + 2)) - 1)
             else substring(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME') from char_length(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) - position('/' in reverse(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME'))) + 2)
           end
         else
           case
             when position('.' in RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) > 0
               then substring(RDB$GET_CONTEXT('SYSTEM', 'DB_NAME') from 1 for position('.' in RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')) - 1)
             else RDB$GET_CONTEXT('SYSTEM', 'DB_NAME')
           end
       end
    from RDB$DATABASE) DATABASE_NAME, 'firebird' DATABASE_ENGINE, (select rdb$get_context('SYSTEM', 'ENGINE_VERSION') from RDB$DATABASE) DATABASE_VERSION, trim(T.RDB$CHARACTER_SET_NAME) as CHAR_SET from RDB$DATABASE T),
  TABLES as (select * from RDB$RELATIONS where RDB$RELATION_NAME not containing '$'),
  FIELDS as (select trim(F.RDB$RELATION_NAME) TABLE_NAME, trim(F.RDB$FIELD_NAME) FIELD_NAME, F.RDB$FIELD_POSITION FIELD_POSITION,
             iif(coalesce(F.RDB$DEFAULT_SOURCE, D.RDB$DEFAULT_SOURCE) is null, 'null', substring(coalesce(F.RDB$DEFAULT_SOURCE, D.RDB$DEFAULT_SOURCE) from 9)) DEFAULT_VALUE,
            D.RDB$VALIDATION_SOURCE VALIDATION_SOURCE, 
           case D.RDB$FIELD_TYPE when 7 then 'SMALLINT' when 8 then 'INTEGER' when 10 then 'FLOAT' when 12 then 'DATE' when 13 then 'TIME' when 14 then 'CHAR' when 16 then 'BIGINT' when 23 then 'BOOLEAN' when 24 then 'DECFLOAT(16)' when 25 then 'DECFLOAT(34)' when 26 then 'INT128' when 27 then 'DOUBLE PRECISION' when 28 then 'TIME WITH TIME ZONE' when 29 then 'TIMESTAMP WITH TIME zone' when 35 then 'TIMESTAMP' when 37 then 'VARCHAR' when 261 then 'BLOB' else 'UNKNOWN' end FIELD_TYPE,
           D.RDB$CHARACTER_LENGTH as CHARACTER_MAXIMUM_LENGTH, D.RDB$FIELD_SCALE as FIELD_PRECISION
     from RDB$RELATION_FIELDS F 
     left outer join RDB$FIELDS D on D.RDB$FIELD_NAME = F.RDB$FIELD_SOURCE 
     where F.RDB$RELATION_NAME not containing '$'
     order by F.RDB$RELATION_NAME, F.RDB$FIELD_POSITION),
  PRIMARY_KEYS as (select trim(I.RDB$RELATION_NAME) TABLE_NAME, trim(I.RDB$CONSTRAINT_NAME) INDEX_NAME, (select list(trim(S.RDB$FIELD_NAME), ', ') from RDB$INDEX_SEGMENTS S where S.RDB$INDEX_NAME = I.RDB$INDEX_NAME) as INDEX_FIELDS, (select first 1 trim(S.RDB$FIELD_NAME) from RDB$INDEX_SEGMENTS S where S.RDB$INDEX_NAME = I.RDB$INDEX_NAME order by S.RDB$FIELD_POSITION) as FIELD_NAME from RDB$RELATION_CONSTRAINTS I where I.RDB$CONSTRAINT_TYPE = 'PRIMARY KEY'),
  INDEXES as (select trim(I.RDB$RELATION_NAME) TABLE_NAME, trim(I.RDB$INDEX_NAME) INDEX_NAME, trim(iif(I.RDB$INDEX_TYPE = 1, 'DESC', 'ASC')) INDEX_TYPE, I.RDB$UNIQUE_FLAG UNIQUE_FLAG, trim(S.RDB$FIELD_NAME) FIELD_NAME, S.RDB$FIELD_POSITION FIELD_POSITION, S.RDB$STATISTICS STATISTICS
         from RDB$INDICES I
        join RDB$INDEX_SEGMENTS S on S.RDB$INDEX_NAME = I.RDB$INDEX_NAME
       left outer join RDB$RELATION_CONSTRAINTS C on C.RDB$CONSTRAINT_NAME = I.RDB$INDEX_NAME
       where I.RDB$RELATION_NAME not containing '$' and I.RDB$FOREIGN_KEY IS null),
  FOREIGNS as (select trim(RC.RDB$RELATION_NAME) TABLE_NAME, trim(RC.RDB$CONSTRAINT_NAME) INDEX_NAME, list(trim(S.RDB$FIELD_NAME), ',') FIELD_NAME, trim(REFC.RDB$UPDATE_RULE) ON_UPDATE, trim(REFC.RDB$DELETE_RULE) ON_DELETE, trim(REFC.RDB$MATCH_OPTION) MATCH_TYPE, trim(I2.RDB$RELATION_NAME) REFERENCES_TABLE, list(trim(S2.RDB$FIELD_NAME), ',') REFERENCES_FIELD, trim(I.RDB$DESCRIPTION) DESCRIPTION, trim(RC.RDB$DEFERRABLE) IS_DEFERRABLE, trim(RC.RDB$INITIALLY_DEFERRED) IS_DEFFERED
        from RDB$INDEX_SEGMENTS S
     left join RDB$INDICES I on I.RDB$INDEX_NAME = S.RDB$INDEX_NAME
     left join RDB$RELATION_CONSTRAINTS RC on RC.RDB$INDEX_NAME = S.RDB$INDEX_NAME
     left join RDB$REF_CONSTRAINTS REFC on RC.RDB$CONSTRAINT_NAME = REFC.RDB$CONSTRAINT_NAME
     left join RDB$RELATION_CONSTRAINTS RC2 on RC2.RDB$CONSTRAINT_NAME = REFC.RDB$CONST_NAME_UQ
     left join RDB$INDICES I2 on I2.RDB$INDEX_NAME = RC2.RDB$INDEX_NAME
     left join RDB$INDEX_SEGMENTS S2 on I2.RDB$INDEX_NAME = S2.RDB$INDEX_NAME
     where RC.RDB$CONSTRAINT_TYPE = 'FOREIGN KEY'
                group by RC.RDB$RELATION_NAME, RC.RDB$CONSTRAINT_NAME, REFC.RDB$UPDATE_RULE, REFC.RDB$DELETE_RULE, REFC.RDB$MATCH_OPTION, I2.RDB$RELATION_NAME, I.RDB$DESCRIPTION, RC.RDB$DEFERRABLE, RC.RDB$INITIALLY_DEFERRED),
  VIEWS as (select distinct RDB$VIEW_NAME VIEW_NAME from RDB$VIEW_RELATIONS)
  select '{' || 
   '"tables": [' || coalesce((select list('{'
       || '"schema": "' || DB.DATABASE_NAME || '",'
       || '"table": "' || trim(RDB$RELATION_NAME) || '",'
       || '"type": "BASE TABLE",'
       || '"rows": 0,'
       || '"engine": "' || DB.DATABASE_ENGINE || '",'
       || '"collation": "' || DB.CHAR_SET || '"'
       || '}', ',') from TABLES), '')
   || '],'
   || '"columns": [' || coalesce((select list('{'
       || '"schema": "' || DB.DATABASE_NAME || '",'
       || '"table": "' || FIELDS.TABLE_NAME || '",'
       || '"name": "' || FIELDS.FIELD_NAME || '",'
       || '"type": "' || FIELDS.FIELD_TYPE || '",'
       || '"character_maximum_length": "' || coalesce(FIELDS.CHARACTER_MAXIMUM_LENGTH, 'null') || '",'
       || '"precision": "' || coalesce(FIELDS.FIELD_PRECISION, 'null') || '",'
       || '"ordinal_position": "' || FIELDS.FIELD_POSITION || '",'
       || '"nullable": ' || iif(FIELDS.DEFAULT_VALUE = 'null', 'true', 'false') || ','
       || '"default": "' || replace(FIELDS.DEFAULT_VALUE, '''''', '') || '",'
       || '"collation": "' || DB.CHAR_SET || '"'
       || '}', ',') from FIELDS), '')
   || '],'
   || '"pk_info": [' || coalesce((select list('{'
       || '"schema": "' || DB.DATABASE_NAME || '",'
       || '"table": "' || PRIMARY_KEYS.TABLE_NAME || '",'
       || '"column": "' || PRIMARY_KEYS.FIELD_NAME || '",'
       || '"pk_def": "' || PRIMARY_KEYS.INDEX_NAME || ' (' || PRIMARY_KEYS.INDEX_FIELDS || ')' || '"'
       || '}', ',') from PRIMARY_KEYS), '')
   || '],'
   || '"fk_info": [' || coalesce((select list('{'
       || '"schema": "' || DB.DATABASE_NAME || '",'
       || '"table": "' || FOREIGNS.TABLE_NAME || '",'
       || '"column": "' || FOREIGNS.FIELD_NAME || '",'
       || '"foreign_key_name": "' || FOREIGNS.INDEX_NAME || '",'
       || '"reference_schema": "' || DB.DATABASE_NAME || '",'
       || '"reference_table": "' || FOREIGNS.REFERENCES_TABLE || '",'
       || '"reference_column": "' || FOREIGNS.REFERENCES_FIELD || '",'
       || '"fk_def": "FOREIGN KEY (' || FOREIGNS.FIELD_NAME || ') REFERENCES ' || FOREIGNS.REFERENCES_TABLE || '(' || FOREIGNS.REFERENCES_FIELD || ') ON UPDATE ' || FOREIGNS.ON_UPDATE || ' ON DELETE ' || FOREIGNS.ON_DELETE || '"'
       || '}', ',') from FOREIGNS), '')
   || '],'
   || '"indexes": [' || coalesce((select list('{'
       || '"schema": "' || DB.DATABASE_NAME || '",'
       || '"table": "' || INDEXES.TABLE_NAME || '",'
       || '"name": "' || INDEXES.INDEX_NAME || '",'
       || '"size": 0,'
       || '"column": "' || INDEXES.FIELD_NAME || '",'
       || '"index_type": "",'
       || '"cardinality": ' || INDEXES.STATISTICS || ','
       || '"direction": "' || INDEXES.INDEX_TYPE|| '",'
       || '"column_position": ' || INDEXES.FIELD_POSITION || ','
       || '"unique": ' || iif(INDEXES.UNIQUE_FLAG = 1, 'true', 'false')
       || '}', ',') from INDEXES), '')
   || '],'
   || '"views": [' || coalesce((select list('{'
       || '"schema": "' || DB.DATABASE_NAME || '",'
       || '"view_name": "' || VIEWS.VIEW_NAME || '",'
       || '"view_definition": ""'
       || '}', ',') from VIEWS), '')
   || '],'
   || '"database_name":"' || DB.DATABASE_NAME || '",'
   || '"version":"' || DB.DATABASE_VERSION || '"'
   || '}'  
   from DB;
`;
