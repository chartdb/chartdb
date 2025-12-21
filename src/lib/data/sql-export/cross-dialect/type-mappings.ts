/**
 * Type mappings for deterministic cross-dialect SQL export.
 * Maps PostgreSQL types to MySQL and SQL Server equivalents.
 */

export interface TypeMapping {
    /** The target database type name */
    targetType: string;
    /** Optional comment/warning about the conversion */
    conversionNote?: string;
    /** Whether the original type info should be included as inline comment */
    includeInlineComment?: boolean;
    /** For types that need length specification */
    defaultLength?: number;
    /** For types that need precision */
    defaultPrecision?: number;
    /** For types that need scale */
    defaultScale?: number;
}

export type TypeMappingTable = Record<string, TypeMapping>;

/**
 * PostgreSQL to MySQL type mappings
 */
export const postgresqlToMySQL: TypeMappingTable = {
    // Integer types
    int: { targetType: 'INT' },
    int4: { targetType: 'INT' },
    integer: { targetType: 'INT' },
    smallint: { targetType: 'SMALLINT' },
    int2: { targetType: 'SMALLINT' },
    bigint: { targetType: 'BIGINT' },
    int8: { targetType: 'BIGINT' },

    // Serial types (auto-increment) - handled specially in exporter
    serial: { targetType: 'INT' },
    smallserial: { targetType: 'SMALLINT' },
    bigserial: { targetType: 'BIGINT' },

    // Floating point types
    real: { targetType: 'FLOAT' },
    float4: { targetType: 'FLOAT' },
    'double precision': { targetType: 'DOUBLE' },
    float8: { targetType: 'DOUBLE' },
    float: { targetType: 'DOUBLE' },

    // Decimal/Numeric types
    decimal: { targetType: 'DECIMAL', defaultPrecision: 10, defaultScale: 2 },
    numeric: { targetType: 'DECIMAL', defaultPrecision: 10, defaultScale: 2 },
    money: {
        targetType: 'DECIMAL',
        defaultPrecision: 19,
        defaultScale: 4,
        conversionNote: 'PostgreSQL money type converted to DECIMAL(19,4)',
        includeInlineComment: true,
    },

    // Character types
    char: { targetType: 'CHAR', defaultLength: 1 },
    character: { targetType: 'CHAR', defaultLength: 1 },
    varchar: { targetType: 'VARCHAR', defaultLength: 255 },
    'character varying': { targetType: 'VARCHAR', defaultLength: 255 },
    text: { targetType: 'TEXT' },
    name: { targetType: 'VARCHAR', defaultLength: 63 },

    // Binary types
    bytea: {
        targetType: 'LONGBLOB',
        conversionNote: 'PostgreSQL bytea converted to LONGBLOB',
        includeInlineComment: true,
    },

    // Boolean type
    boolean: { targetType: 'TINYINT(1)' },
    bool: { targetType: 'TINYINT(1)' },

    // Date/Time types
    date: { targetType: 'DATE' },
    time: { targetType: 'TIME' },
    timetz: {
        targetType: 'TIME',
        conversionNote: 'Time zone information lost in conversion',
        includeInlineComment: true,
    },
    'time with time zone': {
        targetType: 'TIME',
        conversionNote: 'Time zone information lost in conversion',
        includeInlineComment: true,
    },
    'time without time zone': { targetType: 'TIME' },
    timestamp: { targetType: 'DATETIME' },
    timestamptz: {
        targetType: 'DATETIME',
        conversionNote: 'Time zone information lost in conversion',
        includeInlineComment: true,
    },
    'timestamp with time zone': {
        targetType: 'DATETIME',
        conversionNote: 'Time zone information lost in conversion',
        includeInlineComment: true,
    },
    'timestamp without time zone': { targetType: 'DATETIME' },
    interval: {
        targetType: 'VARCHAR',
        defaultLength: 100,
        conversionNote:
            'PostgreSQL interval type has no MySQL equivalent, stored as string',
        includeInlineComment: true,
    },

    // JSON types
    json: { targetType: 'JSON' },
    jsonb: {
        targetType: 'JSON',
        conversionNote:
            'JSONB binary optimizations not available in MySQL JSON',
        includeInlineComment: true,
    },

    // UUID type
    uuid: {
        targetType: 'CHAR',
        defaultLength: 36,
        conversionNote: 'UUID stored as CHAR(36)',
        includeInlineComment: true,
    },

    // Network types
    inet: {
        targetType: 'VARCHAR',
        defaultLength: 45,
        conversionNote: 'PostgreSQL inet type converted to VARCHAR',
        includeInlineComment: true,
    },
    cidr: {
        targetType: 'VARCHAR',
        defaultLength: 45,
        conversionNote: 'PostgreSQL cidr type converted to VARCHAR',
        includeInlineComment: true,
    },
    macaddr: {
        targetType: 'VARCHAR',
        defaultLength: 17,
        conversionNote: 'PostgreSQL macaddr type converted to VARCHAR',
        includeInlineComment: true,
    },
    macaddr8: {
        targetType: 'VARCHAR',
        defaultLength: 23,
        conversionNote: 'PostgreSQL macaddr8 type converted to VARCHAR',
        includeInlineComment: true,
    },

    // Bit string types
    bit: { targetType: 'BIT', defaultLength: 1 },
    varbit: { targetType: 'BIT', defaultLength: 64 },
    'bit varying': { targetType: 'BIT', defaultLength: 64 },

    // Geometric types (MySQL has partial support)
    point: { targetType: 'POINT' },
    line: {
        targetType: 'LINESTRING',
        conversionNote: 'PostgreSQL infinite line converted to LINESTRING',
        includeInlineComment: true,
    },
    lseg: { targetType: 'LINESTRING' },
    box: { targetType: 'POLYGON' },
    path: { targetType: 'LINESTRING' },
    polygon: { targetType: 'POLYGON' },
    circle: {
        targetType: 'POLYGON',
        conversionNote: 'PostgreSQL circle approximated as POLYGON',
        includeInlineComment: true,
    },
    geometry: { targetType: 'GEOMETRY' },
    geography: { targetType: 'GEOMETRY' },

    // Text search types (no MySQL equivalent)
    tsvector: {
        targetType: 'TEXT',
        conversionNote:
            'PostgreSQL full-text search type has no MySQL equivalent',
        includeInlineComment: true,
    },
    tsquery: {
        targetType: 'TEXT',
        conversionNote:
            'PostgreSQL full-text search type has no MySQL equivalent',
        includeInlineComment: true,
    },

    // Range types (no MySQL equivalent)
    int4range: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL range type stored as JSON [lower, upper]',
        includeInlineComment: true,
    },
    int8range: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL range type stored as JSON [lower, upper]',
        includeInlineComment: true,
    },
    numrange: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL range type stored as JSON [lower, upper]',
        includeInlineComment: true,
    },
    tsrange: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL range type stored as JSON [lower, upper]',
        includeInlineComment: true,
    },
    tstzrange: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL range type stored as JSON [lower, upper]',
        includeInlineComment: true,
    },
    daterange: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL range type stored as JSON [lower, upper]',
        includeInlineComment: true,
    },

    // OID and system types
    oid: { targetType: 'INT UNSIGNED' },
    regproc: { targetType: 'VARCHAR', defaultLength: 255 },
    regprocedure: { targetType: 'VARCHAR', defaultLength: 255 },
    regoper: { targetType: 'VARCHAR', defaultLength: 255 },
    regoperator: { targetType: 'VARCHAR', defaultLength: 255 },
    regclass: { targetType: 'VARCHAR', defaultLength: 255 },
    regtype: { targetType: 'VARCHAR', defaultLength: 255 },
    regrole: { targetType: 'VARCHAR', defaultLength: 255 },
    regnamespace: { targetType: 'VARCHAR', defaultLength: 255 },
    regconfig: { targetType: 'VARCHAR', defaultLength: 255 },
    regdictionary: { targetType: 'VARCHAR', defaultLength: 255 },

    // XML type
    xml: {
        targetType: 'TEXT',
        conversionNote: 'PostgreSQL XML type converted to TEXT',
        includeInlineComment: true,
    },

    // User-defined and array types (handled specially)
    'user-defined': {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL custom type converted to JSON',
        includeInlineComment: true,
    },
    array: {
        targetType: 'JSON',
        conversionNote: 'PostgreSQL array type converted to JSON',
        includeInlineComment: true,
    },

    // Enum type (handled specially, but fallback here)
    enum: {
        targetType: 'VARCHAR',
        defaultLength: 255,
        conversionNote: 'PostgreSQL ENUM converted to VARCHAR',
        includeInlineComment: true,
    },
};

