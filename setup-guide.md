# Reverse Proxy Setup Guide

You have two services running:
- **Main website**: Port 80
- **Stremio IPTV addon**: Port 3001 (changed from 443)

## Setup Options

### Option 1: Path-based routing (Recommended)
- Main website: `http://inazuma-system.site/`
- Stremio addon: `http://inazuma-system.site/stremio/`

### Option 2: Subdomain routing
- Main website: `http://inazuma-system.site/`
- Stremio addon: `http://stremio.inazuma-system.site/`

## Implementation Steps

### For Nginx:
1. **Install Nginx** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt install nginx
   
   # CentOS/RHEL
   sudo yum install nginx
   ```

2. **Copy the nginx.conf** to your Nginx sites directory:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/inazuma-system.site
   sudo ln -s /etc/nginx/sites-available/inazuma-system.site /etc/nginx/sites-enabled/
   ```

3. **Test and reload**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### For Apache:
1. **Enable required modules**:
   ```bash
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo a2enmod rewrite
   ```

2. **Copy the apache.conf**:
   ```bash
   sudo cp apache.conf /etc/apache2/sites-available/inazuma-system.site.conf
   sudo a2ensite inazuma-system.site.conf
   ```

3. **Reload Apache**:
   ```bash
   sudo systemctl reload apache2
   ```

## Start Your Services

1. **Start your main website** on port 80
2. **Start Stremio addon**:
   ```bash
   cd stremio-iptv-main
   npm start
   # Will now run on port 3001
   ```

## Access URLs

### Path-based routing:
- Website: `http://inazuma-system.site/`
- Stremio config: `http://inazuma-system.site/stremio/`
- Stremio manifest: `http://inazuma-system.site/stremio/<token>/manifest.json`

### Subdomain routing (if chosen):
- Website: `http://inazuma-system.site/`
- Stremio config: `http://stremio.inazuma-system.site/`
- Stremio manifest: `http://stremio.inazuma-system.site/<token>/manifest.json`

## DNS Configuration

For subdomain routing, add an A record:
- **Name**: `stremio`
- **Type**: `A`
- **Value**: `24.77.123.235`

## SSL/HTTPS Setup

To enable HTTPS, uncomment the SSL sections in the config files and:
1. Obtain SSL certificates (Let's Encrypt recommended)
2. Update certificate paths in the configuration
3. Reload your web server
