export interface Graph<T> {
    graph: Map<T, T[]>;
    lastUpdated: number;
}

export const createGraph = <T>(): Graph<T> => ({
    graph: new Map(),
    lastUpdated: Date.now(),
});

export const addVertex = <T>(graph: Graph<T>, vertex: T): Graph<T> => {
    if (!graph.graph.has(vertex)) {
        graph.graph.set(vertex, []);
    }
    return { ...graph, lastUpdated: Date.now() };
};

export const addEdge = <T>(
    graph: Graph<T>,
    source: T,
    destination: T
): Graph<T> => {
    if (!graph.graph.has(source)) {
        addVertex(graph, source);
    }
    if (!graph.graph.has(destination)) {
        addVertex(graph, destination);
    }

    if (!graph.graph.get(source)?.includes(destination)) {
        graph.graph.get(source)?.push(destination);
    }

    if (!graph.graph.get(destination)?.includes(source)) {
        graph.graph.get(destination)?.push(source);
    }

    return { ...graph, lastUpdated: Date.now() };
};

export const getNeighbors = <T>(graph: Graph<T>, vertex: T): T[] | undefined =>
    graph.graph.get(vertex);

export const removeVertex = <T>(graph: Graph<T>, vertex: T): Graph<T> => {
    graph.graph.delete(vertex);
    graph.graph.forEach((neighbors) => {
        const index = neighbors.indexOf(vertex);
        if (index !== -1) {
            neighbors.splice(index, 1); // Remove the edge
        }
    });
    return { ...graph, lastUpdated: Date.now() };
};

export const removeEdge = <T>(
    graph: Graph<T>,
    source: T,
    destination: T
): Graph<T> => {
    if (graph.graph.has(source)) {
        const index = graph.graph.get(source)?.indexOf(destination) ?? -1;
        if (index !== -1) {
            graph.graph.get(source)?.splice(index, 1);
        }
    }
    if (graph.graph.has(destination)) {
        const index = graph.graph.get(destination)?.indexOf(source) ?? -1;
        if (index !== -1) {
            graph.graph.get(destination)?.splice(index, 1); // For undirected graph
        }
    }
    return { ...graph, lastUpdated: Date.now() };
};
