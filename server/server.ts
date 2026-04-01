import express, { type Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

export type PreviewEventPayload = Record<string, unknown>;
export type PreviewBroadcaster = (type: string, payload: PreviewEventPayload) => void;

import { INPUT_DIR, OUTPUT_DIR, SRC_DIR, TEMP_DIR, DEFAULT_ERROR_SVG } from './constants';

const previewClients = new Set<Response>();
const morphdomDistDir = path.join(process.cwd(), 'node_modules', 'morphdom', 'dist');

const app = express();
app.disable('etag');

const port = Number(process.env.PORT ?? 3010);
app.listen(port, () => {
    console.log(`TikZ preview running at http://localhost:${port}/`);
});

// const message = `event: update\ndata: ${JSON.stringify({ type, ...payload, timestamp: Date.now() })}\n\n`;
// for (const client of previewClients) {
//     client.write(message);
// }


app.get('/', (_req, res) => {
    res.sendFile(path.join(SRC_DIR, 'index.html'));
});

app.use('/assets', express.static(OUTPUT_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
    },
}));

app.use('/vendor', express.static(morphdomDistDir, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
    },
}));

app.use('/files', express.static(OUTPUT_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
    },
}));

app.get('/svgs', async (_req, res) => {
    try {
        const files = await fs.readdir(OUTPUT_DIR, { withFileTypes: true });
        const svgEntries = files
            .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.svg'))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const svgs = await Promise.all(svgEntries.map(async (entry) => {
            const absolutePath = path.join(OUTPUT_DIR, entry.name);
            const stats = await fs.stat(absolutePath);
            return {
                name: entry.name,
                version: String(Math.trunc(stats.mtimeMs)),
                url: `/files/${encodeURIComponent(entry.name)}`,
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

app.get('/events', (_req, res) => {
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


