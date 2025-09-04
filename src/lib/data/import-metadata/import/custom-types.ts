import type { DBCustomType, DBCustomTypeKind } from '@/lib/domain';
import { schemaNameToDomainSchemaName } from '@/lib/domain';
import type { DBCustomTypeInfo } from '../metadata-types/custom-type-info';
import { generateId } from '@/lib/utils';

export const createCustomTypesFromMetadata = ({
    customTypes,
}: {
    customTypes: DBCustomTypeInfo[];
}): DBCustomType[] => {
    return customTypes.map((customType) => {
        return {
            id: generateId(),
            schema: schemaNameToDomainSchemaName(customType.schema),
            name: customType.type,
            kind: customType.kind as DBCustomTypeKind,
            values: customType.values,
            fields: customType.fields,
        };
    });
};
