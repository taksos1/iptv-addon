const express = require('express');
const createAddon = require('./addon');
const path = require('path');

const PORT = process.env.PORT || 6386;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve configure page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'configure.html'));
});

// Configuration endpoint
app.post('/configure', async (req, res) => {
    try {
        const { m3uUrl, epgUrl, xtreamUrl, xtreamUsername, xtreamPassword } = req.body;
        
        let config = {};
        
        if (m3uUrl) {
            config.m3uUrl = m3uUrl;
            if (epgUrl) config.epgUrl = epgUrl;
        } else if (xtreamUrl && xtreamUsername && xtreamPassword) {
            config.xtreamUrl = xtreamUrl;
            config.xtreamUsername = xtreamUsername;
            config.xtreamPassword = xtreamPassword;
        } else {
            return res.status(400).json({ error: 'Please provide either M3U URL or Xtream credentials' });
        }
        
        const configToken = Buffer.from(JSON.stringify(config)).toString('base64');
        const manifestUrl = `${req.protocol}://${req.get('host')}/${configToken}/manifest.json`;
        
        res.json({ 
            success: true, 
            manifestUrl,
            installUrl: `stremio://${req.get('host')}/${configToken}/manifest.json`
        });
    } catch (error) {
        console.error('Configuration error:', error);
        res.status(500).json({ error: 'Configuration failed' });
    }
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Addon routes with token prefix
app.get('/:token/manifest.json', async (req, res) => {
    try {
        const { token } = req.params;
        const config = JSON.parse(Buffer.from(token, 'base64').toString());
        
        const addon = await createAddon(config);
        const manifest = addon.manifest;
        
        // Check manifest size
        const manifestSize = JSON.stringify(manifest).length;
        console.log(`[SERVER] Manifest size: ${manifestSize} bytes`);
        
        if (manifestSize > 8192) {
            console.error('[SERVER] Manifest size exceeds 8kb limit');
            return res.status(400).json({ 
                error: 'Manifest too large', 
                size: manifestSize,
                limit: 8192 
            });
        }
        
        res.json(manifest);
    } catch (error) {
        console.error('Manifest error:', error);
        res.status(500).json({ error: 'Failed to generate manifest' });
    }
});

app.get('/:token/catalog/:type/:id.json', async (req, res) => {
    try {
        const { token, type, id } = req.params;
        const config = JSON.parse(Buffer.from(token, 'base64').toString());
        
        const addon = await createAddon(config);
        const result = await addon.catalog({ type, id, extra: req.query });
        res.json(result);
    } catch (error) {
        console.error('Catalog error:', error);
        res.status(500).json({ error: 'Catalog request failed' });
    }
});

app.get('/:token/stream/:type/:id.json', async (req, res) => {
    try {
        const { token, type, id } = req.params;
        const config = JSON.parse(Buffer.from(token, 'base64').toString());
        
        const addon = await createAddon(config);
        const result = await addon.stream({ type, id });
        res.json(result);
    } catch (error) {
        console.error('Stream error:', error);
        res.status(500).json({ error: 'Stream request failed' });
    }
});

app.get('/:token/meta/:type/:id.json', async (req, res) => {
    try {
        const { token, type, id } = req.params;
        const config = JSON.parse(Buffer.from(token, 'base64').toString());
        
        const addon = await createAddon(config);
        const result = await addon.meta({ type, id });
        res.json(result);
    } catch (error) {
        console.error('Meta error:', error);
        res.status(500).json({ error: 'Meta request failed' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// For Vercel, export the app instead of listening
if (process.env.VERCEL) {
    module.exports = app;
} else {
    app.listen(PORT, HOST, () => {
        console.log(`[SERVER] IPTV Addon server running on ${HOST}:${PORT}`);
        console.log(`[SERVER] Configure at: http://87.106.36.114:${PORT}`);
        console.log(`[SERVER] Public URL: http://87.106.36.114:${PORT}`);
    });
}