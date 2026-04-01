import path from 'path';

export const TIKZ_DIR = path.join(process.cwd(), 'utils', 'tikz');
export const INPUT_DIR = path.join(TIKZ_DIR, 'input');
export const OUTPUT_DIR = path.join(TIKZ_DIR, 'output');
export const TEMP_DIR = path.join(TIKZ_DIR, 'temp');
export const DEFAULT_ERROR_SVG = path.join(TIKZ_DIR, 'default_error.svg');
export const PREVIEW_ASSETS_DIR = path.join(TIKZ_DIR, 'preview-assets');

export const PREVIEW_PORT = Number(process.env.TIKZ_PREVIEW_PORT ?? 3010);
export const COMMAND_TIMEOUT_MS = 30000;
