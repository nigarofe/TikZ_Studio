// npx tsx --watch server/index.ts

import chokidar from 'chokidar';
import path from 'path';
import {
    COMMAND_TIMEOUT_MS,
    DEFAULT_ERROR_SVG,
    INPUT_DIR,
    OUTPUT_DIR,
    TEMP_DIR,
} from './constants';
import { createFileProcessor } from './fileProcessor';
import { broadcastPreviewEvent } from './server';

console.log('Watching for .tex and .sty file changes in input directory...');

const { handleWatcherChange } = createFileProcessor({
    inputDir: INPUT_DIR,
    outputDir: OUTPUT_DIR,
    tempDir: TEMP_DIR,
    defaultErrorSvg: DEFAULT_ERROR_SVG,
    commandTimeoutMs: COMMAND_TIMEOUT_MS,
    onPreviewEvent: broadcastPreviewEvent,
});

const outputWatcher = chokidar.watch(OUTPUT_DIR, {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
    persistent: true,
});

outputWatcher
    .on('add', (filePath: string) => notifySvgFsEvent('add', filePath))
    .on('change', (filePath: string) => notifySvgFsEvent('change', filePath))
    .on('unlink', (filePath: string) => notifySvgFsEvent('unlink', filePath))
    .on('error', (error: unknown) => console.error(`Output watcher error: ${error}`));

const watcher = chokidar.watch(INPUT_DIR, {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 50,
    },
});

watcher
    .on('change', (filePath: string) => handleWatcherChange(filePath))
    .on('error', (error: unknown) => console.error(`Watcher error: ${error}`));

function notifySvgFsEvent(kind: 'add' | 'change' | 'unlink', filePath: string) {
    if (!filePath.toLowerCase().endsWith('.svg')) {
        return;
    }

    const svgName = path.basename(filePath);
    broadcastPreviewEvent('svg-fs', { kind, svgName });
}