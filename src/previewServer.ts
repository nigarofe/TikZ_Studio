import express, { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

export type PreviewEventPayload = Record<string, unknown>;
export type PreviewBroadcaster = (type: string, payload: PreviewEventPayload) => void;

interface PreviewServerOptions {
    tikzDir: string;
    outputDir: string;
    previewAssetsDir: string;
    port: number;
}

export function startPreviewServer(options: PreviewServerOptions): PreviewBroadcaster {
    const { tikzDir, outputDir, previewAssetsDir, port } = options;
    const previewClients = new Set<Response>();
    const morphdomDistDir = path.join(process.cwd(), 'node_modules', 'morphdom', 'dist');

    const app = express();
    app.disable('etag');

    app.get('/tikz-preview', (_req, res) => {
        res.sendFile(path.join(tikzDir, 'index.html'));
    });

    app.use('/tikz-preview/assets', express.static(previewAssetsDir, {
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'no-store, must-revalidate');
        },
    }));

    app.use('/tikz-preview/vendor', express.static(morphdomDistDir, {
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'no-store, must-revalidate');
        },
    }));

    app.use('/tikz-preview/files', express.static(outputDir, {
        etag: false,
        lastModified: false,
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'no-store, must-revalidate');
        },
    }));

    app.get('/tikz-preview/svgs', async (_req, res) => {
        try {
            const files = await fs.readdir(outputDir, { withFileTypes: true });
            const svgEntries = files
                .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

            const svgs = await Promise.all(svgEntries.map(async (entry) => {
                const absolutePath = path.join(outputDir, entry.name);
                const stats = await fs.stat(absolutePath);
                return {
                    name: entry.name,
                    version: String(Math.trunc(stats.mtimeMs)),
                    url: `/tikz-preview/files/${encodeURIComponent(entry.name)}`,
                };
            }));

            res.json({
                svgs,
            });
        } catch (error) {
            console.error('Unable to list SVG files for preview.', error);
            res.status(500).json({ svgs: [] });
        }
    });

    app.get('/tikz-preview/events', (_req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        previewClients.add(res);
        res.write(`event: ready\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`);

        res.on('close', () => {
            previewClients.delete(res);
            res.end();
        });
    });

    app.listen(port, () => {
        console.log(`TikZ preview running at http://localhost:${port}/tikz-preview`);
    });

    return (type: string, payload: PreviewEventPayload) => {
        const message = `event: update\ndata: ${JSON.stringify({ type, ...payload, timestamp: Date.now() })}\n\n`;
        for (const client of previewClients) {
            client.write(message);
        }
    };
}
