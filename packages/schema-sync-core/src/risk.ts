import type { ChangePlanContext, RiskWarning, SchemaChange } from './types.js';

const warning = (
    code: string,
    title: string,
    message: string,
    changeIds: string[],
    level: RiskWarning['level']
): RiskWarning => ({
    code,
    title,
    message,
    changeIds,
    level,
});

export const analyzePlanRisks = (
    changes: SchemaChange[],
    warnings: RiskWarning[] = []
): ChangePlanContext & { warnings: RiskWarning[] } => {
    const riskByChangeId = new Map<string, RiskWarning['level']>();

    const applyRisk = (
        changeId: string,
        level: RiskWarning['level'],
        title: string,
        message: string,
        code: string
    ) => {
        riskByChangeId.set(changeId, level);
        warnings.push(warning(code, title, message, [changeId], level));
    };

    for (const change of changes) {
        switch (change.kind) {
            case 'drop_table':
                applyRisk(
                    change.id,
                    'destructive',
                    'Drop table',
                    `Dropping ${change.table.schemaName}.${change.table.name} can permanently remove data.`,
                    'drop_table'
                );
                break;
            case 'drop_column':
                applyRisk(
                    change.id,
                    'destructive',
                    'Drop column',
                    `Dropping ${change.tableName}.${change.column.name} can permanently remove data.`,
                    'drop_column'
                );
                break;
            case 'alter_column_type':
                applyRisk(
                    change.id,
                    'warning',
                    'Column type change',
                    `Changing ${change.tableName}.${change.columnName} from ${change.fromType} to ${change.toType} may require a cast or data cleanup.`,
                    'alter_column_type'
                );
                break;
            case 'alter_column_nullability':
                if (!change.toNullable) {
                    applyRisk(
                        change.id,
                        'warning',
                        'Set NOT NULL',
                        `Setting ${change.tableName}.${change.columnName} to NOT NULL requires a preflight check for existing null values.`,
                        'set_not_null'
                    );
                }
                break;
            default:
                riskByChangeId.set(change.id, 'safe');
                break;
        }
    }

    return { riskByChangeId, warnings };
};
