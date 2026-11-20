import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export const SCHEMAS_DIR = 'schemas';
export const AUTOSAVE_ENDPOINT = '/api/autosave-dbml';
export const LOCAL_SCHEMA_PACKAGES_ENDPOINT = '/api/local-schema-packages';

export interface AutosavePayload {
    diagramName?: unknown;
    dbml?: unknown;
    diagramJson?: unknown;
}

export interface LocalSchemaPackageMetadata {
    packageName: string;
    diagramName: string;
    relativePath: string;
    diagramJsonPath: string;
    schemaPath?: string;
    absolutePath: string;
    updatedAt: string;
    hasDbml: boolean;
    tablesCount?: number;
}

export const AUTOSAVE_FILE_NAMES = {
    dbml: 'schema.dbml',
    diagramJson: 'diagram.chartdb.json',
} as const;

type AutosaveFileKind = keyof typeof AUTOSAVE_FILE_NAMES;

type AutosaveFile = {
    filePath: string;
    content: string;
};

type JsonResponse = {
    statusCode: number;
    setHeader: (name: string, value: string) => void;
    end: (body?: string) => void;
};

class AutosaveValidationError extends Error {}

const toPosixPath = (filePath: string): string =>
    filePath.split(path.sep).join('/');

export const sanitizeDiagramFileName = (diagramName: string): string =>
    diagramName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');

export const isValidPackageName = (packageName: string): boolean =>
    packageName.length > 0 &&
    packageName === sanitizeDiagramFileName(packageName);

// Returns the absolute target path, or null if the name is empty after
// sanitization or would escape the schemas directory. Names that look like
// paths are rejected outright rather than silently sanitized into a different
// diagram's package folder.
export const resolveSchemaFilePath = (
    schemasRoot: string,
    diagramName: string,
    fileKind: AutosaveFileKind
): string | null => {
    if (/[/\\]|\.\.|^[a-zA-Z]:/.test(diagramName)) {
        return null;
    }

    const packageName = sanitizeDiagramFileName(diagramName);
    if (!packageName) {
        return null;
    }

    const schemasRootPath = path.resolve(schemasRoot);
    const target = path.resolve(
        schemasRootPath,
        packageName,
        AUTOSAVE_FILE_NAMES[fileKind]
    );
    if (!target.startsWith(schemasRootPath + path.sep)) {
        return null;
    }

    return target;
};

const resolveSchemaPackagePath = (
    schemasRoot: string,
    packageName: string
): string | null => {
    if (!isValidPackageName(packageName)) {
        return null;
    }

    const schemasRootPath = path.resolve(schemasRoot);
    const target = path.resolve(schemasRootPath, packageName);
    if (!target.startsWith(schemasRootPath + path.sep)) {
        return null;
    }

    return target;
};

