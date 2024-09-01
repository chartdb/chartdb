import { DatabaseType } from './database-type';
import SupabaseImage from '@/assets/supabase.png';
import TimescaleImage from '@/assets/timescale.png';

export enum DatabaseEdition {
    POSTGRESQL_SUPABASE = 'supabase',
    POSTGRESQL_TIMESCALE = 'timescale',

    MYSQL_5_7 = 'mysql5.7',
}

export const databaseEditionToLabelMap: Record<DatabaseEdition, string> = {
    [DatabaseEdition.POSTGRESQL_SUPABASE]: 'Supabase',
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: 'Timescale',

    [DatabaseEdition.MYSQL_5_7]: 'MySQL 5.7',
};

export const databaseEditionToImageMap: Record<DatabaseEdition, string> = {
    [DatabaseEdition.POSTGRESQL_SUPABASE]: SupabaseImage,
    [DatabaseEdition.POSTGRESQL_TIMESCALE]: TimescaleImage,

    [DatabaseEdition.MYSQL_5_7]: TimescaleImage,
};

export const databaseTypeToEditionMap: Record<DatabaseType, DatabaseEdition[]> =
    {
        [DatabaseType.POSTGRESQL]: [
            DatabaseEdition.POSTGRESQL_SUPABASE,
            DatabaseEdition.POSTGRESQL_TIMESCALE,
        ],
        [DatabaseType.MYSQL]: [],
        [DatabaseType.SQLITE]: [],
        [DatabaseType.GENERIC]: [],
        [DatabaseType.SQL_SERVER]: [],
        [DatabaseType.MARIADB]: [],
    };
