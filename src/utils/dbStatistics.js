const dbPool = require('../config/dbPool');
const { DatabaseErrorHandler } = require('./dbErrorHandler');

class DatabaseStatistics {
  static async getTableStatistics() {
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
        context: 'table_statistics'
      });
    }
  }

  static async getTestResultStatistics(startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          COUNT(*) as total_tests,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tests,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tests,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_tests,
          AVG(IgG) as avg_IgG,
          AVG(IgA) as avg_IgA,
          AVG(IgM) as avg_IgM,
          AVG(IgE) as avg_IgE,
          MIN(test_date) as first_test,
          MAX(test_date) as last_test,
          AVG(TIMESTAMPDIFF(MINUTE, created_at, 
            CASE WHEN status = 'completed' THEN review_date ELSE NULL END)
          ) as avg_completion_time
        FROM test_results
      `;

      const params = [];
      if (startDate || endDate) {
        sql += ' WHERE ';
        if (startDate) {
          sql += 'test_date >= ?';
          params.push(startDate);
        }
        if (startDate && endDate) {
          sql += ' AND ';
        }
        if (endDate) {
          sql += 'test_date <= ?';
          params.push(endDate);
        }
      }

      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'test_result_statistics'
      });
    }
  }

  static async getPatientDemographics() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_patients,
          AVG(TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE())) as avg_age,
          COUNT(CASE WHEN gender = 'M' THEN 1 END) as male_count,
          COUNT(CASE WHEN gender = 'F' THEN 1 END) as female_count,
          COUNT(CASE WHEN gender = 'O' THEN 1 END) as other_count,
          COUNT(CASE WHEN last_test_date IS NOT NULL THEN 1 END) as tested_patients,
          MIN(created_at) as first_registration,
          MAX(created_at) as last_registration
        FROM patients
      `;
      
      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'patient_demographics'
      });
    }
  }

  static async getUserActivityStats(startDate = null, endDate = null) {
    try {
      let sql = `
        SELECT 
          u.username,
          COUNT(CASE WHEN al.action LIKE 'test_%' THEN 1 END) as test_actions,
          COUNT(CASE WHEN al.action LIKE 'patient_%' THEN 1 END) as patient_actions,
          COUNT(CASE WHEN al.action LIKE 'reference_%' THEN 1 END) as reference_actions,
          COUNT(*) as total_actions,
          MIN(al.created_at) as first_action,
          MAX(al.created_at) as last_action
        FROM users u
        LEFT JOIN audit_logs al ON u.id = al.user_id
      `;

      const params = [];
      if (startDate || endDate) {
        sql += ' WHERE ';
        if (startDate) {
          sql += 'al.created_at >= ?';
          params.push(startDate);
        }
        if (startDate && endDate) {
          sql += ' AND ';
        }
        if (endDate) {
          sql += 'al.created_at <= ?';
          params.push(endDate);
        }
      }

      sql += ' GROUP BY u.id, u.username';
      
      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'user_activity_stats'
      });
    }
  }

  static async getReferenceRangeStats() {
    try {
      const sql = `
        SELECT 
          test_type,
          COUNT(*) as total_ranges,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_ranges,
          COUNT(CASE WHEN gender IS NOT NULL THEN 1 END) as gender_specific_ranges,
          MIN(min_value) as overall_min,
          MAX(max_value) as overall_max,
          MIN(created_at) as first_created,
          MAX(updated_at) as last_updated
        FROM reference_ranges
        GROUP BY test_type
      `;
      
      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'reference_range_stats'
      });
    }
  }

  static async getAbnormalResultStats(startDate = null, endDate = null) {
    try {
      let sql = `
        WITH result_analysis AS (
          SELECT 
            tr.*,
            rr.min_value as ref_min,
            rr.max_value as ref_max,
            CASE 
              WHEN tr.IgG < rr.min_value OR tr.IgG > rr.max_value THEN 1 
              ELSE 0 
            END as abnormal_IgG,
            CASE 
              WHEN tr.IgA < rr.min_value OR tr.IgA > rr.max_value THEN 1 
              ELSE 0 
            END as abnormal_IgA,
            CASE 
              WHEN tr.IgM < rr.min_value OR tr.IgM > rr.max_value THEN 1 
              ELSE 0 
            END as abnormal_IgM,
            CASE 
              WHEN tr.IgE < rr.min_value OR tr.IgE > rr.max_value THEN 1 
              ELSE 0 
            END as abnormal_IgE
          FROM test_results tr
          JOIN patients p ON tr.patient_id = p.id
          JOIN reference_ranges rr ON 
            TIMESTAMPDIFF(YEAR, p.date_of_birth, tr.test_date) BETWEEN rr.min_age AND rr.max_age
            AND (rr.gender IS NULL OR rr.gender = p.gender)
            AND rr.is_active = 1
        )
        SELECT 
          COUNT(*) as total_results,
          SUM(abnormal_IgG) as abnormal_IgG_count,
          SUM(abnormal_IgA) as abnormal_IgA_count,
          SUM(abnormal_IgM) as abnormal_IgM_count,
          SUM(abnormal_IgE) as abnormal_IgE_count,
          ROUND(AVG(abnormal_IgG) * 100, 2) as abnormal_IgG_percentage,
          ROUND(AVG(abnormal_IgA) * 100, 2) as abnormal_IgA_percentage,
          ROUND(AVG(abnormal_IgM) * 100, 2) as abnormal_IgM_percentage,
          ROUND(AVG(abnormal_IgE) * 100, 2) as abnormal_IgE_percentage
        FROM result_analysis
      `;

      const params = [];
      if (startDate || endDate) {
        sql += ' WHERE ';
        if (startDate) {
          sql += 'test_date >= ?';
          params.push(startDate);
        }
        if (startDate && endDate) {
          sql += ' AND ';
        }
        if (endDate) {
          sql += 'test_date <= ?';
          params.push(endDate);
        }
      }

      return await dbPool.query(sql, params);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'abnormal_result_stats'
      });
    }
  }

  static async getDatabaseSize() {
    try {
      const sql = `
        SELECT 
          SUM(data_length + index_length) as total_size,
          SUM(data_length) as data_size,
          SUM(index_length) as index_size
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
      `;
      
      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'database_size'
      });
    }
  }

  static async getQueryPerformanceStats() {
    try {
      const sql = `
        SELECT 
          digest_text as query_pattern,
          COUNT_STAR as execution_count,
          AVG_TIMER_WAIT/1000000000 as avg_latency_ms,
          MAX_TIMER_WAIT/1000000000 as max_latency_ms,
          SUM_ROWS_EXAMINED as rows_examined,
          SUM_ROWS_SENT as rows_sent,
          FIRST_SEEN as first_seen,
          LAST_SEEN as last_seen
        FROM performance_schema.events_statements_summary_by_digest
        WHERE SCHEMA_NAME = DATABASE()
        ORDER BY avg_latency_ms DESC
        LIMIT 100
      `;
      
      return await dbPool.query(sql);
    } catch (error) {
      throw DatabaseErrorHandler.handleDatabaseError(error, {
        context: 'query_performance_stats'
      });
    }
  }
}

module.exports = DatabaseStatistics;
