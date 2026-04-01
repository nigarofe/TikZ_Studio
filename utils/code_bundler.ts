import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';

interface Config {
    [key: string]: {
        files: string[];
    };
}

const config: Config = {
    bundled_code_1: {
        files: [
            'src/index.ts',
            'server/server.ts',
        ],
    }
}

bundleCode(config);
watchFiles(config);

function bundleCode(config: Config) {
    for (const bundleName in config) {
        buildBundle(bundleName, config[bundleName].files);
    }
}

function buildBundle(bundleName: string, files: string[]) {
    let bundledCode = '';

    files.forEach((relativePath: string) => {
        const absolutePath = path.resolve(process.cwd(), relativePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${absolutePath}`);
        }

        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        bundledCode += `// --- START OF FILE: ${relativePath} ---\n${fileContent}\n\n`;
    });

    const outputDir = path.join(process.cwd(), 'bundled_code');
    if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir); }

    const outputPath = path.join(outputDir, `${bundleName}.txt`);
    fs.writeFileSync(outputPath, bundledCode);
    console.log(`[${new Date().toLocaleTimeString()}] ✅ Success!`);
}

function watchFiles(config: Config) {
    console.clear();
    console.log('\n👀 Code bundler is watching files for changes...');

    for (const bundleName in config) {
        const files = config[bundleName].files;
        const absolutePaths = files.map(relativePath => path.resolve(process.cwd(), relativePath));

        const watcher = chokidar.watch(absolutePaths, {
            persistent: true,
            ignoreInitial: true // Prevent triggering 'add' events on startup since we already ran bundleCode()
        });

        // Debounce timer to prevent multiple triggers on a rapid save sequence
        let timeout: NodeJS.Timeout | null = null;

        watcher.on('change', (changedPath) => {
            console.clear();
            console.log('\n👀 Code bundler is watching files for changes...');

            if (timeout) clearTimeout(timeout);

            timeout = setTimeout(() => {
                const relativePath = path.relative(process.cwd(), changedPath);

                console.log(`\n[${new Date().toLocaleTimeString()}] ✏️  File changed: ${relativePath}. Re-bundling ${bundleName}...`);
                try {
                    buildBundle(bundleName, files);
                } catch (error: any) {
                    console.error(`Error during re-bundling: ${error.message}`);
                }
            }, 100);
        });

        watcher.on('error', error => console.error(`Watcher error: ${error}`));
    }
}