const { query } = require('../config/database');
const { DatabaseError } = require('./dbErrorHandler');

class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

class DatabaseValidation {
  // Patient data validation
  static validatePatientData(data) {
    const errors = [];

    // Required fields
    const requiredFields = [
      'first_name',
      'last_name',
      'date_of_birth',
      'gender',
      'contact_number'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(new ValidationError(`${field} is required`, field, data[field]));
      }
    }

    // Date of birth validation
    if (data.date_of_birth) {
      const dob = new Date(data.date_of_birth);
      const now = new Date();
      if (dob > now) {
        errors.push(new ValidationError('Date of birth cannot be in the future', 'date_of_birth', data.date_of_birth));
      }
    }

    // Gender validation
    if (data.gender && !['M', 'F', 'O'].includes(data.gender)) {
      errors.push(new ValidationError('Invalid gender value', 'gender', data.gender));
    }

    // Email format validation
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push(new ValidationError('Invalid email format', 'email', data.email));
      }
    }

    // Phone number format validation
    if (data.contact_number) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(data.contact_number)) {
        errors.push(new ValidationError('Invalid phone number format', 'contact_number', data.contact_number));
      }
    }

    return errors;
  }

  // Test result validation
  static validateTestResult(data) {
    const errors = [];

    // Required fields
    const requiredFields = ['patient_id', 'created_by'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(new ValidationError(`${field} is required`, field, data[field]));
      }
    }

    // Immunoglobulin values validation
    const immunoglobulins = ['IgG', 'IgA', 'IgM', 'IgE'];
    for (const ig of immunoglobulins) {
      if (data[ig] !== undefined && data[ig] !== null) {
        if (isNaN(data[ig]) || data[ig] < 0) {
          errors.push(new ValidationError(`Invalid ${ig} value`, ig, data[ig]));
        }
      }
    }

    return errors;
  }

  // Reference range validation
  static validateReferenceRange(data) {
    const errors = [];

    // Required fields
    const requiredFields = [
      'test_type',
      'min_value',
      'max_value',
      'unit'
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(new ValidationError(`${field} is required`, field, data[field]));
      }
    }

    // Numeric validations
    if (data.min_value >= data.max_value) {
      errors.push(new ValidationError('Minimum value must be less than maximum value', 'min_value', data.min_value));
    }

    if (data.min_age !== undefined && data.max_age !== undefined) {
      if (data.min_age >= data.max_age) {
        errors.push(new ValidationError('Minimum age must be less than maximum age', 'min_age', data.min_age));
      }
    }

    // Test type validation
    const validTestTypes = ['IgG', 'IgA', 'IgM', 'IgE'];
    if (!validTestTypes.includes(data.test_type)) {
      errors.push(new ValidationError('Invalid test type', 'test_type', data.test_type));
    }

    return errors;
  }

  // Emergency contact validation
  static validateEmergencyContact(data) {
    const errors = [];

    // Required fields
    const requiredFields = ['name', 'relationship', 'phone'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(new ValidationError(`${field} is required`, field, data[field]));
      }
    }

    // Phone number validation
    if (data.phone) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push(new ValidationError('Invalid phone number format', 'phone', data.phone));
      }
    }

    // Email validation if provided
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push(new ValidationError('Invalid email format', 'email', data.email));
      }
    }

    return errors;
  }

  // Database constraint checks
  static async checkDatabaseConstraints() {
    const constraints = [];

    try {
      // Check foreign key constraints
      const fkQuery = `
        SELECT 
          TABLE_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE REFERENCED_TABLE_NAME IS NOT NULL
          AND TABLE_SCHEMA = DATABASE()
      `;
      const foreignKeys = await query(fkQuery);
      constraints.push({ type: 'Foreign Keys', count: foreignKeys.length });

      // Check unique constraints
      const uniqueQuery = `
        SELECT 
          TABLE_NAME,
          CONSTRAINT_NAME
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE CONSTRAINT_TYPE = 'UNIQUE'
          AND TABLE_SCHEMA = DATABASE()
      `;
      const uniqueConstraints = await query(uniqueQuery);
      constraints.push({ type: 'Unique Constraints', count: uniqueConstraints.length });

      return constraints;
    } catch (error) {
      console.error('Error checking database constraints:', error);
      throw error;
    }
  }

  // Data integrity checks
  static async checkDataIntegrity() {
    const checks = [];

    try {
      // Check for orphaned records
      const orphanedTestResults = await query(`
        SELECT COUNT(*) as count
        FROM test_results tr
        LEFT JOIN patients p ON tr.patient_id = p.id
        WHERE p.id IS NULL
      `);
      checks.push({
        type: 'Orphaned Test Results',
        count: orphanedTestResults[0].count
      });

      // Check for duplicate patient IDs
      const duplicatePatients = await query(`
        SELECT patient_id, COUNT(*) as count
        FROM patients
        GROUP BY patient_id
        HAVING count > 1
      `);
      checks.push({
        type: 'Duplicate Patient IDs',
        count: duplicatePatients.length
      });

      return checks;
    } catch (error) {
      console.error('Error checking data integrity:', error);
      throw error;
    }
  }

  // Error logging
  static async logValidationError(error, context) {
    try {
      const sql = `
        INSERT INTO validation_errors (
          error_message,
          error_context,
          error_date
        ) VALUES (?, ?, NOW())
      `;
      await query(sql, [error.message, JSON.stringify(context)]);
    } catch (error) {
      console.error('Error logging validation error:', error);
    }
  }

  static throwIfErrors(errors) {
    if (errors.length > 0) {
      throw new DatabaseError('Validation failed', 'VALIDATION_ERROR', {
        errors: errors.map(err => ({
          field: err.field,
          message: err.message,
          value: err.value
        }))
      });
    }
  }
}

module.exports = DatabaseValidation;
