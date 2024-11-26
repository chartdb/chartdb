import { DatabaseType } from '@/lib/domain/database-type';
import type { Template } from '../templates-data';
import image from '@/assets/templates/orchid-db.png';
import imageDark from '@/assets/templates/orchid-db-dark.png';

export const orchidDb: Template = {
    slug: 'orchid-database',
    name: 'Orchid',
    shortDescription: 'Back-Office platform',
    description:
        'A Laravel package of back-office applications, admin/user panels, and dashboards.',
    image,
    imageDark,
    tags: ['Postgres', 'Open Source', 'Laravel', 'PHP'],
    featured: false,
    url: 'https://drawsql.app/templates/orchid',
    diagram: {
        id: 'orchid_db',
        name: 'orchid-database',
        createdAt: new Date(),
        updatedAt: new Date(),
        databaseType: DatabaseType.MYSQL,
        tables: [
            {
                id: '71fdxo9ncuj7j5h7p6z6p9wnk',
                name: 'attachments',
                schema: 't_orchid_db',
                x: -300,
                y: -100,
                fields: [
                    {
                        id: 'lgqpeo3tbu1ct5pqhaxx55b89',
                        name: 'id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'rrbw2jsbum3w6wug0b6hklmwo',
                        name: 'name',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'g48tjszq4p6el5rhwvyap3tkh',
                        name: 'original_name',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: '8okobzkdj9tb5flnm0sfjy3a5',
                        name: 'mime',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'mzzwbs0cvccejkdx2k3bxsvdv',
                        name: 'extension',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'ln2eh4bgj75a8wxm8tknc7krm',
                        name: 'size',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: '2blffmjau84s7lnnezad60638',
                        name: 'sort',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'wdlk5dhteq4h0tpt4sg2cwx7l',
                        name: 'path',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'vmibvvuhrzhzsdim04py8vt4i',
                        name: 'description',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'j2yt3hgfb5m5s25edc5g5p5dg',
                        name: 'alt',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'te2zpzw69y1hhvfeuj2mtm5z5',
                        name: 'hash',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 's4zt7i83jodx4sndx3tzxh3fx',
                        name: 'disk',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: '8zlf2ojsc5d7rboguwayfh5ha',
                        name: 'user_id',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: '5kbdynhu49e7luliyivevxnq6',
                        name: 'group',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 't2u1d50oxcil6chubqztufibn',
                        name: 'created_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'neh7szkld37h2uphiq5f7uyus',
                        name: 'updated_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: '2a60016w71sw1z4rqmytwdcyv',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['lgqpeo3tbu1ct5pqhaxx55b89'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#7175fa',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
            {
                id: '9e8wgcnlgadlwq88ab7x42nfw',
                name: 'attachmentable',
                schema: 't_orchid_db',
                x: 81.76538577755491,
                y: -137.56299254753986,
                fields: [
                    {
                        id: 'lze7awwqh7cmfges7j9gss7ld',
                        name: 'id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'fv8i1bjy7y9ohds8uo6r9cvjk',
                        name: 'attachmentable_type',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: '0bga9idieaely6byav6lg86vj',
                        name: 'attachmentable_id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: '08vow7auknmbt4vd35dw5sr64',
                        name: 'attachment_id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: 'ih5u7wxqgqvtbdd73oflxp4zt',
                        name: 'attachmentable_attachment_id_index',
                        unique: false,
                        fieldIds: ['08vow7auknmbt4vd35dw5sr64'],
                        createdAt: Date.now(),
                    },
                    {
                        id: 'mx4r0qb2v3hc1n71pbb0lwebh',
                        name: 'attachmentable_attachmentable_type_attachmentable_id_index',
                        unique: false,
                        fieldIds: [
                            'fv8i1bjy7y9ohds8uo6r9cvjk',
                            '0bga9idieaely6byav6lg86vj',
                        ],
                        createdAt: Date.now(),
                    },
                    {
                        id: 'drk9jmopuds3h36hx6sxhdklx',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['lze7awwqh7cmfges7j9gss7ld'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#42e0c0',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
            {
                id: 'i4ieeqk4511ri623n7vtmjxkg',
                name: 'settings',
                schema: 't_orchid_db',
                x: 400,
                y: 600,
                fields: [
                    {
                        id: 'whig3jtfp4hszl69aeshnz5e4',
                        name: 'key',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: '9hd4t4x8qdorb0zgh5zy7ks45',
                        name: 'value',
                        type: {
                            id: 'json',
                            name: 'json',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: 'pk0ua9dy2pzhhlvr9jaygjbpx',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['whig3jtfp4hszl69aeshnz5e4'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#42e0c0',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
            {
                id: 'k027uir0ao6l8fpw7d1ay3qft',
                name: 'notifications',
                schema: 't_orchid_db',
                x: 500,
                y: 100,
                fields: [
                    {
                        id: '01cotfakdw7iunarpuc1eqwnr',
                        name: 'id',
                        type: {
                            id: 'char',
                            name: 'char',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'l1253c6f5nyaajfignk776qnv',
                        name: 'type',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'e357s9a7q59z4lj4563k0ov70',
                        name: 'notifiable_type',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'hmro9cstbl7pvzyb0ueej38b7',
                        name: 'notifiable_id',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'r8jlzknygzkspqwyekdofonjq',
                        name: 'data',
                        type: {
                            id: 'text',
                            name: 'text',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '65535',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'slwb1sbiid5xuxs8zwtrhgw1c',
                        name: 'read_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'o4rmhz6ze2p1fwzvvmsn0ey4a',
                        name: 'created_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: '97zmk1w819jwuyvs2sthe1mew',
                        name: 'updated_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: '3xbo7enpv4t1dxbdelfmd606o',
                        name: 'notifications_notifiable_id_foreign',
                        unique: false,
                        fieldIds: ['hmro9cstbl7pvzyb0ueej38b7'],
                        createdAt: Date.now(),
                    },
                    {
                        id: 'ng4t2jdsmi3lpmkzg6nw7odzk',
                        name: 'notifications_notifiable_type_notifiable_id_index',
                        unique: false,
                        fieldIds: [
                            'e357s9a7q59z4lj4563k0ov70',
                            'hmro9cstbl7pvzyb0ueej38b7',
                        ],
                        createdAt: Date.now(),
                    },
                    {
                        id: 'krsfpt88k3qjdhn6uq778yu0g',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['01cotfakdw7iunarpuc1eqwnr'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#ff6363',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
            {
                id: 'p3j1u8r3xxv3p3wsqexn7rovb',
                name: 'roles',
                schema: 't_orchid_db',
                x: 100.00000000000003,
                y: 550,
                fields: [
                    {
                        id: 'o4hh7mgjf9ee94is4ynwyo5zj',
                        name: 'id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: '9ukanv6p7mwd4rupjwl3d8hku',
                        name: 'slug',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: true,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'vm2tdqrqzce99h90umbh05pi1',
                        name: 'name',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'w0m3b817zkfsp7las0peu5y2r',
                        name: 'permissions',
                        type: {
                            id: 'json',
                            name: 'json',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'trnigyvttxywsqy1cqenqyaw6',
                        name: 'created_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'gpx1i0t8e6hwqf3nnlgl7rtw6',
                        name: 'updated_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: 'zyx6khmt3g9pd3vev5bpjo4yh',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['o4hh7mgjf9ee94is4ynwyo5zj'],
                        createdAt: Date.now(),
                    },
                    {
                        id: 'qcr373xl5gjq2rothmvoajo2a',
                        name: 'roles_slug_unique',
                        unique: true,
                        fieldIds: ['9ukanv6p7mwd4rupjwl3d8hku'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#b067e9',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
            {
                id: 'wwy772ru0zkg4ljct6pjwl91s',
                name: 'role_users',
                schema: 't_orchid_db',
                x: -320,
                y: 420,
                fields: [
                    {
                        id: 'iuwqr7fw84fgxarlqkmq2bnh3',
                        name: 'user_id',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: true,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'vyqpj645b1dc0txxmhyc5ie23',
                        name: 'role_id',
                        type: {
                            id: 'int',
                            name: 'int',
                        },
                        primaryKey: true,
                        unique: false,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: 'xx8ukrey4gim3jwfs56zfeicg',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: [
                            'iuwqr7fw84fgxarlqkmq2bnh3',
                            'vyqpj645b1dc0txxmhyc5ie23',
                        ],
                        createdAt: Date.now(),
                    },
                    {
                        id: 't344ymg5cjfiny4p39i9vwh3x',
                        name: 'role_users_role_id_index',
                        unique: false,
                        fieldIds: ['vyqpj645b1dc0txxmhyc5ie23'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#b067e9',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
            {
                id: 'ydbfacxlwhodoy9nnzbkdkf0g',
                name: 'users',
                schema: 't_orchid_db',
                x: 100,
                y: 100,
                fields: [
                    {
                        id: 'o1n4ty6ymyi41gbfhcqwppa3p',
                        name: 'id',
                        type: {
                            id: 'bigint',
                            name: 'bigint',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'kmea6u19ghgwduvtgkh05tgoq',
                        name: 'name',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'ozi31o0p9ow8epliom949x01e',
                        name: 'email',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: true,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'o24szb7w4t8ngzzwzgmito21m',
                        name: 'email_verified_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: '6kdn1ktgx3wv8tv5nnmeapypg',
                        name: 'password',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'u16gkd45jpwec0cc9uiky7622',
                        name: 'remember_token',
                        type: {
                            id: 'varchar',
                            name: 'varchar',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        character_maximum_length: '255',
                        collation: 'utf8mb4_0900_ai_ci',
                        createdAt: Date.now(),
                    },
                    {
                        id: 'u36wia3c8hjb1yww5dv86rn21',
                        name: 'created_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'e18csiyrk41qa9xlninw797re',
                        name: 'updated_at',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: '9k4lt1xa7dps1sajhcncr4j5k',
                        name: 'last_login',
                        type: {
                            id: 'timestamp',
                            name: 'timestamp',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                    {
                        id: 'i00i6og4e1xk0bb1s005ovg3r',
                        name: 'permissions',
                        type: {
                            id: 'json',
                            name: 'json',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: true,
                        createdAt: Date.now(),
                    },
                ],
                indexes: [
                    {
                        id: 'mj4rijed0zqbtmvh51lnw5bau',
                        name: 'PRIMARY',
                        unique: true,
                        fieldIds: ['o1n4ty6ymyi41gbfhcqwppa3p'],
                        createdAt: Date.now(),
                    },
                    {
                        id: 'qwygfkmk6e8fz6emzeyk4bmay',
                        name: 'users_email_unique',
                        unique: true,
                        fieldIds: ['ozi31o0p9ow8epliom949x01e'],
                        createdAt: Date.now(),
                    },
                ],
                color: '#42e0c0',
                isView: false,
                isMaterializedView: false,
                createdAt: Date.now(),
            },
        ],
        relationships: [
            {
                id: 'dbrx24i66861hxrwxaba3jaee',
                name: 'attachmentable_attachment_id_foreign',
                sourceSchema: 't_orchid_db',
                targetSchema: 't_orchid_db',
                sourceTableId: '9e8wgcnlgadlwq88ab7x42nfw',
                targetTableId: '71fdxo9ncuj7j5h7p6z6p9wnk',
                sourceFieldId: '08vow7auknmbt4vd35dw5sr64',
                targetFieldId: 'lgqpeo3tbu1ct5pqhaxx55b89',
                sourceCardinality: 'many',
                targetCardinality: 'one',
                createdAt: Date.now(),
            },
            {
                id: 'ehglrbddna888qzcrhz0u9zxm',
                name: 'role_users_user_id_foreign',
                sourceSchema: 't_orchid_db',
                targetSchema: 't_orchid_db',
                sourceTableId: 'wwy772ru0zkg4ljct6pjwl91s',
                targetTableId: 'ydbfacxlwhodoy9nnzbkdkf0g',
                sourceFieldId: 'iuwqr7fw84fgxarlqkmq2bnh3',
                targetFieldId: 'o1n4ty6ymyi41gbfhcqwppa3p',
                sourceCardinality: 'many',
                targetCardinality: 'one',
                createdAt: Date.now(),
            },
            {
                id: 'qynjlszbi8qiflgjvbvd6pkjc',
                name: 'notifications_notifiable_id_foreign',
                sourceSchema: 't_orchid_db',
                targetSchema: 't_orchid_db',
                sourceTableId: 'k027uir0ao6l8fpw7d1ay3qft',
                targetTableId: 'ydbfacxlwhodoy9nnzbkdkf0g',
                sourceFieldId: 'hmro9cstbl7pvzyb0ueej38b7',
                targetFieldId: 'o1n4ty6ymyi41gbfhcqwppa3p',
                sourceCardinality: 'many',
                targetCardinality: 'one',
                createdAt: Date.now(),
            },
            {
                id: 'x3inmacyjmf8y1mvq2j1w6phd',
                name: 'role_users_role_id_foreign',
                sourceSchema: 't_orchid_db',
                targetSchema: 't_orchid_db',
                sourceTableId: 'wwy772ru0zkg4ljct6pjwl91s',
                targetTableId: 'p3j1u8r3xxv3p3wsqexn7rovb',
                sourceFieldId: 'vyqpj645b1dc0txxmhyc5ie23',
                targetFieldId: 'o4hh7mgjf9ee94is4ynwyo5zj',
                sourceCardinality: 'many',
                targetCardinality: 'one',
                createdAt: Date.now(),
            },
        ],
        dependencies: [],
    },
};
