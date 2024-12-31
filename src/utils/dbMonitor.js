const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');
const dbCache = require('./dbCache');

class DatabaseMonitor {
  constructor() {
    this.metrics = {
      queryCount: 0,
      errorCount: 0,
      slowQueries: [],
      connectionStats: {
        active: 0,
        idle: 0,
        total: 0
      },
      lastCheck: Date.now()
    };
    
    this.thresholds = {
      slowQueryTime: 1000, // ms
      maxConnections: 100,
      maxQueueSize: 1000,
      cpuThreshold: 80, // percentage
      memoryThreshold: 80 // percentage
    };
  }

  async monitorQueryPerformance(sql, params, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    this.metrics.queryCount++;

    if (duration > this.thresholds.slowQueryTime) {
      this.metrics.slowQueries.push({
        sql,
        params,
        duration,
        timestamp: new Date(),
      });
    }

    return {
      duration,
      isSlow: duration > this.thresholds.slowQueryTime
    };
  }

  async getConnectionStats() {
    try {
      const pool = await dbPool.getPool();
      const stats = await pool.pool.getConnection().connection.query(`
        SHOW STATUS WHERE Variable_name IN 
        ('Threads_connected', 'Threads_running', 'Connections', 'Aborted_connects')
      `);

      this.metrics.connectionStats = {
        active: parseInt(stats.find(s => s.Variable_name === 'Threads_running').Value),
        total: parseInt(stats.find(s => s.Variable_name === 'Threads_connected').Value),
        historical: parseInt(stats.find(s => s.Variable_name === 'Connections').Value),
        failed: parseInt(stats.find(s => s.Variable_name === 'Aborted_connects').Value)
      };

      return this.metrics.connectionStats;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_connection_stats'
      });
    }
  }

  async getSystemMetrics() {
    try {
      const metrics = await dbPool.query(`
        SELECT 
          @@max_connections as max_connections,
          @@wait_timeout as wait_timeout,
          @@connect_timeout as connect_timeout,
          @@version as version,
          @@datadir as data_directory
      `);

      const processlist = await dbPool.query('SHOW FULL PROCESSLIST');
      
      return {
        system: metrics[0],
        processes: processlist.length,
        activeProcesses: processlist.filter(p => p.State !== 'Sleep').length,
        timestamp: new Date()
      };
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_system_metrics'
      });
    }
  }

  async getTableMetrics() {
    try {
      const sql = `
        SELECT 
          table_name,
          table_rows,
          data_length,
          index_length,
          CREATE_TIME as created_at,
          UPDATE_TIME as updated_at
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `;

      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_table_metrics'
      });
    }
  }

  async getDatabaseSize() {
    try {
      const sql = `
        SELECT 
          table_schema as database_name,
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
        GROUP BY table_schema
      `;

      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_database_size'
      });
    }
  }

  async getSlowQueries(limit = 10) {
    try {
      const sql = `
        SELECT 
          start_time,
          query_time,
          lock_time,
          rows_sent,
          rows_examined,
          sql_text
        FROM mysql.slow_log
        ORDER BY start_time DESC
        LIMIT ?
      `;

      return await dbPool.query(sql, [limit]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_slow_queries'
      });
    }
  }

  async getQueryStatistics() {
    try {
      const sql = `
        SELECT 
          digest_text as query_pattern,
          count_star as execution_count,
          avg_timer_wait/1000000000 as avg_latency_ms,
          sum_rows_affected as rows_affected,
          sum_rows_sent as rows_sent,
          sum_rows_examined as rows_examined,
          first_seen,
          last_seen
        FROM performance_schema.events_statements_summary_by_digest
        ORDER BY count_star DESC
        LIMIT 20
      `;

      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_query_statistics'
      });
    }
  }

  async checkHealth() {
    try {
      const results = {
        timestamp: new Date(),
        status: 'healthy',
        details: {}
      };

      // Check connection pool
      const connectionStats = await this.getConnectionStats();
      results.details.connections = {
        status: connectionStats.active < this.thresholds.maxConnections ? 'healthy' : 'warning',
        current: connectionStats.active,
        max: this.thresholds.maxConnections
      };

      // Check cache health
      const cacheStats = dbCache.getStats();
      results.details.cache = {
        status: cacheStats.hitRate > 50 ? 'healthy' : 'warning',
        hitRate: cacheStats.hitRate,
        size: cacheStats.size
      };

      // Check slow queries
      const recentSlowQueries = this.metrics.slowQueries.filter(
        q => q.timestamp > new Date(Date.now() - 3600000) // Last hour
      ).length;
      results.details.performance = {
        status: recentSlowQueries < 10 ? 'healthy' : 'warning',
        slowQueries: recentSlowQueries
      };

      // Overall status
      results.status = Object.values(results.details)
        .every(detail => detail.status === 'healthy') ? 'healthy' : 'warning';

      return results;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'check_health'
      });
    }
  }

  async getIndexUsage() {
    try {
      const sql = `
        SELECT 
          t.TABLE_NAME as table_name,
          s.INDEX_NAME as index_name,
          s.COLUMN_NAME as column_name,
          s.SEQ_IN_INDEX as sequence,
          s.CARDINALITY as cardinality,
          t.TABLE_ROWS as total_rows
        FROM information_schema.STATISTICS s
        JOIN information_schema.TABLES t 
          ON s.TABLE_SCHEMA = t.TABLE_SCHEMA 
          AND s.TABLE_NAME = t.TABLE_NAME
        WHERE s.TABLE_SCHEMA = DATABASE()
        ORDER BY t.TABLE_NAME, s.INDEX_NAME, s.SEQ_IN_INDEX
      `;

      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_index_usage'
      });
    }
  }

  async getDeadlocks() {
    try {
      const sql = `
        SHOW ENGINE INNODB STATUS
      `;

      const result = await dbPool.query(sql);
      const status = result[0].Status;

      // Parse deadlock information from status
      const deadlockInfo = status.match(/LATEST DETECTED DEADLOCK\n-+\n([\s\S]*?)\n-{2,}/);
      
      return deadlockInfo ? deadlockInfo[1].trim() : 'No deadlocks detected';
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_deadlocks'
      });
    }
  }

  setThresholds(newThresholds) {
    this.thresholds = {
      ...this.thresholds,
      ...newThresholds
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.lastCheck,
      cacheStats: dbCache.getStats()
    };
  }

  resetMetrics() {
    this.metrics = {
      queryCount: 0,
      errorCount: 0,
      slowQueries: [],
      connectionStats: {
        active: 0,
        idle: 0,
        total: 0
      },
      lastCheck: Date.now()
    };
  }
}

// Create and export singleton instance
const dbMonitor = new DatabaseMonitor();
module.exports = dbMonitor;