export const listLocalSchemaPackages = (
    repoRoot: string
): LocalSchemaPackageMetadata[] => {
    const schemasRoot = path.resolve(repoRoot, SCHEMAS_DIR);
    if (!fs.existsSync(schemasRoot)) {
        return [];
    }

    return fs
        .readdirSync(schemasRoot, { withFileTypes: true })
        .filter(
            (entry) => entry.isDirectory() && isValidPackageName(entry.name)
        )
        .flatMap((entry) => {
            const packagePath = path.join(schemasRoot, entry.name);
            const diagramJsonPath = path.join(
                packagePath,
                AUTOSAVE_FILE_NAMES.diagramJson
            );

            if (!fs.existsSync(diagramJsonPath)) {
                return [];
            }

            let diagramJson: unknown;
            try {
                diagramJson = JSON.parse(
                    fs.readFileSync(diagramJsonPath, 'utf-8')
                );
            } catch {
                return [];
            }

            const schemaPath = path.join(packagePath, AUTOSAVE_FILE_NAMES.dbml);
            const hasDbml = fs.existsSync(schemaPath);
            const diagramName =
                typeof diagramJson === 'object' &&
                diagramJson !== null &&
                'name' in diagramJson &&
                typeof diagramJson.name === 'string'
                    ? diagramJson.name
                    : entry.name;
            const tablesCount =
                typeof diagramJson === 'object' &&
                diagramJson !== null &&
                'tables' in diagramJson &&
                Array.isArray(diagramJson.tables)
                    ? diagramJson.tables.length
                    : undefined;

            return [
                {
                    packageName: entry.name,
                    diagramName,
                    relativePath: `${toPosixPath(
                        path.relative(repoRoot, packagePath)
                    )}/`,
                    diagramJsonPath: toPosixPath(
                        path.relative(repoRoot, diagramJsonPath)
                    ),
                    schemaPath: hasDbml
                        ? toPosixPath(path.relative(repoRoot, schemaPath))
                        : undefined,
                    absolutePath: packagePath,
                    updatedAt: fs.statSync(diagramJsonPath).mtime.toISOString(),
                    hasDbml,
                    tablesCount,
                },
            ];
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const readLocalSchemaPackageDiagram = (
    repoRoot: string,
    packageName: string
): string => {
    const packagePath = resolveSchemaPackagePath(
        path.resolve(repoRoot, SCHEMAS_DIR),
        packageName
    );
    if (!packagePath) {
        throw new AutosaveValidationError('invalid package name');
    }

    const diagramJsonPath = path.join(
        packagePath,
        AUTOSAVE_FILE_NAMES.diagramJson
    );
    if (!fs.existsSync(diagramJsonPath)) {
        throw new AutosaveValidationError('package diagram JSON not found');
    }

    return fs.readFileSync(diagramJsonPath, 'utf-8');
};

// Skips the write when content is unchanged; writes via a temp file and
// rename so a crash can never leave a truncated file.
const writeFileIfChanged = (filePath: string, content: string): void => {
    if (
        fs.existsSync(filePath) &&
        fs.readFileSync(filePath, 'utf-8') === content
    ) {
        return;
    }

    const tmpPath = `${filePath}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);
};

const resolveAutosaveFiles = (
    schemasRoot: string,
    payload: AutosavePayload
): AutosaveFile[] => {
    const { diagramName, dbml, diagramJson } = payload;
    if (typeof diagramName !== 'string') {
        throw new AutosaveValidationError('diagramName is required');
    }

    const files: AutosaveFile[] = [];
    for (const [fileKind, content] of [
        ['dbml', dbml],
        ['diagramJson', diagramJson],
    ] as const) {
        if (content === undefined) {
            continue;
        }
        if (typeof content !== 'string') {
            throw new AutosaveValidationError(
                `${AUTOSAVE_FILE_NAMES[fileKind]} content must be a string`
            );
        }
        const filePath = resolveSchemaFilePath(
            schemasRoot,
            diagramName,
            fileKind
        );
        if (!filePath) {
            throw new AutosaveValidationError('invalid diagram name');
        }
        files.push({ filePath, content });
    }

    return files;
};

export const saveAutosavePayload = (
    repoRoot: string,
    payload: AutosavePayload
): string[] => {
    const files = resolveAutosaveFiles(
        path.resolve(repoRoot, SCHEMAS_DIR),
        payload
    );

    for (const { filePath, content } of files) {
        writeFileIfChanged(filePath, content);
    }

    return files.map(({ filePath }) => path.relative(repoRoot, filePath));
};

export const dbmlAutosavePlugin = (): Plugin => ({
    name: 'dbml-autosave',
    apply: 'serve',
    configureServer(server) {
        const respond = (res: JsonResponse, status: number, body: object) => {
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(body));
        };

        server.middlewares.use(AUTOSAVE_ENDPOINT, (req, res) => {
            if (req.method !== 'POST') {
                respond(res, 405, { error: 'method not allowed' });
                return;
            }

            const chunks: Buffer[] = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
                let payload: AutosavePayload;
                try {
                    payload = JSON.parse(Buffer.concat(chunks).toString());
                } catch {
                    respond(res, 400, { error: 'invalid JSON body' });
                    return;
                }

                try {
                    const saved = saveAutosavePayload(
                        server.config.root,
                        payload
                    );
                    respond(res, 200, { saved });
                } catch (error) {
                    respond(
                        res,
                        error instanceof AutosaveValidationError ? 400 : 500,
                        {
                            error: String(error),
                        }
                    );
                    return;
                }
            });
        });

        server.middlewares.use(LOCAL_SCHEMA_PACKAGES_ENDPOINT, (req, res) => {
            const pathname = new URL(req.url ?? '/', 'http://localhost')
                .pathname;

            if (req.method !== 'GET') {
                respond(res, 405, { error: 'method not allowed' });
                return;
            }

            if (pathname === '/') {
                respond(res, 200, {
                    packages: listLocalSchemaPackages(server.config.root),
                });
                return;
            }

            const packageDiagramMatch = pathname.match(
                /^\/([a-z0-9_-]+)\/diagram$/
            );
            if (!packageDiagramMatch) {
                respond(res, 404, { error: 'not found' });
                return;
            }

            try {
                respond(res, 200, {
                    diagramJson: readLocalSchemaPackageDiagram(
                        server.config.root,
                        packageDiagramMatch[1]
                    ),
                });
            } catch (error) {
                respond(
                    res,
                    error instanceof AutosaveValidationError ? 400 : 500,
                    {
                        error: String(error),
                    }
                );
            }
        });
    },
});
