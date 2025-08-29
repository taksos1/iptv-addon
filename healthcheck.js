const fetch = require('node-fetch');

class HealthChecker {
    constructor(config) {
        this.config = config;
        this.lastCheck = null;
        this.isHealthy = true;
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
    }

    async checkXtreamHealth() {
        if (!this.config?.xtreamUrl) return false;
        
        try {
            const { xtreamUrl, xtreamUsername, xtreamPassword } = this.config;
            const testUrl = `${xtreamUrl}/player_api.php?username=${encodeURIComponent(xtreamUsername)}&password=${encodeURIComponent(xtreamPassword)}&action=get_live_categories`;
            
            const response = await fetch(testUrl, { 
                timeout: 10000,
                headers: { 'User-Agent': 'Stremio/1.0' }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.isHealthy = Array.isArray(data) && data.length >= 0;
                this.lastCheck = Date.now();
                return this.isHealthy;
            }
            
            this.isHealthy = false;
            return false;
        } catch (error) {
            console.error('[HEALTH] Xtream server check failed:', error.message);
            this.isHealthy = false;
            return false;
        }
    }

    shouldRetry(error) {
        // Retry on network errors, timeouts, 5xx errors
        return error.code === 'ECONNRESET' || 
               error.code === 'ETIMEDOUT' || 
               error.message.includes('timeout') ||
               (error.status >= 500 && error.status < 600);
    }

    async withRetry(operation, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`[RETRY] Attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                if (attempt === maxRetries || !this.shouldRetry(error)) {
                    throw error;
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    getStatus() {
        return {
            healthy: this.isHealthy,
            lastCheck: this.lastCheck,
            nextCheck: this.lastCheck ? this.lastCheck + this.checkInterval : null
        };
    }
}

module.exports = HealthChecker;
