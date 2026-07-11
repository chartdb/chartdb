import { z } from 'zod';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBField } from '@/lib/domain/db-field';
import type { DBRelationship, Cardinality } from '@/lib/domain/db-relationship';
import { generateId } from '@/lib/utils';
import { defaultTableColor } from '@/lib/colors';
import { schemaNameToDomainSchemaName } from '@/lib/domain/db-schema';
import { dataTypeMap, type DataType } from '@/lib/data/data-types/data-types';
import { genericDataTypes } from '@/lib/data/data-types/generic-data-types';
import type { DatabaseType } from '@/lib/domain/database-type';
import { createLLMModel } from './llm-client';

// ---------------------------------------------------------------------------
// Schema the LLM must return. Kept intentionally flat and name-based so the
// model can reference existing elements reliably. Ids are optional: the model
// echoes them for elements it is keeping, and leaves them blank for new ones.
// ---------------------------------------------------------------------------

const aiFieldSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    type: z.string().describe('SQL data type name, e.g. "varchar", "integer"'),
    primaryKey: z.boolean().optional(),
    unique: z.boolean().optional(),
    nullable: z.boolean().optional(),
    comments: z.string().optional(),
});

const aiTableSchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    schema: z.string().optional(),
    color: z.string().optional().describe('Hex color, e.g. "#4dee8a"'),
    x: z.number().optional(),
    y: z.number().optional(),
    comments: z.string().optional(),
    fields: z.array(aiFieldSchema),
});

const aiRelationshipSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    sourceTable: z.string(),
    sourceField: z.string(),
    targetTable: z.string(),
    targetField: z.string(),
    sourceCardinality: z.enum(['one', 'many']).optional(),
    targetCardinality: z.enum(['one', 'many']).optional(),
});

export const aiDiagramSchema = z.object({
    tables: z.array(aiTableSchema),
    relationships: z.array(aiRelationshipSchema),
});

export type AIDiagram = z.infer<typeof aiDiagramSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tableKey = (schema: string | null | undefined, name: string): string =>
    `${schemaNameToDomainSchemaName(schema) ?? ''}.${name.toLowerCase()}`;

// Resolve a free-text type name to a valid DataType for the database.
const resolveDataType = (
    typeName: string,
    databaseType: DatabaseType
): DataType => {
    const normalized = typeName.trim().toLowerCase();
    const candidates = dataTypeMap[databaseType] ?? [];
    const match =
        candidates.find((t) => t.name.toLowerCase() === normalized) ??
        candidates.find((t) => t.id.toLowerCase() === normalized);
    if (match) {
        return { id: match.id, name: match.name };
    }
    // Fall back to the generic type list, then to a raw type object.
    const generic =
        genericDataTypes.find((t) => t.name.toLowerCase() === normalized) ??
        genericDataTypes.find((t) => t.id.toLowerCase() === normalized);
    if (generic) {
        return { id: generic.id, name: generic.name };
    }
    return { id: normalized, name: normalized };
};

// Serialize the current diagram compactly (with ids) for the prompt.
const serializeDiagram = (diagram: Diagram): string => {
    const tables = (diagram.tables ?? []).map((t) => ({
        id: t.id,
        name: t.name,
        schema: t.schema ?? undefined,
        color: t.color,
        x: Math.round(t.x),
        y: Math.round(t.y),
        fields: t.fields.map((f) => ({
            id: f.id,
            name: f.name,
            type: f.type.name,
            primaryKey: f.primaryKey,
            unique: f.unique,
            nullable: f.nullable,
        })),
    }));
    const relationships = (diagram.relationships ?? []).map((r) => {
        const sourceTable = diagram.tables?.find(
            (t) => t.id === r.sourceTableId
        );
        const targetTable = diagram.tables?.find(
            (t) => t.id === r.targetTableId
        );
        return {
            id: r.id,
            name: r.name,
            sourceTable: sourceTable?.name,
            sourceField: sourceTable?.fields.find(
                (f) => f.id === r.sourceFieldId
            )?.name,
            targetTable: targetTable?.name,
            targetField: targetTable?.fields.find(
                (f) => f.id === r.targetFieldId
            )?.name,
            sourceCardinality: r.sourceCardinality,
            targetCardinality: r.targetCardinality,
        };
    });
    return JSON.stringify({ tables, relationships }, null, 2);
};

const buildPrompt = (diagram: Diagram, userRequest: string): string => `
You are editing a database ER diagram for the "${diagram.databaseType}" database.
Return the COMPLETE desired diagram after applying the user's request — include
every table and relationship that should exist afterwards, not just the changes.

Rules:
- Preserve the "id" of every table, field and relationship you keep unchanged
  (copy them verbatim from the current diagram). Leave "id" blank for NEW elements.
- To DELETE something, omit it from your response.
- Reference tables and fields by name in relationships.
- Only set "x"/"y" or "color" when the user asks to move or recolor something;
  otherwise leave them out so existing layout/colors are preserved.
- Use data type names valid for ${diagram.databaseType}.

Current diagram:
${serializeDiagram(diagram)}

User request:
${userRequest}
`;

// ---------------------------------------------------------------------------
// Reconcile the LLM output into a full, id-stable Diagram.
// ---------------------------------------------------------------------------

