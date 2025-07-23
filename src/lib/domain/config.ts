export interface ChartDBConfig {
    defaultDiagramId: string;
    exportActions?: Date[];
    hiddenTablesByDiagram?: Record<string, string[]>; // Maps diagram ID to array of hidden table IDs
}