/**
 * PostgreSQL to SQL Server type mappings
 */
export const postgresqlToSQLServer: TypeMappingTable = {
    // Integer types
    int: { targetType: 'INT' },
    int4: { targetType: 'INT' },
    integer: { targetType: 'INT' },
    smallint: { targetType: 'SMALLINT' },
    int2: { targetType: 'SMALLINT' },
    bigint: { targetType: 'BIGINT' },
    int8: { targetType: 'BIGINT' },

    // Serial types - handled specially with IDENTITY
    serial: { targetType: 'INT' },
    smallserial: { targetType: 'SMALLINT' },
    bigserial: { targetType: 'BIGINT' },

    // Floating point types
    real: { targetType: 'REAL' },
    float4: { targetType: 'REAL' },
    'double precision': { targetType: 'FLOAT' },
    float8: { targetType: 'FLOAT' },
    float: { targetType: 'FLOAT' },

    // Decimal/Numeric types
    decimal: { targetType: 'DECIMAL', defaultPrecision: 18, defaultScale: 2 },
    numeric: { targetType: 'NUMERIC', defaultPrecision: 18, defaultScale: 2 },
    money: { targetType: 'MONEY' },

    // Character types
    char: { targetType: 'CHAR', defaultLength: 1 },
    character: { targetType: 'CHAR', defaultLength: 1 },
    varchar: { targetType: 'VARCHAR', defaultLength: 255 },
    'character varying': { targetType: 'VARCHAR', defaultLength: 255 },
    text: { targetType: 'NVARCHAR(MAX)' },
    name: { targetType: 'NVARCHAR', defaultLength: 128 },

    // Binary types
    bytea: { targetType: 'VARBINARY(MAX)' },

    // Boolean type
    boolean: { targetType: 'BIT' },
    bool: { targetType: 'BIT' },

    // Date/Time types
    date: { targetType: 'DATE' },
    time: { targetType: 'TIME' },
    timetz: {
        targetType: 'TIME',
        conversionNote: 'Time zone offset not preserved',
        includeInlineComment: true,
    },
    'time with time zone': {
        targetType: 'TIME',
        conversionNote: 'Time zone offset not preserved',
        includeInlineComment: true,
    },
    'time without time zone': { targetType: 'TIME' },
    timestamp: { targetType: 'DATETIME2' },
    timestamptz: { targetType: 'DATETIMEOFFSET' },
    'timestamp with time zone': { targetType: 'DATETIMEOFFSET' },
    'timestamp without time zone': { targetType: 'DATETIME2' },
    interval: {
        targetType: 'NVARCHAR',
        defaultLength: 100,
        conversionNote:
            'PostgreSQL interval type has no SQL Server equivalent, stored as string',
        includeInlineComment: true,
    },

    // JSON types
    json: { targetType: 'NVARCHAR(MAX)' },
    jsonb: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'JSON stored as NVARCHAR(MAX). Use ISJSON() for validation, JSON functions for querying.',
        includeInlineComment: true,
    },

    // UUID type
    uuid: { targetType: 'UNIQUEIDENTIFIER' },

    // Network types
    inet: {
        targetType: 'NVARCHAR',
        defaultLength: 45,
        conversionNote: 'PostgreSQL inet type converted to NVARCHAR',
        includeInlineComment: true,
    },
    cidr: {
        targetType: 'NVARCHAR',
        defaultLength: 45,
        conversionNote: 'PostgreSQL cidr type converted to NVARCHAR',
        includeInlineComment: true,
    },
    macaddr: {
        targetType: 'NVARCHAR',
        defaultLength: 17,
        conversionNote: 'PostgreSQL macaddr type converted to NVARCHAR',
        includeInlineComment: true,
    },
    macaddr8: {
        targetType: 'NVARCHAR',
        defaultLength: 23,
        conversionNote: 'PostgreSQL macaddr8 type converted to NVARCHAR',
        includeInlineComment: true,
    },

    // Bit string types
    bit: { targetType: 'BIT' },
    varbit: {
        targetType: 'VARBINARY',
        defaultLength: 64,
        conversionNote: 'Variable bit string converted to VARBINARY',
        includeInlineComment: true,
    },
    'bit varying': {
        targetType: 'VARBINARY',
        defaultLength: 64,
        conversionNote: 'Variable bit string converted to VARBINARY',
        includeInlineComment: true,
    },

    // Geometric types
    point: { targetType: 'GEOMETRY' },
    line: { targetType: 'GEOMETRY' },
    lseg: { targetType: 'GEOMETRY' },
    box: { targetType: 'GEOMETRY' },
    path: { targetType: 'GEOMETRY' },
    polygon: { targetType: 'GEOMETRY' },
    circle: {
        targetType: 'GEOMETRY',
        conversionNote: 'Circle represented as geometry point with radius',
        includeInlineComment: true,
    },
    geometry: { targetType: 'GEOMETRY' },
    geography: { targetType: 'GEOGRAPHY' },

    // Text search types (no direct equivalent)
    tsvector: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL full-text search. Use SQL Server Full-Text Search instead.',
        includeInlineComment: true,
    },
    tsquery: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL full-text search. Use SQL Server Full-Text Search instead.',
        includeInlineComment: true,
    },

    // Range types (no SQL Server equivalent)
    int4range: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL range type. Consider using two columns for lower/upper bounds.',
        includeInlineComment: true,
    },
    int8range: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL range type. Consider using two columns for lower/upper bounds.',
        includeInlineComment: true,
    },
    numrange: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL range type. Consider using two columns for lower/upper bounds.',
        includeInlineComment: true,
    },
    tsrange: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL range type. Consider using two columns for lower/upper bounds.',
        includeInlineComment: true,
    },
    tstzrange: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL range type. Consider using two columns for lower/upper bounds.',
        includeInlineComment: true,
    },
    daterange: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL range type. Consider using two columns for lower/upper bounds.',
        includeInlineComment: true,
    },

    // OID and system types
    oid: { targetType: 'INT' },
    regproc: { targetType: 'NVARCHAR', defaultLength: 255 },
    regprocedure: { targetType: 'NVARCHAR', defaultLength: 255 },
    regoper: { targetType: 'NVARCHAR', defaultLength: 255 },
    regoperator: { targetType: 'NVARCHAR', defaultLength: 255 },
    regclass: { targetType: 'NVARCHAR', defaultLength: 255 },
    regtype: { targetType: 'NVARCHAR', defaultLength: 255 },
    regrole: { targetType: 'NVARCHAR', defaultLength: 255 },
    regnamespace: { targetType: 'NVARCHAR', defaultLength: 255 },
    regconfig: { targetType: 'NVARCHAR', defaultLength: 255 },
    regdictionary: { targetType: 'NVARCHAR', defaultLength: 255 },

    // XML type
    xml: { targetType: 'XML' },

    // User-defined and array types
    'user-defined': {
        targetType: 'NVARCHAR(MAX)',
        conversionNote: 'PostgreSQL custom type converted to NVARCHAR(MAX)',
        includeInlineComment: true,
    },
    array: {
        targetType: 'NVARCHAR(MAX)',
        conversionNote:
            'PostgreSQL array converted to NVARCHAR(MAX) as JSON array',
        includeInlineComment: true,
    },

    // Enum type (handled specially)
    enum: {
        targetType: 'NVARCHAR',
        defaultLength: 255,
        conversionNote: 'PostgreSQL ENUM converted to NVARCHAR',
        includeInlineComment: true,
    },
};