export const reconcileDiagram = (current: Diagram, ai: AIDiagram): Diagram => {
    const databaseType = current.databaseType;
    const existingTables = current.tables ?? [];
    const tablesById = new Map(existingTables.map((t) => [t.id, t]));
    const tablesByKey = new Map(
        existingTables.map((t) => [tableKey(t.schema, t.name), t])
    );

    // Compute a starting position for brand-new tables (to the right of the set).
    let nextNewX =
        existingTables.reduce((max, t) => Math.max(max, t.x), 0) + 300;

    const newTables: DBTable[] = ai.tables.map((aiTable) => {
        const existing =
            (aiTable.id ? tablesById.get(aiTable.id) : undefined) ??
            tablesByKey.get(tableKey(aiTable.schema, aiTable.name));

        const fieldsById = new Map(
            (existing?.fields ?? []).map((f) => [f.id, f])
        );
        const fieldsByName = new Map(
            (existing?.fields ?? []).map((f) => [f.name.toLowerCase(), f])
        );

        const fields: DBField[] = aiTable.fields.map((aiField) => {
            const existingField =
                (aiField.id ? fieldsById.get(aiField.id) : undefined) ??
                fieldsByName.get(aiField.name.toLowerCase());
            return {
                id: existingField?.id ?? generateId(),
                name: aiField.name,
                type: resolveDataType(aiField.type, databaseType),
                primaryKey: aiField.primaryKey ?? false,
                unique: aiField.unique ?? existingField?.unique ?? false,
                nullable: aiField.nullable ?? existingField?.nullable ?? true,
                comments: aiField.comments ?? existingField?.comments,
                createdAt: existingField?.createdAt ?? Date.now(),
            };
        });

        const isNew = !existing;
        const color = aiTable.color ?? existing?.color ?? defaultTableColor;
        const x = isNew ? (aiTable.x ?? nextNewX) : (aiTable.x ?? existing.x);
        const y = isNew ? (aiTable.y ?? 100) : (aiTable.y ?? existing.y);
        if (isNew && aiTable.x === undefined) {
            nextNewX += 300;
        }

        return {
            ...(existing ?? {}),
            id: existing?.id ?? generateId(),
            name: aiTable.name,
            schema: aiTable.schema ?? existing?.schema,
            x,
            y,
            fields,
            indexes: existing?.indexes ?? [],
            color,
            // An AI-provided color is an explicit choice; otherwise keep the
            // table's inheritance behavior.
            isColorCustom: aiTable.color
                ? true
                : (existing?.isColorCustom ?? false),
            isView: existing?.isView ?? false,
            createdAt: existing?.createdAt ?? Date.now(),
            comments: aiTable.comments ?? existing?.comments,
        };
    });

    // Resolve relationships by table/field name against the reconciled tables.
    const findTable = (name: string): DBTable | undefined =>
        newTables.find((t) => t.name.toLowerCase() === name.toLowerCase());
    const existingRels = current.relationships ?? [];

    const newRelationships: DBRelationship[] = ai.relationships
        .map((aiRel): DBRelationship | null => {
            const sourceTable = findTable(aiRel.sourceTable);
            const targetTable = findTable(aiRel.targetTable);
            if (!sourceTable || !targetTable) return null;
            const sourceField = sourceTable.fields.find(
                (f) => f.name.toLowerCase() === aiRel.sourceField.toLowerCase()
            );
            const targetField = targetTable.fields.find(
                (f) => f.name.toLowerCase() === aiRel.targetField.toLowerCase()
            );
            if (!sourceField || !targetField) return null;

            const existing =
                (aiRel.id
                    ? existingRels.find((r) => r.id === aiRel.id)
                    : undefined) ??
                existingRels.find(
                    (r) =>
                        r.sourceTableId === sourceTable.id &&
                        r.targetTableId === targetTable.id &&
                        r.sourceFieldId === sourceField.id &&
                        r.targetFieldId === targetField.id
                );

            const sourceCardinality: Cardinality =
                aiRel.sourceCardinality ?? existing?.sourceCardinality ?? 'one';
            const targetCardinality: Cardinality =
                aiRel.targetCardinality ??
                existing?.targetCardinality ??
                'many';

            return {
                id: existing?.id ?? generateId(),
                name:
                    aiRel.name ??
                    existing?.name ??
                    `${sourceTable.name}_${targetTable.name}_fk`,
                sourceTableId: sourceTable.id,
                targetTableId: targetTable.id,
                sourceFieldId: sourceField.id,
                targetFieldId: targetField.id,
                sourceSchema: sourceTable.schema,
                targetSchema: targetTable.schema,
                sourceCardinality,
                targetCardinality,
                createdAt: existing?.createdAt ?? Date.now(),
            };
        })
        .filter((r): r is DBRelationship => r !== null);

    return {
        ...current,
        tables: newTables,
        relationships: newRelationships,
        updatedAt: new Date(),
    };
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export const editDiagramWithAI = async (
    diagram: Diagram,
    userRequest: string,
    options?: { signal?: AbortSignal }
): Promise<Diagram> => {
    const { model, generateObject } = await createLLMModel();

    const { object } = await generateObject({
        model,
        schema: aiDiagramSchema,
        prompt: buildPrompt(diagram, userRequest),
        abortSignal: options?.signal,
    });

    return reconcileDiagram(diagram, object as AIDiagram);
};
