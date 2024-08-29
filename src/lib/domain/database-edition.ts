import { DatabaseType } from './database-type';
import SupabaseImage from '@/assets/supabase.png';
import TimescaleImage from '@/assets/timescale.png';

export enum DatabaseEdition {
    SUPABASE = 'supabase',
    TIMESCALE = 'timescale',
}

export const databaseEditionToLabelMap: Record<DatabaseEdition, string> = {
    [DatabaseEdition.SUPABASE]: 'Supabase',
    [DatabaseEdition.TIMESCALE]: 'Timescale',
};

export const databaseEditionToImageMap: Record<DatabaseEdition, string> = {
    [DatabaseEdition.SUPABASE]: SupabaseImage,
    [DatabaseEdition.TIMESCALE]: TimescaleImage,
};

export const databaseTypeToEditionMap: Record<DatabaseType, DatabaseEdition[]> =
    {
        [DatabaseType.POSTGRESQL]: [
            DatabaseEdition.SUPABASE,
            DatabaseEdition.TIMESCALE,
        ],
        [DatabaseType.MYSQL]: [],
        [DatabaseType.SQLITE]: [],
        [DatabaseType.GENERIC]: [],
        [DatabaseType.SQL_SERVER]: [],
        [DatabaseType.MARIADB]: [],
    };
