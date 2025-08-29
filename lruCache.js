class LRUCache {
    constructor(maxSize = 100, ttl = 30 * 60 * 1000) { // 30 minutes default TTL
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.cache = new Map();
        this.timers = new Map();
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Check if expired
        if (Date.now() > item.expiry) {
            this.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        
        return item.value;
    }

    set(key, value) {
        // Clear existing timer if exists
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Remove if already exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.delete(firstKey);
        }

        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { value, expiry });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.delete(key);
        }, this.ttl);
        
        this.timers.set(key, timer);
    }

    delete(key) {
        this.cache.delete(key);
        
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
    }

    clear() {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        
        this.cache.clear();
        this.timers.clear();
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        
        // Check if expired
        if (Date.now() > item.expiry) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    size() {
        return this.cache.size;
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    // Get cache statistics
    stats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl
        };
    }
}

module.exports = LRUCache;
