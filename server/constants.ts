import path from 'path';

export const INPUT_DIR = path.join(process.cwd(), 'public', 'input');
export const OUTPUT_DIR = path.join(process.cwd(), 'public', 'output');
export const SRC_DIR = path.join(process.cwd(), 'src');
export const TEMP_DIR = path.join(process.cwd(), 'src', 'temp');
export const DEFAULT_ERROR_SVG = path.join(process.cwd(), 'src', 'default_error.svg');

export const COMMAND_TIMEOUT_MS = 30000;