/**
 * Index type mappings from PostgreSQL to MySQL
 */
export const postgresqlIndexTypeToMySQL: Record<
    string,
    { targetType: string; note?: string }
> = {
    btree: { targetType: 'BTREE' },
    hash: { targetType: 'HASH' },
    gin: {
        targetType: 'BTREE',
        note: 'GIN index downgraded to BTREE (MySQL does not support GIN)',
    },
    gist: {
        targetType: 'BTREE',
        note: 'GiST index downgraded to BTREE (MySQL does not support GiST)',
    },
    spgist: {
        targetType: 'BTREE',
        note: 'SP-GiST index downgraded to BTREE (MySQL does not support SP-GiST)',
    },
    brin: {
        targetType: 'BTREE',
        note: 'BRIN index downgraded to BTREE (MySQL does not support BRIN)',
    },
};

/**
 * Index type mappings from PostgreSQL to SQL Server
 */
export const postgresqlIndexTypeToSQLServer: Record<
    string,
    { targetType: string; note?: string }
> = {
    btree: { targetType: 'NONCLUSTERED' },
    hash: {
        targetType: 'NONCLUSTERED',
        note: 'Hash index converted to NONCLUSTERED',
    },
    gin: {
        targetType: 'NONCLUSTERED',
        note: 'GIN index downgraded to NONCLUSTERED. Consider using Full-Text Index.',
    },
    gist: {
        targetType: 'SPATIAL',
        note: 'GiST index converted to SPATIAL (for geometry types) or NONCLUSTERED',
    },
    spgist: {
        targetType: 'NONCLUSTERED',
        note: 'SP-GiST index converted to NONCLUSTERED',
    },
    brin: {
        targetType: 'NONCLUSTERED',
        note: 'BRIN index converted to NONCLUSTERED',
    },
    clustered: { targetType: 'CLUSTERED' },
    nonclustered: { targetType: 'NONCLUSTERED' },
};

/**
 * Get the type mapping for a PostgreSQL type to a target dialect
 */
export function getTypeMapping(
    postgresType: string,
    targetDialect: 'mysql' | 'sqlserver'
): TypeMapping | undefined {
    const normalizedType = postgresType.toLowerCase().trim();

    // Check for array types
    if (normalizedType.endsWith('[]')) {
        return targetDialect === 'mysql'
            ? postgresqlToMySQL['array']
            : postgresqlToSQLServer['array'];
    }

    const mappingTable =
        targetDialect === 'mysql' ? postgresqlToMySQL : postgresqlToSQLServer;
    return mappingTable[normalizedType];
}

/**
 * Get fallback type mapping when no explicit mapping exists
 */
export function getFallbackTypeMapping(
    targetDialect: 'mysql' | 'sqlserver'
): TypeMapping {
    return targetDialect === 'mysql'
        ? {
              targetType: 'TEXT',
              conversionNote: 'Unknown PostgreSQL type converted to TEXT',
              includeInlineComment: true,
          }
        : {
              targetType: 'NVARCHAR(MAX)',
              conversionNote:
                  'Unknown PostgreSQL type converted to NVARCHAR(MAX)',
              includeInlineComment: true,
          };
}
