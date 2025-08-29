class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            avgResponseTime: 0,
            errors: 0,
            lastReset: Date.now()
        };
        this.responseTimes = [];
        this.maxSamples = 100;
    }

    recordRequest(startTime) {
        const responseTime = Date.now() - startTime;
        this.metrics.requests++;
        
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > this.maxSamples) {
            this.responseTimes.shift();
        }
        
        this.metrics.avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    }

    recordCacheHit() {
        this.metrics.cacheHits++;
    }

    recordCacheMiss() {
        this.metrics.cacheMisses++;
    }

    recordError() {
        this.metrics.errors++;
    }

    getCacheHitRate() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        return total > 0 ? (this.metrics.cacheHits / total * 100).toFixed(1) : 0;
    }

    getStats() {
        const uptime = Date.now() - this.metrics.lastReset;
        return {
            ...this.metrics,
            cacheHitRate: this.getCacheHitRate() + '%',
            uptime: Math.floor(uptime / 1000) + 's',
            requestsPerMinute: Math.round(this.metrics.requests / (uptime / 60000))
        };
    }

    reset() {
        this.metrics = {
            requests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            avgResponseTime: 0,
            errors: 0,
            lastReset: Date.now()
        };
        this.responseTimes = [];
    }
}

module.exports = PerformanceMonitor;
