// Firestore is modeled as one flat, top-level collection per entity type
// (mirroring the Dexie stores: db_tables, db_relationships, ...) rather than
// per-diagram subcollections. That keeps every entity's document ID equal to
// its domain `id` regardless of which diagram it belongs to, which matches
// how `StorageContext.updateTable`/`updateRelationship`/etc. are called
// elsewhere in the app: with just an `id`, no `diagramId`. Each document
// still carries a `diagramId` field so it can be queried/filtered per
// diagram and so Firestore security rules (see firestore.rules) can look up
// the owning diagram's ACL. Because concurrent edits from different users
// almost always touch different entity documents (different tables,
// different relationships), Firestore's normal per-document optimistic
// writes are enough - no custom merge/CRDT logic is needed, unlike a design
// that stores a whole diagram as a single JSON blob.
export const COLLECTIONS = {
    diagrams: 'diagrams',
    tables: 'db_tables',
    relationships: 'db_relationships',
    dependencies: 'db_dependencies',
    areas: 'areas',
    customTypes: 'db_custom_types',
    notes: 'notes',
    diagramFilters: 'diagram_filters',
} as const;
