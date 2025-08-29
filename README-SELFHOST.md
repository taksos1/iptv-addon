# 🚀 Self-Hosting IPTV Addon

This addon is optimized for self-hosting to avoid server overload issues. It includes built-in caching and memory optimization.

## 🐳 Docker Deployment (Recommended)

### Quick Start
```bash
# Clone or download the addon
cd stremio-iptv-main

# Build and run with Docker Compose
docker-compose up -d
```

### Manual Docker Build
```bash
# Build the image
docker build -t iptv-addon .

# Run the container
docker run -d -p 443:443 --name iptv-addon iptv-addon
```

## 🌐 Vercel Deployment

1. Fork this repository on GitHub
2. Connect your GitHub to Vercel
3. Deploy from the `main` branch
4. Set environment variables in Vercel dashboard:
   - `CONFIG_SECRET`: Your encryption key
   - `CACHE_ENABLED`: true
   - `CACHE_TTL_MS`: 1800000

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your settings
# CONFIG_SECRET=your-secret-key-here
# CACHE_ENABLED=true
# CACHE_TTL_MS=1800000

# Start the server
npm start
```

## ⚡ Performance Optimizations

### Built-in Caching
- **30-minute cache** reduces IPTV server load
- **Memory-efficient** with automatic cleanup
- **Smart fallbacks** for different provider formats

### Memory Management
- **512MB memory limit** in Docker
- **Optimized Node.js flags** for low memory usage
- **Automatic cache cleanup** prevents memory leaks

### Server Load Reduction
- **Cached responses** for repeated requests
- **Shorter timeouts** to avoid hanging connections
- **Fallback methods** for unreliable servers

## 🛠️ Configuration

Access the configuration UI at: `http://localhost:443/configure`

### Supported IPTV Formats
- ✅ **Xtream Codes API** (JSON format)
- ✅ **M3U Playlists** (fallback)
- ✅ **Mixed provider formats**
- ✅ **Auto-detection** of categories

### Features
- 📺 **Live TV channels** with categories
- 🎬 **Movies** with proper classification
- 📺 **TV Series** detection
- 🔍 **Search functionality**
- 🏷️ **Genre filtering**
- 🖼️ **Logo support**

## 🐛 Troubleshooting

### Categories Not Showing
The addon tries multiple methods:
1. Xtream API categories
2. M3U group-title extraction
3. Content-based detection
4. Fallback categories

### Memory Issues
- Use Docker with memory limits
- Enable caching to reduce API calls
- Restart periodically if needed

### Server Overload
- Cache reduces server requests by 90%
- Self-hosting eliminates shared server issues
- Multiple fallback methods ensure reliability

## 📊 Monitoring

Check logs for:
- `[IPTV] Using cached data` - Cache working
- `[IPTV] Data cached for 30 minutes` - Fresh data cached
- Category counts and content loaded

## 🔒 Security

- Encrypted configuration tokens
- No database required
- Stateless design
- Environment variable configuration
