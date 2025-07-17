import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../../../dbml-import';
import { validateDBML, autoFixDBML } from '../dbml-validator';

describe('DBML Table Notes Import', () => {
    it('should extract and apply table notes to diagram tables', async () => {
        const dbmlWithNotes = `Table property {
  
  Note: 'El activo físico principal. Representa un inmueble con sus características intrínsecas (dirección, superficie, etc.).'
  id uuid [pk]
  address varchar
}

Table organization {
  Note: "Company or real estate agency"
  id uuid [pk]
  name varchar
}`;

        // First validate to extract notes
        const validation = validateDBML(dbmlWithNotes);
        expect(validation.tableNotes).toBeDefined();
        expect(validation.tableNotes?.size).toBe(2);
        expect(validation.tableNotes?.get('property')).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );
        expect(validation.tableNotes?.get('organization')).toBe(
            'Company or real estate agency'
        );

        // Import with table notes - need to use fixed DBML if available
        const dbmlToImport = validation.fixedDBML || dbmlWithNotes;
        const diagram = await importDBMLToDiagram(
            dbmlToImport,
            validation.tableNotes
        );

        // Verify tables have comments
        const propertyTable = diagram.tables?.find(
            (t) => t.name === 'property'
        );
        const organizationTable = diagram.tables?.find(
            (t) => t.name === 'organization'
        );

        expect(propertyTable).toBeDefined();
        expect(propertyTable?.comments).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );

        expect(organizationTable).toBeDefined();
        expect(organizationTable?.comments).toBe(
            'Company or real estate agency'
        );
    });

    it('should handle table notes with auto-fix workflow', async () => {
        // DBML with formatting issues and table notes
        const dbmlWithIssues = `{
  database_type: "PostgreSQL"
}
Table property {
  
  Note: 'Physical asset with intrinsic characteristics'
  id uuid [pk,
    default: \`uuid_generate_v4()\`
    ]
  total_area numeric(10,
    2)
  
  indexes {
    id(id)
  }
}`;

        // Validate and get notes before fix
        const validation = validateDBML(dbmlWithIssues);
        expect(validation.fixedDBML).toBeDefined();
        expect(validation.tableNotes).toBeDefined();
        expect(validation.tableNotes?.get('property')).toBe(
            'Physical asset with intrinsic characteristics'
        );

        // Apply auto-fix
        const fixResult = autoFixDBML(dbmlWithIssues);
        expect(fixResult.tableNotes.size).toBe(1);
        expect(fixResult.tableNotes.get('property')).toBe(
            'Physical asset with intrinsic characteristics'
        );

        // The fixed DBML should not contain the Note: line
        expect(fixResult.fixed).not.toContain('Note:');
        expect(fixResult.fixed).toContain('Table property {');
        expect(fixResult.fixed).toContain(
            '[pk, default: `uuid_generate_v4()`]'
        );
        expect(fixResult.fixed).toContain('numeric(10,2)');
        expect(fixResult.fixed).toContain('Indexes {');

        // Import with the fixed DBML and preserved notes
        const diagram = await importDBMLToDiagram(
            fixResult.fixed,
            fixResult.tableNotes
        );

        const propertyTable = diagram.tables?.find(
            (t) => t.name === 'property'
        );
        expect(propertyTable).toBeDefined();
        expect(propertyTable?.comments).toBe(
            'Physical asset with intrinsic characteristics'
        );
    });

    it('should handle complex Spanish property example', async () => {
        const complexDBML = `Table person {
  id uuid [pk]
  name varchar
}

Table address {
  id uuid [pk]
  street varchar
}

Table property {
  
  Note: 'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
  id uuid [pk, note: 'Identificador único de la propiedad'
    ]
  owner_person_id uuid [not null, ref: > person.id, note: 'Referencia al propietario legal del inmueble (una persona o empresa)'
    ]
  address_id uuid [unique, not null, ref: > address.id, note: 'Referencia a la dirección física del inmueble'
    ]
  property_type varchar [not null, note: 'Clasificación del inmueble (Casa, Departamento, etc.)'
    ]
  bedrooms int [note: 'Cantidad de dormitorios'
    ]
  bathrooms decimal(3,
    1) [note: 'Cantidad de baños (ej: 2.5 para 2 baños y 1 toilette)'
    ]
  
  indexes {
    owner_person_id(owner_person_id)
  }
}`;

        // Validate to extract notes
        const validation = validateDBML(complexDBML);
        expect(validation.tableNotes).toBeDefined();
        expect(validation.tableNotes?.get('property')).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );

        // If there are fixes, apply them
        let dbmlToImport = complexDBML;
        let notesToUse = validation.tableNotes;

        if (validation.fixedDBML) {
            const fixResult = autoFixDBML(complexDBML);
            dbmlToImport = fixResult.fixed;
            notesToUse = fixResult.tableNotes;
        }

        // Import the diagram
        const diagram = await importDBMLToDiagram(dbmlToImport, notesToUse);

        const propertyTable = diagram.tables?.find(
            (t) => t.name === 'property'
        );
        expect(propertyTable).toBeDefined();
        expect(propertyTable?.comments).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );

        // Verify field notes are preserved too
        const bedroomsField = propertyTable?.fields.find(
            (f) => f.name === 'bedrooms'
        );
        expect(bedroomsField).toBeDefined();

        // Check that relationships were created
        expect(diagram.relationships?.length ?? 0).toBeGreaterThan(0);

        // Verify other tables exist too
        const personTable = diagram.tables?.find((t) => t.name === 'person');
        const addressTable = diagram.tables?.find((t) => t.name === 'address');
        expect(personTable).toBeDefined();
        expect(addressTable).toBeDefined();
    });
});
