import { Client } from 'pg';
import type {
    CanonicalCheckConstraint,
    CanonicalColumn,
    CanonicalForeignKey,
    CanonicalIndex,
    CanonicalPrimaryKey,
    CanonicalSchema,
    CanonicalTable,
    CanonicalUniqueConstraint,
    DatabaseConnectionSecret,
} from '@chartdb/schema-sync-core';
import { hashCanonicalSchema } from '@chartdb/schema-sync-core';

const actionMap: Record<string, string> = {
    a: 'NO ACTION',
    r: 'RESTRICT',
    c: 'CASCADE',
    n: 'SET NULL',
    d: 'SET DEFAULT',
};

const makeClient = async (secret: DatabaseConnectionSecret) => {
    const client = new Client({
        host: secret.host,
        port: secret.port,
        database: secret.database,
        user: secret.username,
        password: secret.password,
        ssl:
            secret.sslMode === 'disable'
                ? false
                : { rejectUnauthorized: false },
    });
    await client.connect();
    return client;
};

export const testPostgresConnection = async (
    secret: DatabaseConnectionSecret
) => {
    const client = await makeClient(secret);
    try {
        const versionResult = await client.query<{ version: string }>(
            'SELECT version() AS version'
        );
        const schemasResult = await client.query<{ schema_name: string }>(
            `
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
            ORDER BY schema_name
            `
        );

        return {
            ok: true as const,
            version: versionResult.rows[0]?.version,
            databaseName: secret.database,
            availableSchemas: schemasResult.rows.map((row) => row.schema_name),
        };
    } finally {
        await client.end();
    }
};

