import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { printLeanCommandDiagnostics } from './diagnostics';

const execFileAsync = promisify(execFile);

type PreviewBroadcaster = (type: string, payload: Record<string, unknown>) => void;

interface FileProcessorOptions {
    inputDir: string;
    outputDir: string;
    tempDir: string;
    defaultErrorSvg: string;
    commandTimeoutMs: number;
    onPreviewEvent?: PreviewBroadcaster;
}

export function createFileProcessor(options: FileProcessorOptions) {
    const {
        inputDir,
        outputDir,
        tempDir,
        defaultErrorSvg,
        commandTimeoutMs,
        onPreviewEvent,
    } = options;

    async function handleWatcherChange(filePath: string) {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.sty') {
            console.log(`Style file changed: ${path.basename(filePath)}. Re-rendering all TeX files...`);
            try {
                const files = await fs.readdir(inputDir);
                const texFiles = files.filter((file) => file.toLowerCase().endsWith('.tex'));

                const CONCURRENCY_LIMIT = 4;
                await mapLimit(texFiles, CONCURRENCY_LIMIT, (file) =>
                    handleFile(path.join(inputDir, file))
                );
            } catch (error) {
                console.error('Error re-rendering directory:', error);
            }
            return;
        }

        if (ext === '.tex') {
            await handleFile(filePath);
        }
    }

    async function handleFile(filePath: string) {
        console.log(`Processing file: ${filePath}`);

        const fileName = path.basename(filePath, path.extname(filePath));
        const outPath = path.join(outputDir, `${fileName}.svg`);
        const dviPath = path.join(tempDir, `${fileName}.dvi`);

        try {
            await Promise.all([
                fs.mkdir(tempDir, { recursive: true }),
                fs.mkdir(outputDir, { recursive: true }),
                fs.rm(dviPath, { force: true }),
            ]);

            const texInputsParts = [inputDir];
            if (process.env.TEXINPUTS) {
                texInputsParts.push(process.env.TEXINPUTS);
            }
            const texInputs = texInputsParts.join(path.delimiter);

            const latexResult = await execFileAsync('latex', [
                '-interaction=nonstopmode',
                '-halt-on-error',
                '-file-line-error',
                `--output-directory=${tempDir}`,
                path.basename(filePath),
            ], {
                cwd: inputDir,
                env: {
                    ...process.env,
                    TEXINPUTS: texInputs,
                },
                timeout: commandTimeoutMs,
                maxBuffer: 10 * 1024 * 1024,
            });

            if (latexResult.stderr?.trim()) {
                console.error(`latex warnings/errors for ${fileName}:\n${latexResult.stderr}`);
            }

            await fs.access(dviPath);

            const dvisvgmResult = await execFileAsync('dvisvgm', [
                '--no-fonts',
                `--output=${outPath}`,
                dviPath,
            ], {
                timeout: commandTimeoutMs,
                maxBuffer: 10 * 1024 * 1024,
            });

            if (dvisvgmResult.stderr?.trim()) {
                console.error(`dvisvgm warnings/errors for ${fileName}:\n${dvisvgmResult.stderr}`);
            }

            console.log(`Successfully converted ${fileName} to SVG`);
            onPreviewEvent?.('render-success', { svgName: `${fileName}.svg` });
        } catch (error: any) {
            await handleProcessingError(fileName, outPath, error);
        }
    }

    async function handleProcessingError(fileName: string, outPath: string, error: any) {
        const commandName = error?.cmd ? String(error.cmd).split(' ')[0] : 'command';
        console.error(`Error processing ${fileName} while running ${commandName}.`);
        printLeanCommandDiagnostics(commandName, error?.stdout, error?.stderr);

        try {
            await fs.copyFile(defaultErrorSvg, outPath);
            onPreviewEvent?.('render-error-fallback', { svgName: path.basename(outPath) });
        } catch {
            console.error('Failed to write fallback SVG.');
        }
    }

    return {
        handleWatcherChange,
        handleFile,
    };
}

async function mapLimit<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    const executing = new Set<Promise<void>>();

    for (const item of items) {
        const task = fn(item).then((result) => {
            results.push(result);
        });

        executing.add(task);
        const cleanup = () => {
            executing.delete(task);
        };
        task.then(cleanup, cleanup);

        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }

    await Promise.all(executing);
    return results;
}
