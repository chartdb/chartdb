export const postgresDataTypes = ['bigint', 'bigserial'] as const;
export const mysqlDataTypes = ['bigint', 'bigserial'] as const;

export const dataTypes = [
    ...new Set([...postgresDataTypes, ...mysqlDataTypes]),
] as const;
