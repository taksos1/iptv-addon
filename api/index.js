require('dotenv').config();

const { getRouter } = require("stremio-addon-sdk");
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fetch = require("node-fetch");
const createAddon = require("../addon");
const { encryptConfig, tryParseConfigToken } = require("../cryptoConfig");

// LRU fallback for interfaces (simplified for serverless)
const LRUCache = require("../lruCache");
const INTERFACE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || (6 * 3600 * 1000).toString(), 10);
const interfaceCache = new LRUCache({ max: parseInt(process.env.MAX_CACHE_ENTRIES || '50', 10), ttl: INTERFACE_TTL_MS });

// Global cache enable/disable (true by default)
const CACHE_ENABLED = (process.env.CACHE_ENABLED || 'true').toLowerCase() !== 'false';

const app = express();
app.use(express.static(path.join(__dirname, '../public')));

// Optional: encryption endpoint (client can request encrypted token)
app.use(express.json());
app.post('/encrypt', (req, res) => {
    if (!process.env.CONFIG_SECRET) {
        return res.status(400).json({ error: 'Encryption not enabled on server (CONFIG_SECRET missing)' });
    }
    try {
        const jsonStr = JSON.stringify(req.body || {});
        const token = encryptConfig(jsonStr);
        if (!token) return res.status(500).json({ error: 'Encrypt failed' });
        res.json({ token });
    } catch {
        res.status(400).json({ error: 'Invalid config payload' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../configure.html')));
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

function maybeDecryptConfig(token) {
    return tryParseConfigToken(token);
}

function isConfigToken(token) {
    if (!token) return false;
    // Accept encrypted tokens or base64-ish tokens >= 8 chars
    if (token.startsWith('enc:')) return true;
    if (token.length < 8) return false;
    return true;
}

// Reconfigure route
app.get('/:token/configure', (req, res) => {
    const { token } = req.params;
    if (!isConfigToken(token)) return res.status(400).json({ error: 'Invalid configuration' });
    res.sendFile(path.join(__dirname, '../configure.html'));
});

// Middleware to load / build addon interface
app.use('/:token', async (req, res, next) => {
    const { token } = req.params;
    if (!isConfigToken(token)) return next('route');
    if (req.path.endsWith('/configure')) return next(); // already handled

    let config;
    try {
        config = maybeDecryptConfig(token);
        console.log('[SERVER] Parsed config:', config ? Object.keys(config) : 'null');
    } catch (error) {
        console.error('[SERVER] Config parsing failed:', error.message);
        return res.status(400).json({ error: 'Invalid configuration token' });
    }

    // Cache key includes md5 of token (not raw config) for privacy
    const ifaceKey = 'iface:' + crypto.createHash('md5').update(token).digest('hex');

    let iface = CACHE_ENABLED ? interfaceCache.get(ifaceKey) : null;
    if (!iface) {
        try {
            iface = await createAddon(config);
            if (CACHE_ENABLED) {
                interfaceCache.set(ifaceKey, iface);
            }
        } catch (e) {
            console.error('[SERVER] Addon build failed:', e.message);
            return res.status(500).json({ error: 'Addon build error' });
        }
    }

    req.addonInterface = iface;
    req.configToken = token;
    next();
});

// Logo proxy BEFORE router
app.get('/:token/logo/:tvgId.png', async (req, res) => {
    if (!req.addonInterface) {
        return res.redirect(`https://via.placeholder.com/300x400/333333/FFFFFF?text=${encodeURIComponent(req.params.tvgId)}`);
    }
    const sources = req.addonInterface._logoSources || [];
    if (!sources.length) {
        return res.redirect(`https://via.placeholder.com/300x400/333333/FFFFFF?text=${encodeURIComponent(req.params.tvgId)}`);
    }

    const { tvgId } = req.params;
    const rawId = tvgId;
    const noCountry = rawId.replace(/\.[a-z]{2,3}$/, '');
    const hyphenated = noCountry.replace(/[^a-zA-Z0-9]+/g, '-');
    const underscored = noCountry.replace(/[^a-zA-Z0-9]+/g, '_');
    const candidates = [...new Set([rawId, noCountry, hyphenated, underscored])];

    for (const cand of candidates) {
        for (const template of sources) {
            const url = template.replace('{id}', cand);
            try {
                let head = await fetch(url, { method: 'HEAD', timeout: 7000 });
                if (!head.ok) head = await fetch(url, { method: 'GET', timeout: 10000 });
                if (head.ok) {
                    const buf = await head.buffer();
                    if (buf.length > 50) {
                        const ct = head.headers.get('content-type') || 'image/png';
                        res.setHeader('Content-Type', ct);
                        res.setHeader('Cache-Control', 'public, max-age=21600');
                        return res.end(buf);
                    }
                }
            } catch { /* continue */ }
        }
    }
    res.redirect(`https://via.placeholder.com/300x400/333333/FFFFFF?text=${encodeURIComponent(noCountry.toUpperCase().slice(0,12))}`);
});

// Stremio router
app.use('/:token', (req, res) => {
    const iface = req.addonInterface;
    if (!iface) return res.status(500).json({ error: 'Interface not ready' });
    const router = getRouter(iface);
    req.url = req.url.replace(`/${req.params.token}`, '') || '/';
    router(req, res, (err) => {
        if (err) {
            console.error('[SERVER] Router error:', err);
            res.status(500).json({ error: 'Addon error' });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    });
});

// 404 fallback
app.use('*', (req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use((error, req, res, next) => {
    console.error('[SERVER] Unhandled error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel serverless function
module.exports = app;