export const introspectPostgresSchema = async ({
    secret,
    schemas,
}: {
    secret: DatabaseConnectionSecret;
    schemas: string[];
}): Promise<CanonicalSchema> => {
    const client = await makeClient(secret);

    try {
        const normalizedSchemas = schemas.length > 0 ? schemas : ['public'];
        const tablesResult = await client.query<{
            schema_name: string;
            table_name: string;
            relkind: 'r' | 'v' | 'm';
        }>(
            `
            SELECT ns.nspname AS schema_name, cls.relname AS table_name, cls.relkind
            FROM pg_class cls
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            WHERE cls.relkind IN ('r', 'v', 'm')
              AND ns.nspname = ANY($1::text[])
            ORDER BY ns.nspname, cls.relname
            `,
            [normalizedSchemas]
        );

        const columnsResult = await client.query<{
            schema_name: string;
            table_name: string;
            column_name: string;
            ordinal_position: number;
            formatted_type: string;
            nullable: boolean;
            column_default: string | null;
            identity_generation: string | null;
            comment: string | null;
        }>(
            `
            SELECT
                ns.nspname AS schema_name,
                cls.relname AS table_name,
                att.attname AS column_name,
                att.attnum AS ordinal_position,
                pg_catalog.format_type(att.atttypid, att.atttypmod) AS formatted_type,
                NOT att.attnotnull AS nullable,
                pg_get_expr(def.adbin, def.adrelid) AS column_default,
                CASE
                    WHEN att.attidentity = 'a' THEN 'ALWAYS'
                    WHEN att.attidentity = 'd' THEN 'BY DEFAULT'
                    ELSE NULL
                END AS identity_generation,
                pg_catalog.col_description(cls.oid, att.attnum) AS comment
            FROM pg_attribute att
            JOIN pg_class cls ON cls.oid = att.attrelid
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            LEFT JOIN pg_attrdef def ON def.adrelid = att.attrelid AND def.adnum = att.attnum
            WHERE cls.relkind IN ('r', 'v', 'm')
              AND att.attnum > 0
              AND NOT att.attisdropped
              AND ns.nspname = ANY($1::text[])
            ORDER BY ns.nspname, cls.relname, att.attnum
            `,
            [normalizedSchemas]
        );

        const pkResult = await client.query<{
            schema_name: string;
            table_name: string;
            constraint_name: string;
            column_names: string[];
        }>(
            `
            SELECT
                ns.nspname AS schema_name,
                cls.relname AS table_name,
                con.conname AS constraint_name,
                array_agg(att.attname ORDER BY ord.ordinality) AS column_names
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            JOIN unnest(con.conkey) WITH ORDINALITY AS ord(attnum, ordinality) ON TRUE
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ord.attnum
            WHERE con.contype = 'p'
              AND ns.nspname = ANY($1::text[])
            GROUP BY ns.nspname, cls.relname, con.conname
            `,
            [normalizedSchemas]
        );

        const uniqueResult = await client.query<{
            schema_name: string;
            table_name: string;
            constraint_name: string;
            column_names: string[];
        }>(
            `
            SELECT
                ns.nspname AS schema_name,
                cls.relname AS table_name,
                con.conname AS constraint_name,
                array_agg(att.attname ORDER BY ord.ordinality) AS column_names
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            JOIN unnest(con.conkey) WITH ORDINALITY AS ord(attnum, ordinality) ON TRUE
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ord.attnum
            WHERE con.contype = 'u'
              AND ns.nspname = ANY($1::text[])
            GROUP BY ns.nspname, cls.relname, con.conname
            `,
            [normalizedSchemas]
        );

        const fkResult = await client.query<{
            schema_name: string;
            table_name: string;
            constraint_name: string;
            column_names: string[];
            referenced_schema_name: string;
            referenced_table_name: string;
            referenced_column_names: string[];
            on_update: string;
            on_delete: string;
        }>(
            `
            SELECT
                src_ns.nspname AS schema_name,
                src_tbl.relname AS table_name,
                con.conname AS constraint_name,
                array_agg(src_att.attname ORDER BY src_ord.ordinality) AS column_names,
                ref_ns.nspname AS referenced_schema_name,
                ref_tbl.relname AS referenced_table_name,
                array_agg(ref_att.attname ORDER BY src_ord.ordinality) AS referenced_column_names,
                max(con.confupdtype) AS on_update,
                max(con.confdeltype) AS on_delete
            FROM pg_constraint con
            JOIN pg_class src_tbl ON src_tbl.oid = con.conrelid
            JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
            JOIN pg_class ref_tbl ON ref_tbl.oid = con.confrelid
            JOIN pg_namespace ref_ns ON ref_ns.oid = ref_tbl.relnamespace
            JOIN unnest(con.conkey) WITH ORDINALITY AS src_ord(attnum, ordinality) ON TRUE
            JOIN unnest(con.confkey) WITH ORDINALITY AS ref_ord(attnum, ordinality) ON src_ord.ordinality = ref_ord.ordinality
            JOIN pg_attribute src_att ON src_att.attrelid = con.conrelid AND src_att.attnum = src_ord.attnum
            JOIN pg_attribute ref_att ON ref_att.attrelid = con.confrelid AND ref_att.attnum = ref_ord.attnum
            WHERE con.contype = 'f'
              AND src_ns.nspname = ANY($1::text[])
            GROUP BY src_ns.nspname, src_tbl.relname, con.conname, ref_ns.nspname, ref_tbl.relname
            `,
            [normalizedSchemas]
        );

        const indexResult = await client.query<{
            schema_name: string;
            table_name: string;
            index_name: string;
            unique: boolean;
            index_type: string | null;
            column_names: string[];
        }>(
            `
            SELECT
                ns.nspname AS schema_name,
                tbl.relname AS table_name,
                idx.relname AS index_name,
                ind.indisunique AS unique,
                am.amname AS index_type,
                array_agg(att.attname ORDER BY ord.ordinality) FILTER (WHERE att.attname IS NOT NULL) AS column_names
            FROM pg_index ind
            JOIN pg_class tbl ON tbl.oid = ind.indrelid
            JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
            JOIN pg_class idx ON idx.oid = ind.indexrelid
            JOIN pg_am am ON am.oid = idx.relam
            LEFT JOIN unnest(ind.indkey) WITH ORDINALITY AS ord(attnum, ordinality) ON TRUE
            LEFT JOIN pg_attribute att ON att.attrelid = ind.indrelid AND att.attnum = ord.attnum
            WHERE ns.nspname = ANY($1::text[])
              AND NOT ind.indisprimary
              AND NOT EXISTS (
                  SELECT 1
                  FROM pg_constraint con
                  WHERE con.conindid = ind.indexrelid
                    AND con.contype IN ('p', 'u')
              )
            GROUP BY ns.nspname, tbl.relname, idx.relname, ind.indisunique, am.amname
            `,
            [normalizedSchemas]
        );

        const checkResult = await client.query<{
            schema_name: string;
            table_name: string;
            constraint_name: string;
            expression: string;
        }>(
            `
            SELECT
                ns.nspname AS schema_name,
                cls.relname AS table_name,
                con.conname AS constraint_name,
                pg_get_constraintdef(con.oid) AS expression
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = cls.relnamespace
            WHERE con.contype = 'c'
              AND ns.nspname = ANY($1::text[])
            `,
            [normalizedSchemas]
        );

        const tables = tablesResult.rows.map<CanonicalTable>((row) => {
            const tableColumns = columnsResult.rows
                .filter(
                    (column) =>
                        column.schema_name === row.schema_name &&
                        column.table_name === row.table_name
                )
                .map<CanonicalColumn>((column) => ({
                    id: `${row.schema_name}.${row.table_name}.${column.column_name}`,
                    name: column.column_name,
                    dataType: column.formatted_type,
                    dataTypeDisplay: column.formatted_type,
                    nullable: column.nullable,
                    defaultValue:
                        column.column_default &&
                        !column.column_default.startsWith('nextval(')
                            ? column.column_default
                            : null,
                    isIdentity:
                        !!column.identity_generation ||
                        !!column.column_default?.startsWith('nextval('),
                    identityGeneration:
                        column.identity_generation as CanonicalColumn['identityGeneration'],
                    comment: column.comment,
                    sync: {
                        sourceId: `${row.schema_name}.${row.table_name}.${column.column_name}`,
                    },
                }));

            const primaryKeyRow = pkResult.rows.find(
                (pk) =>
                    pk.schema_name === row.schema_name &&
                    pk.table_name === row.table_name
            );
            const primaryKey: CanonicalPrimaryKey | null = primaryKeyRow
                ? {
                      id: `${row.schema_name}.${row.table_name}.${primaryKeyRow.constraint_name}`,
                      name: primaryKeyRow.constraint_name,
                      columnIds: primaryKeyRow.column_names.map(
                          (columnName) =>
                              `${row.schema_name}.${row.table_name}.${columnName}`
                      ),
                  }
                : null;

            const uniqueConstraints = uniqueResult.rows
                .filter(
                    (constraint) =>
                        constraint.schema_name === row.schema_name &&
                        constraint.table_name === row.table_name
                )
                .map<CanonicalUniqueConstraint>((constraint) => ({
                    id: `${row.schema_name}.${row.table_name}.${constraint.constraint_name}`,
                    name: constraint.constraint_name,
                    columnIds: constraint.column_names.map(
                        (columnName) =>
                            `${row.schema_name}.${row.table_name}.${columnName}`
                    ),
                    sync: {
                        sourceId: `${row.schema_name}.${row.table_name}.${constraint.constraint_name}`,
                    },
                }));

            const indexes = indexResult.rows
                .filter(
                    (index) =>
                        index.schema_name === row.schema_name &&
                        index.table_name === row.table_name
                )
                .map<CanonicalIndex>((index) => ({
                    id: `${row.schema_name}.${row.table_name}.${index.index_name}`,
                    name: index.index_name,
                    columnIds: (index.column_names ?? []).map(
                        (columnName) =>
                            `${row.schema_name}.${row.table_name}.${columnName}`
                    ),
                    unique: index.unique,
                    type: index.index_type,
                    sync: {
                        sourceId: `${row.schema_name}.${row.table_name}.${index.index_name}`,
                    },
                }));

            const foreignKeys = fkResult.rows
                .filter(
                    (foreignKey) =>
                        foreignKey.schema_name === row.schema_name &&
                        foreignKey.table_name === row.table_name
                )
                .map<CanonicalForeignKey>((foreignKey) => ({
                    id: `${row.schema_name}.${row.table_name}.${foreignKey.constraint_name}`,
                    name: foreignKey.constraint_name,
                    columnIds: foreignKey.column_names.map(
                        (columnName) =>
                            `${row.schema_name}.${row.table_name}.${columnName}`
                    ),
                    referencedSchemaName: foreignKey.referenced_schema_name,
                    referencedTableName: foreignKey.referenced_table_name,
                    referencedColumnNames:
                        foreignKey.referenced_column_names ?? [],
                    onUpdate: actionMap[foreignKey.on_update] ?? null,
                    onDelete: actionMap[foreignKey.on_delete] ?? null,
                    sync: {
                        sourceId: `${row.schema_name}.${row.table_name}.${foreignKey.constraint_name}`,
                    },
                }));

            const checkConstraints = checkResult.rows
                .filter(
                    (constraint) =>
                        constraint.schema_name === row.schema_name &&
                        constraint.table_name === row.table_name
                )
                .map<CanonicalCheckConstraint>((constraint) => ({
                    id: `${row.schema_name}.${row.table_name}.${constraint.constraint_name}`,
                    name: constraint.constraint_name,
                    expression: constraint.expression
                        .replace(/^CHECK\s*\(/, '')
                        .replace(/\)\s*$/, ''),
                    sync: {
                        sourceId: `${row.schema_name}.${row.table_name}.${constraint.constraint_name}`,
                    },
                }));

            return {
                id: `${row.schema_name}.${row.table_name}`,
                schemaName: row.schema_name,
                name: row.table_name,
                kind: row.relkind === 'r' ? 'table' : 'view',
                columns: tableColumns,
                primaryKey,
                uniqueConstraints,
                indexes,
                foreignKeys,
                checkConstraints,
                sync: {
                    sourceId: `${row.schema_name}.${row.table_name}`,
                },
            };
        });

        const schema: CanonicalSchema = {
            engine: 'postgresql',
            databaseName: secret.database,
            defaultSchemaName: normalizedSchemas[0] ?? 'public',
            schemaNames: normalizedSchemas,
            tables,
            importedAt: new Date().toISOString(),
        };
        schema.fingerprint = hashCanonicalSchema(schema);
        return schema;
    } finally {
        await client.end();
    }
};
