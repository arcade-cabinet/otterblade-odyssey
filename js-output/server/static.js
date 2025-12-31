import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
/**
 * Rate limiter for static file serving.
 * Limits requests to prevent file system abuse.
 */
const staticRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute per IP
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
export function serveStatic(app) {
    const distPath = path.resolve(__dirname, 'public');
    if (!fs.existsSync(distPath)) {
        throw new Error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
    }
    app.use(express.static(distPath));
    // fall through to index.html if the file doesn't exist
    // Rate limited to prevent file system abuse
    app.use('*', staticRateLimiter, (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
    });
}
