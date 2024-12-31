const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');
const dbMonitor = require('./dbMonitor');

class DatabaseOptimizer {
  constructor() {
    this.optimizationRules = {
      indexThreshold: 1000, // Minimum rows for index consideration
      cacheThreshold: 100, // Minimum query frequency for caching
      tableFragmentationThreshold: 20, // Percentage
      deadlockThreshold: 5 // Number of deadlocks before alert
    };
  }

  async analyzeQueryPerformance(sql, params = []) {
    try {
      const startTime = process.hrtime();
      
      const results = await dbPool.query(`EXPLAIN ANALYZE ${sql}`, params);
      
      const endTime = process.hrtime(startTime);
      const executionTime = (endTime[0] * 1000) + (endTime[1] / 1000000);

      return {
        executionPlan: results,
        executionTime,
        timestamp: new Date(),
        sql,
        params
      };
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'analyze_query_performance'
      });
    }
  }

  async suggestIndexes() {
    try {
      const sql = `
        SELECT 
          t.TABLE_NAME,
          t.TABLE_ROWS,
          GROUP_CONCAT(DISTINCT c.COLUMN_NAME) as frequently_queried_columns,
          COUNT(DISTINCT s.INDEX_NAME) as existing_indexes
        FROM information_schema.TABLES t
        JOIN information_schema.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
        LEFT JOIN information_schema.STATISTICS s 
          ON t.TABLE_NAME = s.TABLE_NAME 
          AND c.COLUMN_NAME = s.COLUMN_NAME
        WHERE t.TABLE_SCHEMA = DATABASE()
        AND t.TABLE_ROWS > ?
        GROUP BY t.TABLE_NAME, t.TABLE_ROWS
        HAVING COUNT(DISTINCT s.INDEX_NAME) = 0
      `;

      const tables = await dbPool.query(sql, [this.optimizationRules.indexThreshold]);
      
      const suggestions = [];
      
      for (const table of tables) {
        // Analyze query patterns for this table
        const queryPatterns = await this.analyzeQueryPatterns(table.TABLE_NAME);
        
        // Suggest indexes based on query patterns
        const suggestedIndexes = this.generateIndexSuggestions(
          table.TABLE_NAME,
          queryPatterns,
          table.frequently_queried_columns.split(',')
        );
        
        suggestions.push({
          table: table.TABLE_NAME,
          rowCount: table.TABLE_ROWS,
          suggestedIndexes
        });
      }
      
      return suggestions;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'suggest_indexes'
      });
    }
  }

  async analyzeQueryPatterns(tableName) {
    try {
      const sql = `
        SELECT 
          digest_text,
          count_star as execution_count,
          sum_timer_wait/1000000000 as total_latency_ms
        FROM performance_schema.events_statements_summary_by_digest
        WHERE digest_text LIKE ?
        ORDER BY count_star DESC
        LIMIT 10
      `;

      return await dbPool.query(sql, [`%${tableName}%`]);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'analyze_query_patterns'
      });
    }
  }

  generateIndexSuggestions(tableName, queryPatterns, columns) {
    const suggestions = [];
    
    for (const pattern of queryPatterns) {
      const whereClauseMatch = pattern.digest_text.match(/WHERE\s+([^;]+)/i);
      
      if (whereClauseMatch) {
        const whereClause = whereClauseMatch[1];
        const involvedColumns = columns.filter(col => 
          whereClause.toLowerCase().includes(col.toLowerCase())
        );
        
        if (involvedColumns.length > 0) {
          suggestions.push({
            columns: involvedColumns,
            reason: `Frequently used in WHERE clause (${pattern.execution_count} executions)`,
            estimatedImpact: `May reduce latency from ${pattern.total_latency_ms}ms`
          });
        }
      }
    }
    
    return suggestions;
  }

  async optimizeTable(tableName) {
    try {
      // Check table fragmentation
      const fragmentation = await this.getTableFragmentation(tableName);
      
      if (fragmentation > this.optimizationRules.tableFragmentationThreshold) {
        await dbPool.query(`OPTIMIZE TABLE ${tableName}`);
        return {
          optimized: true,
          fragmentation: {
            before: fragmentation,
            after: await this.getTableFragmentation(tableName)
          }
        };
      }
      
      return {
        optimized: false,
        fragmentation: {
          current: fragmentation,
          threshold: this.optimizationRules.tableFragmentationThreshold
        }
      };
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'optimize_table'
      });
    }
  }

  async getTableFragmentation(tableName) {
    try {
      const sql = `
        SELECT 
          DATA_FREE * 100.0 / DATA_LENGTH as fragmentation_percent
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `;

      const [result] = await dbPool.query(sql, [tableName]);
      return result.fragmentation_percent || 0;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_table_fragmentation'
      });
    }
  }

  async analyzeTableStatistics(tableName) {
    try {
      await dbPool.query(`ANALYZE TABLE ${tableName}`);
      
      const sql = `
        SELECT 
          TABLE_NAME,
          TABLE_ROWS,
          AVG_ROW_LENGTH,
          DATA_LENGTH,
          MAX_DATA_LENGTH,
          INDEX_LENGTH,
          DATA_FREE,
          AUTO_INCREMENT,
          CREATE_TIME,
          UPDATE_TIME,
          CHECK_TIME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
      `;

      const [stats] = await dbPool.query(sql, [tableName]);
      return stats;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'analyze_table_statistics'
      });
    }
  }

  async optimizeQueries() {
    try {
      const slowQueries = await dbMonitor.getSlowQueries();
      const optimizationSuggestions = [];
      
      for (const query of slowQueries) {
        const analysis = await this.analyzeQueryPerformance(query.sql_text);
        const suggestions = this.generateQueryOptimizationSuggestions(analysis);
        
        optimizationSuggestions.push({
          originalQuery: query.sql_text,
          executionTime: query.query_time,
          suggestions
        });
      }
      
      return optimizationSuggestions;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'optimize_queries'
      });
    }
  }

  generateQueryOptimizationSuggestions(queryAnalysis) {
    const suggestions = [];
    
    // Check for table scans
    if (queryAnalysis.executionPlan.some(step => step.type === 'ALL')) {
      suggestions.push({
        type: 'INDEX',
        description: 'Consider adding an index to avoid table scan',
        impact: 'High'
      });
    }
    
    // Check for temporary tables
    if (queryAnalysis.executionPlan.some(step => step.Extra?.includes('Using temporary'))) {
      suggestions.push({
        type: 'QUERY_STRUCTURE',
        description: 'Rewrite query to avoid temporary tables',
        impact: 'Medium'
      });
    }
    
    // Check for file sorts
    if (queryAnalysis.executionPlan.some(step => step.Extra?.includes('Using filesort'))) {
      suggestions.push({
        type: 'INDEX',
        description: 'Add index to avoid file sort',
        impact: 'Medium'
      });
    }
    
    return suggestions;
  }

  async optimizeConfiguration() {
    try {
      const currentConfig = await this.getCurrentConfiguration();
      const suggestions = [];
      
      // Check buffer pool size
      if (currentConfig.innodb_buffer_pool_size < currentConfig.total_memory * 0.7) {
        suggestions.push({
          parameter: 'innodb_buffer_pool_size',
          currentValue: currentConfig.innodb_buffer_pool_size,
          suggestedValue: Math.floor(currentConfig.total_memory * 0.7),
          impact: 'High',
          description: 'Increase buffer pool size for better performance'
        });
      }
      
      // Check query cache
      if (currentConfig.query_cache_type === 'ON' && currentConfig.query_cache_hit_rate < 30) {
        suggestions.push({
          parameter: 'query_cache_type',
          currentValue: 'ON',
          suggestedValue: 'OFF',
          impact: 'Medium',
          description: 'Disable query cache due to low hit rate'
        });
      }
      
      return suggestions;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'optimize_configuration'
      });
    }
  }

  async getCurrentConfiguration() {
    try {
      const variables = await dbPool.query('SHOW VARIABLES');
      const status = await dbPool.query('SHOW STATUS');
      
      const config = {};
      variables.forEach(v => config[v.Variable_name] = v.Value);
      status.forEach(s => config[s.Variable_name] = s.Value);
      
      return config;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_current_configuration'
      });
    }
  }

  setOptimizationRules(rules) {
    this.optimizationRules = {
      ...this.optimizationRules,
      ...rules
    };
  }

  async getOptimizationReport() {
    try {
      const report = {
        timestamp: new Date(),
        indexSuggestions: await this.suggestIndexes(),
        queryOptimizations: await this.optimizeQueries(),
        configurationSuggestions: await this.optimizeConfiguration(),
        tableStatistics: {}
      };
      
      // Get list of tables
      const tables = await dbPool.query(`
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
      `);
      
      // Analyze each table
      for (const table of tables) {
        report.tableStatistics[table.TABLE_NAME] = {
          statistics: await this.analyzeTableStatistics(table.TABLE_NAME),
          fragmentation: await this.getTableFragmentation(table.TABLE_NAME)
        };
      }
      
      return report;
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'get_optimization_report'
      });
    }
  }
}

// Create and export singleton instance
const dbOptimizer = new DatabaseOptimizer();
module.exports = dbOptimizer;
