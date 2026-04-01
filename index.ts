import chokidar from 'chokidar';
import path from 'path';
import {
    COMMAND_TIMEOUT_MS,
    DEFAULT_ERROR_SVG,
    INPUT_DIR,
    OUTPUT_DIR,
    PREVIEW_ASSETS_DIR,
    PREVIEW_PORT,
    TEMP_DIR,
    TIKZ_DIR,
} from './lib/constants';
import { createFileProcessor } from './lib/fileProcessor';
import { startPreviewServer } from './lib/previewServer';

console.log('Watching for .tex and .sty file changes in input directory...');

const broadcastPreviewEvent = startPreviewServer({
    tikzDir: TIKZ_DIR,
    outputDir: OUTPUT_DIR,
    previewAssetsDir: PREVIEW_ASSETS_DIR,
    port: PREVIEW_PORT,
});

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
    .on('add', (filePath) => notifySvgFsEvent('add', filePath))
    .on('change', (filePath) => notifySvgFsEvent('change', filePath))
    .on('unlink', (filePath) => notifySvgFsEvent('unlink', filePath))
    .on('error', (error) => console.error(`Output watcher error: ${error}`));

const watcher = chokidar.watch(INPUT_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
});

watcher
    .on('change', (filePath) => handleWatcherChange(filePath))
    .on('error', (error) => console.error(`Watcher error: ${error}`));

function notifySvgFsEvent(kind: 'add' | 'change' | 'unlink', filePath: string) {
    if (!filePath.toLowerCase().endsWith('.svg')) {
        return;
    }

    const svgName = path.basename(filePath);
    broadcastPreviewEvent('svg-fs', { kind, svgName });
}