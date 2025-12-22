/**
 * Shared type definitions for cross-dialect SQL export.
 * These types are used across all source→target dialect mappings.
 */

/**
 * Represents a type mapping from a source database type to a target type.
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

/**
 * A table of type mappings keyed by source type name.
 */
export type TypeMappingTable = Record<string, TypeMapping>;

/**
 * Represents an index type mapping from source to target database.
 */
export interface IndexTypeMapping {
    /** The target index type name */
    targetType: string;
    /** Optional note about the conversion */
    note?: string;
}

/**
 * A table of index type mappings keyed by source index type.
 */
export type IndexTypeMappingTable = Record<string, IndexTypeMapping>;
