import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';
import { validateDBML, autoFixDBML } from '../dbml-validator';
import type { DBTable } from '@/lib/domain/db-table';

describe('DBML Import E2E - Table Notes Preservation', () => {
    it('should preserve table notes through the full import flow including auto-fix', async () => {
        // Simulate the actual file content structure
        const dbmlFromFile = `{
  database_type: "PostgreSQL"
}
Table property {
  
  Note: 'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
  id uuid [pk, note: 'Identificador único de la propiedad'
    ]
  owner_person_id uuid [not null, note: 'Referencia al propietario'
    ]
  bedrooms int [note: 'Cantidad de dormitorios'
    ]
  
  indexes {
    owner_person_id(owner_person_id)
  }
}

Table amenity {
  Note: 'Catálogo maestro de todas las posibles comodidades o características que puede tener una propiedad(ej: Piscina, Gimnasio).'
  id int [pk]
  name varchar
}

Table property_amenities {
  Note: 'Tabla de unión que establece una relación muchos-a-muchos entre propiedades y sus comodidades.'
  property_id uuid
  amenity_id int
}`;

        // Step 1: Initial validation (finds notes)
        const initialValidation = validateDBML(dbmlFromFile);

        expect(initialValidation.tableNotes).toBeDefined();
        expect(initialValidation.tableNotes?.size).toBe(3);
        expect(initialValidation.tableNotes?.get('property')).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );
        expect(initialValidation.tableNotes?.get('amenity')).toBe(
            'Catálogo maestro de todas las posibles comodidades o características que puede tener una propiedad(ej: Piscina, Gimnasio).'
        );
        expect(initialValidation.tableNotes?.get('property_amenities')).toBe(
            'Tabla de unión que establece una relación muchos-a-muchos entre propiedades y sus comodidades.'
        );

        // Step 2: Apply auto-fix (removes Note: lines but preserves them in the result)
        expect(initialValidation.fixedDBML).toBeDefined();
        const fixResult = autoFixDBML(dbmlFromFile);

        // Verify notes are preserved in fix result
        expect(fixResult.tableNotes.size).toBe(3);
        expect(fixResult.tableNotes.get('property')).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );

        // Fixed DBML should not contain Note: lines
        expect(fixResult.fixed).not.toContain('Note:');

        // Step 3: Second validation on fixed DBML (should find no notes in the DBML itself)
        const secondValidation = validateDBML(fixResult.fixed);
        expect(secondValidation.tableNotes).toBeUndefined();

        // Step 4: Import with preserved notes from initial validation or fix result
        // This simulates what should happen in the UI
        const notesToUse = initialValidation.tableNotes || fixResult.tableNotes;

        // For the import to work, we need to remove references since we don't have all tables
        const dbmlForImport = fixResult.fixed.replace(/ref: > \w+\.\w+/g, '');

        const diagram = await importDBMLToDiagram(dbmlForImport, notesToUse);

        // Verify tables were created with comments
        const propertyTable = diagram.tables?.find(
            (t: DBTable) => t.name === 'property'
        );
        const amenityTable = diagram.tables?.find(
            (t: DBTable) => t.name === 'amenity'
        );
        const propertyAmenitiesTable = diagram.tables?.find(
            (t: DBTable) => t.name === 'property_amenities'
        );

        expect(propertyTable).toBeDefined();
        expect(propertyTable?.comments).toBe(
            'El activo físico principal. Representa un inmueble con sus características intrínsecas(dirección, superficie, etc.).'
        );

        expect(amenityTable).toBeDefined();
        expect(amenityTable?.comments).toBe(
            'Catálogo maestro de todas las posibles comodidades o características que puede tener una propiedad(ej: Piscina, Gimnasio).'
        );

        expect(propertyAmenitiesTable).toBeDefined();
        expect(propertyAmenitiesTable?.comments).toBe(
            'Tabla de unión que establece una relación muchos-a-muchos entre propiedades y sus comodidades.'
        );
    });
});
