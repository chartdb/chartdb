import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = '/data';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use(express.static(path.join(__dirname, 'dist')));

const diagramFile = (id) => path.join(DATA_DIR, `${id}.json`);
const isDiagramFile = (file) => /^[a-z0-9]{12}\.json$/.test(file);
const sendIndexHtml = (res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
};

const normalizeDiagram = (diagram) => ({
    ...diagram,
    tables: (diagram.tables ?? []).map((table) => ({
        ...table,
        x: table.x ?? 0,
        y: table.y ?? 0,
    })),
    relationships: diagram.relationships ?? [],
    dependencies: diagram.dependencies ?? [],
    areas: (diagram.areas ?? []).map((area) => ({
        ...area,
        x: area.x ?? 0,
        y: area.y ?? 0,
        width: area.width ?? 0,
        height: area.height ?? 0,
    })),
    customTypes: diagram.customTypes ?? [],
});

const writeJsonAtomic = async (filePath, data) => {
    const json = JSON.stringify(data, null, 2);
    const tempPath = `${filePath}.tmp`;
    const handle = await fs.open(tempPath, 'w');
    try {
        await handle.writeFile(json, 'utf-8');
        await handle.sync();
    } finally {
        await handle.close();
    }
    await fs.rename(tempPath, filePath);
};

const wantsHtml = (req) => req.headers.accept?.includes('text/html');

app.get('/diagram', async (req, res) => {
    if (wantsHtml(req)) {
        return sendIndexHtml(res);
    }
    try {
        const files = await fs.readdir(DATA_DIR);
        const diagrams = [];
        for (const file of files) {
            if (!isDiagramFile(file)) {
                continue;
            }
            try {
                const content = await fs.readFile(
                    path.join(DATA_DIR, file),
                    'utf-8'
                );
                const data = normalizeDiagram(JSON.parse(content));
                data.id = path.basename(file, '.json');
                diagrams.push(data);
            } catch {
                // Ignore invalid JSON or files that can't be read
            }
        }
        res.json(diagrams);
    } catch {
        res.json([]);
    }
});

app.get('/diagram/:id', async (req, res) => {
    if (wantsHtml(req)) {
        return sendIndexHtml(res);
    }
    try {
        const content = await fs.readFile(diagramFile(req.params.id), 'utf-8');
        const data = normalizeDiagram(JSON.parse(content));
        data.id = req.params.id;
        res.json(data);
    } catch {
        res.status(404).send('Not found');
    }
});

app.put('/diagram/:id', async (req, res) => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const diagram = normalizeDiagram({ ...req.body, id: req.params.id });
        await writeJsonAtomic(diagramFile(req.params.id), diagram);
        res.status(204).end();
    } catch {
        res.status(500).send('Failed to save');
    }
});

app.delete('/diagram/:id', async (req, res) => {
    try {
        await fs.unlink(diagramFile(req.params.id));
        res.status(204).end();
    } catch {
        res.status(404).end();
    }
});

app.get('/config', async (_req, res) => {
    try {
        const content = await fs.readFile(
            path.join(DATA_DIR, 'config.json'),
            'utf-8'
        );
        res.type('application/json').send(content);
    } catch {
        res.json({ defaultDiagramId: '' });
    }
});

app.put('/config', async (req, res) => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const filePath = path.join(DATA_DIR, 'config.json');
        await writeJsonAtomic(filePath, req.body);
        res.status(204).end();
    } catch {
        res.status(500).send('Failed to save config');
    }
});

app.use((_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(80, () => {
    console.log('ChartDB server listening on port 80');
});
