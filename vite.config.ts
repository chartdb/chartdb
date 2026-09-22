import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';
import UnpluginInjectPreload from 'unplugin-inject-preload/vite';
import { createApiHandler, resolveDataDir } from './server/api.js';

type NextHandler = (err?: unknown) => void;

const apiMiddleware = () => {
    return {
        name: 'chartdb-api-middleware',
        configureServer(server: ViteDevServer) {
            const handler = createApiHandler({ dataDir: resolveDataDir() });
            server.middlewares.use(
                (
                    req: IncomingMessage,
                    res: ServerResponse,
                    next: NextHandler
                ) => {
                    handler(req, res)
                        .then((handled) => {
                            if (!handled) {
                                next();
                            }
                        })
                        .catch(next);
                }
            );
        },
    };
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        apiMiddleware(),
        visualizer({
            filename: './stats/stats.html',
            open: false,
        }),
        UnpluginInjectPreload({
            files: [
                {
                    entryMatch: /logo-light.png$/,
                    outputMatch: /logo-light-.*.png$/,
                },
                {
                    entryMatch: /logo-dark.png$/,
                    outputMatch: /logo-dark-.*.png$/,
                },
            ],
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            external: (id) => /__test__/.test(id),
            output: {
                assetFileNames: (assetInfo) => {
                    if (
                        assetInfo.names &&
                        assetInfo.originalFileNames.some((name) =>
                            name.startsWith('src/assets/templates/')
                        )
                    ) {
                        return 'assets/[name][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                },
            },
        },
    },
});
