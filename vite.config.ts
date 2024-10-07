import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react() /*, visualizer()*/],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
