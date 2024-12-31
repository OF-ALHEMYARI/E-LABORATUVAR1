const { DatabaseErrorHandler } = require('./dbErrorHandler');

class DatabaseCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    this.defaultTTL = 300000; // 5 minutes in milliseconds
    this.maxSize = 1000; // Maximum number of cache entries
  }

  generateKey(sql, params) {
    return `${sql}_${JSON.stringify(params || [])}`;
  }

  set(sql, params, data, ttl = this.defaultTTL) {
    try {
      const key = this.generateKey(sql, params);
      
      // Check cache size and evict oldest entries if necessary
      if (this.cache.size >= this.maxSize) {
        const oldestKey = [...this.cache.keys()][0];
        this.cache.delete(oldestKey);
        this.stats.size--;
      }

      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
        hits: 0
      });
      
      this.stats.size++;

      // Set expiration
      setTimeout(() => {
        this.invalidate(key);
      }, ttl);

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  get(sql, params) {
    try {
      const key = this.generateKey(sql, params);
      const cached = this.cache.get(key);

      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const now = Date.now();
      if (now - cached.timestamp > cached.ttl) {
        this.invalidate(key);
        this.stats.misses++;
        return null;
      }

      cached.hits++;
      this.stats.hits++;
      return cached.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  invalidate(key) {
    try {
      if (this.cache.has(key)) {
        this.cache.delete(key);
        this.stats.size--;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cache invalidate error:', error);
      return false;
    }
  }

  invalidatePattern(pattern) {
    try {
      const regex = new RegExp(pattern);
      let count = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.invalidate(key);
          count++;
        }
      }

      return count;
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
      return 0;
    }
  }

  invalidateTable(tableName) {
    return this.invalidatePattern(tableName);
  }

  clear() {
    try {
      this.cache.clear();
      this.stats.size = 0;
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses === 0 ? 0 :
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      entries: [...this.cache.entries()].map(([key, value]) => ({
        key,
        hits: value.hits,
        age: Date.now() - value.timestamp,
        ttl: value.ttl
      }))
    };
  }

  async warmup(queries) {
    try {
      const results = [];
      for (const query of queries) {
        const { sql, params, ttl } = query;
        const data = await query.execute();
        this.set(sql, params, data, ttl);
        results.push({
          sql,
          success: true
        });
      }
      return results;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'cache_warmup'
      });
    }
  }

  setDefaultTTL(ttl) {
    if (typeof ttl === 'number' && ttl > 0) {
      this.defaultTTL = ttl;
      return true;
    }
    return false;
  }

  setMaxSize(size) {
    if (typeof size === 'number' && size > 0) {
      this.maxSize = size;
      // Evict entries if current size exceeds new max
      while (this.cache.size > this.maxSize) {
        const oldestKey = [...this.cache.keys()][0];
        this.invalidate(oldestKey);
      }
      return true;
    }
    return false;
  }

  getTTL(sql, params) {
    const key = this.generateKey(sql, params);
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    const remaining = cached.ttl - (now - cached.timestamp);
    return remaining > 0 ? remaining : 0;
  }

  touch(sql, params, extension = this.defaultTTL) {
    const key = this.generateKey(sql, params);
    const cached = this.cache.get(key);
    if (!cached) return false;

    cached.timestamp = Date.now();
    cached.ttl = extension;
    return true;
  }

  getSize() {
    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      utilization: (this.cache.size / this.maxSize) * 100
    };
  }

  getKeys() {
    return [...this.cache.keys()];
  }

  has(sql, params) {
    const key = this.generateKey(sql, params);
    return this.cache.has(key);
  }

  // Cache preloading for common queries
  async preloadCommonQueries() {
    const commonQueries = [
      {
        sql: 'SELECT id, username, role FROM users WHERE is_active = ?',
        params: [true],
        ttl: 3600000 // 1 hour
      },
      {
        sql: 'SELECT * FROM reference_ranges WHERE is_active = ?',
        params: [true],
        ttl: 1800000 // 30 minutes
      }
    ];

    return await this.warmup(commonQueries);
  }
}

// Create and export singleton instance
const dbCache = new DatabaseCache();
module.exports = dbCache;
