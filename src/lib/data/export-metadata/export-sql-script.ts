import { Diagram } from "../domain/diagram";

export const exportSQL = (diagram: Diagram): string => {
    const { tables, relationships } = diagram;

    if (!tables || tables.length === 0) {
        return '';
    }

    // Filter out the tables that are views
    const nonViewTables = tables.filter(table => !table.isView);

    // Initialize the SQL script string
    let sqlScript = '';

    // Loop through each non-view table to generate the SQL statements
    nonViewTables.forEach(table => {
        sqlScript += `CREATE TABLE ${table.name} (\n`;

        table.fields.forEach((field, index) => {
            sqlScript += `  ${field.name} ${field.type}`;

            if (field.primaryKey) {
                sqlScript += ' PRIMARY KEY';
            }

            if (!field.nullable) {
                sqlScript += ' NOT NULL';
            }

            // Add a comma after each field except the last one
            if (index < table.fields.length - 1) {
                sqlScript += ',\n';
            }
        });

        sqlScript += '\n);\n\n';
    });

    // Handle relationships (foreign keys) if needed
    relationships?.forEach(relationship => {
        const sourceTable = nonViewTables.find(table => table.id === relationship.sourceTableId);
        const targetTable = nonViewTables.find(table => table.id === relationship.targetTableId);

        if (sourceTable && targetTable) {
            sqlScript += `ALTER TABLE ${sourceTable.name} ADD CONSTRAINT ${relationship.name} FOREIGN KEY (${relationship.sourceFieldId}) REFERENCES ${targetTable.name} (${relationship.targetFieldId});\n`;
        }
    });

    return sqlScript;
};
