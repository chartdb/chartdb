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

app.get('/diagram', async (_req, res) => {
    try {
        const files = await fs.readdir(DATA_DIR);
        const diagrams = [];
        for (const file of files) {
            if (file.endsWith('.json') && file !== 'config.json') {
                const content = await fs.readFile(
                    path.join(DATA_DIR, file),
                    'utf-8'
                );
                diagrams.push(JSON.parse(content));
            }
        }
        res.json(diagrams);
    } catch {
        res.json([]);
    }
});

app.get('/diagram/:id', async (req, res) => {
    try {
        const content = await fs.readFile(diagramFile(req.params.id), 'utf-8');
        res.type('application/json').send(content);
    } catch {
        res.status(404).send('Not found');
    }
});

app.put('/diagram/:id', async (req, res) => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const json = JSON.stringify(req.body, null, 2);
        await fs.writeFile(diagramFile(req.params.id), json);
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
        const json = JSON.stringify(req.body, null, 2);
        await fs.writeFile(path.join(DATA_DIR, 'config.json'), json);
        res.status(204).end();
    } catch {
        res.status(500).send('Failed to save config');
    }
});

app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(80, () => {
    console.log('ChartDB server listening on port 80');
});
