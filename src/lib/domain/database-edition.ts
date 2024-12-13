import { DatabaseType } from './database-type';
import SupabaseImage from '@/assets/supabase.png';
import TimescaleImage from '@/assets/timescale.png';
import MySql5_7Image from '@/assets/mysql_5_7.png';
import SqlServerImage from '@/assets/sql_server_logo_2.png';

export enum DatabaseEdition {
    // PostgreSQL
    POSTGRESQL_SUPABASE = 'supabase',
    POSTGRESQL_TIMESCALE = 'timescale',

    // MySQL
    MYSQL_5_7 = 'mysql_5_7',

    // SQL Server
    SQL_SERVER_2016_AND_BELOW = 'sql_server_2016_and_below',
}

export const databaseEditionToLabelMap: Record<DatabaseEdition, string> = {
    // PostgreSQL
    [DatabaseEdition.POSTGRESQL_SUPABASE]: 'Supabase',
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: 'Timescale',

    // MySQL
    [DatabaseEdition.MYSQL_5_7]: 'V5.7',

    // SQL Server
    [DatabaseEdition.SQL_SERVER_2016_AND_BELOW]: '2016 and below',
};

export const databaseEditionToImageMap: Record<DatabaseEdition, string> = {
    // PostgreSQL
    [DatabaseEdition.POSTGRESQL_SUPABASE]: SupabaseImage,
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: TimescaleImage,

    // MySQL
    [DatabaseEdition.MYSQL_5_7]: MySql5_7Image,

    // SQL Server
    [DatabaseEdition.SQL_SERVER_2016_AND_BELOW]: SqlServerImage,
};

export const databaseTypeToEditionMap: Record<DatabaseType, DatabaseEdition[]> =
    {
        [DatabaseType.POSTGRESQL]: [
            DatabaseEdition.POSTGRESQL_SUPABASE,
            DatabaseEdition.POSTGRESQL_TIMESCALE,
        ],
        [DatabaseType.MYSQL]: [DatabaseEdition.MYSQL_5_7],
        [DatabaseType.SQL_SERVER]: [DatabaseEdition.SQL_SERVER_2016_AND_BELOW],
        [DatabaseType.SQLITE]: [],
        [DatabaseType.GENERIC]: [],
        [DatabaseType.MARIADB]: [],
        [DatabaseType.CLICKHOUSE]: [],
        [DatabaseType.COCKROACHDB]: [],
    };
