import { DatabaseType } from '@/lib/domain/database-type';
import type { Template } from '../templates-data';
import image from '@/assets/templates/taggit-db.png';
import imageDark from '@/assets/templates/taggit-db-dark.png';

const now = Date.now();

export const taggitDb: Template = {
    slug: 'taggit-database',
    name: 'Taggit',
    shortDescription: 'Simple tagging for django',
    description:
        'Django-taggit adds simple tagging to Django models via TaggableManager, perfect for content categorization.',
    image,
    imageDark,
    tags: ['Postgres', 'Python', 'Django'],
    featured: true,
    url: 'https://github.com/jazzband/django-taggit',
    diagram: {
        id: 'taggit_db',
        name: 'taggit-database',
        createdAt: new Date(),
        updatedAt: new Date(),
        databaseType: DatabaseType.POSTGRESQL,
        tables: [
            {
                id: '0holubg8i1uulaw3lic1rygkx',
                name: 'taggit_taggeditem',
                schema: 'public',
                x: 500,
                y: 100,
                fields: [
                    {
                        id: 'ltcc5pkb4ooq63foi63gdtb3c',
                        name: 'id',
                        type: {
                            id: 'integer',
                            name: 'integer',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: 'pup36l9w97keiae4vfw56igsb',
                        name: 'tag_id',
                        type: {
                            id: 'integer',
                            name: 'integer',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: '19dp43bm6ux6lus333j9sny6x',
                        name: 'content_type_id',
                        type: {
                            id: 'integer',
                            name: 'integer',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: 'w9yfpzpeupxjgzw65o4zf04qf',
                        name: 'object_id',
                        type: {
                            id: 'integer',
                            name: 'integer',
                        },
                        primaryKey: false,
                        unique: false,
                        nullable: false,
                        createdAt: now,
                    },
                ],
                indexes: [
                    {
                        id: '3sxkkcnm9lvfx6l3sc30rq147',
                        name: 'taggit_taggeditem_object_id_index',
                        unique: false,
                        fieldIds: ['w9yfpzpeupxjgzw65o4zf04qf'],
                        createdAt: now,
                    },
                    {
                        id: '0jvg6v0k20rgw3mbonj70mine',
                        name: 'taggit_taggeditem_tag_id_index',
                        unique: false,
                        fieldIds: ['pup36l9w97keiae4vfw56igsb'],
                        createdAt: now,
                    },
                    {
                        id: 'l0zz5xoktlxbyeit6jlne9ao2',
                        name: 'taggit_taggeditem_pkey',
                        unique: true,
                        fieldIds: ['ltcc5pkb4ooq63foi63gdtb3c'],
                        createdAt: now,
                    },
                ],
                color: '#42e0c0',
                isView: false,
                isMaterializedView: false,
                createdAt: now,
            },
            {
                id: 'y07r6qa7swxs31geu6evcyaor',
                name: 'taggit_tag',
                schema: 'public',
                x: 100,
                y: 100,
                fields: [
                    {
                        id: 'yqa1ei8zqjiere7ism4x161by',
                        name: 'id',
                        type: {
                            id: 'integer',
                            name: 'integer',
                        },
                        primaryKey: true,
                        unique: true,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: 'z3ybcuhf577pxfxprhbio3376',
                        name: 'name',
                        type: {
                            id: 'character_varying',
                            name: 'character varying',
                        },
                        primaryKey: false,
                        unique: true,
                        nullable: false,
                        createdAt: now,
                    },
                    {
                        id: 'bqigt5quu06yv8m8ocb6acp81',
                        name: 'slug',
                        type: {
                            id: 'character_varying',
                            name: 'character varying',
                        },
                        primaryKey: false,
                        unique: true,
                        nullable: false,
                        createdAt: now,
                    },
                ],
                indexes: [
                    {
                        id: 'wfcg2lyomssv39fllfdfs8yqy',
                        name: 'taggit_tag_slug_unique',
                        unique: true,
                        fieldIds: ['bqigt5quu06yv8m8ocb6acp81'],
                        createdAt: now,
                    },
                    {
                        id: 'cta41zix0hvmckn4opnr3f960',
                        name: 'taggit_tag_name_unique',
                        unique: true,
                        fieldIds: ['z3ybcuhf577pxfxprhbio3376'],
                        createdAt: now,
                    },
                    {
                        id: '32fplxrl5adx6fj9m8e718fvm',
                        name: 'taggit_tag_pkey',
                        unique: true,
                        fieldIds: ['yqa1ei8zqjiere7ism4x161by'],
                        createdAt: now,
                    },
                ],
                color: '#42e0c0',
                isView: false,
                isMaterializedView: false,
                createdAt: now,
            },
        ],
        relationships: [
            {
                id: '6lmfxfk9n2acc4f9pb32ywbnj',
                name: 'taggit_taggeditem_tag_id_foreign',
                sourceSchema: 'public',
                targetSchema: 'public',
                sourceTableId: '0holubg8i1uulaw3lic1rygkx',
                targetTableId: 'y07r6qa7swxs31geu6evcyaor',
                sourceFieldId: 'pup36l9w97keiae4vfw56igsb',
                targetFieldId: 'yqa1ei8zqjiere7ism4x161by',
                sourceCardinality: 'many',
                targetCardinality: 'one',
                createdAt: now,
            },
        ],
        dependencies: [],
    },
};
