# Vercel Deployment Guide

This guide explains how to deploy your Stremio IPTV addon to Vercel for serverless hosting.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI** (optional): `npm i -g vercel`

## Deployment Steps

### Method 1: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/stremio-iptv-addon.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Set Environment Variables**:
   - In your Vercel project dashboard, go to Settings > Environment Variables
   - Add the following variables:
     ```
     CONFIG_SECRET=your-secret-key-here
     CACHE_ENABLED=true
     CACHE_TTL_MS=21600000
     MAX_CACHE_ENTRIES=50
     NODE_ENV=production
     ```

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add CONFIG_SECRET
   vercel env add CACHE_ENABLED
   vercel env add NODE_ENV
   ```

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `CONFIG_SECRET` | Secret key for encrypting configuration tokens | No | - |
| `CACHE_ENABLED` | Enable/disable caching | No | `true` |
| `CACHE_TTL_MS` | Cache TTL in milliseconds | No | `21600000` (6 hours) |
| `MAX_CACHE_ENTRIES` | Maximum cache entries | No | `50` |
| `NODE_ENV` | Node environment | No | `production` |

### Important Notes

- **Redis**: Not recommended on Vercel due to serverless connection limits
- **Caching**: Uses in-memory LRU cache (resets on each function invocation)
- **Cold Starts**: First request may be slower due to serverless cold starts
- **Timeouts**: Functions have a 30-second timeout limit

## Usage

After deployment, your addon will be available at:
```
https://your-app.vercel.app/
```

### Configuration URLs

- **Main configuration**: `https://your-app.vercel.app/`
- **Reconfigure with token**: `https://your-app.vercel.app/{token}/configure`
- **Manifest URL**: `https://your-app.vercel.app/{token}/manifest.json`

### Example Configuration

1. Visit your Vercel URL
2. Enter your IPTV provider details:
   - **Xtream URL**: `http://your-provider.com:8080`
   - **Username**: `your-username`
   - **Password**: `your-password`
3. Click "Generate Addon URL"
4. Add the generated URL to Stremio

## Troubleshooting

### Common Issues

1. **Function Timeout**: Reduce cache TTL or disable caching temporarily
2. **Memory Limits**: Reduce `MAX_CACHE_ENTRIES`
3. **Cold Starts**: First request after inactivity will be slower

### Logs

View function logs in your Vercel dashboard under the "Functions" tab.

### Performance Optimization

- Enable `CONFIG_SECRET` for encrypted tokens
- Use reasonable cache settings
- Monitor function execution time in Vercel dashboard

## Limitations

- **Serverless Nature**: No persistent storage between requests
- **Function Timeout**: 30-second limit for Hobby plan (longer for Pro)
- **Memory**: 1024MB limit for Hobby plan
- **Concurrent Executions**: Limited by Vercel plan

## Support

For issues specific to Vercel deployment, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
