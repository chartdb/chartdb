export const postgresTypes = ['bigint', 'bigserial'] as const;
export const mysqlTypes = ['bigint', 'bigserial'] as const;

export const dataTypes = [
    ...new Set([...postgresTypes, ...mysqlTypes]),
] as const;
