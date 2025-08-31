import { DatabaseType } from '@/lib/domain/database-type';
import type { Template } from '../templates-data';
import image from '@/assets/templates/laravel-activitylog-db.png';
import imageDark from '@/assets/templates/laravel-activitylog-db-dark.png';

const now = Date.now();

export const laravelActivitylogDb: Template = {
    slug: 'laravel-activitylog-database',
    name: 'Laravel Activitylog',
    shortDescription: 'Log activity inside your Laravel app',
    description:
        'Package provides easy to use functions to log the activities of the users of your app.',
    image,
    imageDark,
    tags: ['MySQL', 'Open Source', 'Laravel', 'PHP'],
    featured: false,
    url: 'https://github.com/stefanzweifel/laravel-activitylog',
    diagram: {
        id: 'laravel_activitylog_db',
        name: 'laravel-activitylog-database',
        createdAt: new Date(),
        updatedAt: new Date(),
        databaseType: DatabaseType.MYSQL,
        tables: [
            {
                id: 'jcl5gphu817lv8oyozvuvf23c',
                name: 'activity_log',
                schema: 't_laravel_activitylog_db',
                x: 100,
                y: 100,
                fields: [
                    {
                        id: 'aotc76lw9u7uxh7pro07f6j0p',
                        name: 'id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: 'zvvytqmfe4orhi45k75278wel',
                        name: 'log_name',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: now,
                    },
                    {
                        id: 'j51d80x714299knbz7z92foow',
                        name: 'description',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: now,
                    },
                    {
                        id: 'qpuyahkualqltg8bwesy2xkx6',
                        name: 'subject_id',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: now,
                    },
                    {
                        id: 'ehh1993c7675onxybh3f476cs',
                        name: 'subject_type',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: now,
                    },
                    {
                        id: 'jszmokhj5rh1oixx4gjafyn2j',
                        name: 'event',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: now,
                    },
                    {
                        id: 'dy9v51ey1731raepj4b4vpars',
                        name: 'causer_id',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: now,
                    },
                    {
                        id: 'z72ugem30h3hfzosc8kzktdyl',
                        name: 'causer_type',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: now,
                    },
                    {
                        id: 'v1iw9y1su4j6bqv7x4hethye8',
                        name: 'properties',
                        type: {
                            id: 'json',
                            name: 'json',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: now,
                    },
                    {
                        id: 'hhj0bm5t270jkake9hryq0wop',
                        name: 'batch_uuid',
                        type: {
                            id: 'char',
                            name: 'char',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: now,
                    },
                    {
                        id: 'e76wqcihlqq8mvq7sodb7grlb',
                        name: 'created_at',
                        type: {
                            id: 'datetime',
                            name: 'datetime',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: 'ynaua9wzhssaba9iw7o4bg10f',
                        name: 'updated_at',
                        type: {
                            id: 'datetime',
                            name: 'datetime',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: now,
                    },
                ],
                indexes: [
                    {
                        id: '3p7a26r0be3yk36g0yls8q7of',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['aotc76lw9u7uxh7pro07f6j0p'],
                        createdAt: now,
                    },
                    {
                        id: 'e21o6cephz679p0g4re89x9sv',
                        name: 'activity_log_log_name_index',
                        unique: false,
                        fieldIds: ['zvvytqmfe4orhi45k75278wel'],
                        createdAt: now,
                    },
                    {
                        id: 'xk0o7g6f7rraatqucvbiussmd',
                        name: 'activity_log_subject_id_subject_type_index',
                        unique: false,
                        fieldIds: [
                            'qpuyahkualqltg8bwesy2xkx6',
                            'ehh1993c7675onxybh3f476cs',
                        ],
                        createdAt: now,
                    },
                    {
                        id: 't8e0k3sg3ajh037hbxmaw2cvq',
                        name: 'activity_log_causer_id_causer_type_index',
                        unique: false,
                        fieldIds: [
                            'dy9v51ey1731raepj4b4vpars',
                            'z72ugem30h3hfzosc8kzktdyl',
                        ],
                        createdAt: now,
                    },
                ],
                color: '#9ef07a',
                isView: false,
                isMaterializedView: false,
                createdAt: now,
            },
        ],
        relationships: [],
        dependencies: [],
    },
};
