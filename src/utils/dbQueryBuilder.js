class QueryBuilder {
  constructor() {
    this.query = '';
    this.params = [];
  }

  select(fields = ['*']) {
    this.query = `SELECT ${Array.isArray(fields) ? fields.join(', ') : fields}`;
    return this;
  }

  from(table) {
    this.query += ` FROM ${table}`;
    return this;
  }

  where(conditions, operator = 'AND') {
    if (Object.keys(conditions).length === 0) return this;

    const whereConditions = [];
    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        whereConditions.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        whereConditions.push(`${key} IN (?)`);
        this.params.push(value);
      } else if (typeof value === 'object') {
        const [op, val] = Object.entries(value)[0];
        whereConditions.push(`${key} ${op} ?`);
        this.params.push(val);
      } else {
        whereConditions.push(`${key} = ?`);
        this.params.push(value);
      }
    }

    this.query += ` WHERE ${whereConditions.join(` ${operator} `)}`;
    return this;
  }

  join(table, condition, type = 'INNER') {
    this.query += ` ${type} JOIN ${table} ON ${condition}`;
    return this;
  }

  leftJoin(table, condition) {
    return this.join(table, condition, 'LEFT');
  }

  rightJoin(table, condition) {
    return this.join(table, condition, 'RIGHT');
  }

  groupBy(fields) {
    const groupFields = Array.isArray(fields) ? fields.join(', ') : fields;
    this.query += ` GROUP BY ${groupFields}`;
    return this;
  }

  having(conditions) {
    const havingConditions = [];
    for (const [key, value] of Object.entries(conditions)) {
      havingConditions.push(`${key} = ?`);
      this.params.push(value);
    }
    this.query += ` HAVING ${havingConditions.join(' AND ')}`;
    return this;
  }

  orderBy(fields, direction = 'ASC') {
    const orderFields = Array.isArray(fields) ? fields.join(', ') : fields;
    this.query += ` ORDER BY ${orderFields} ${direction}`;
    return this;
  }

  limit(limit, offset = 0) {
    this.query += ` LIMIT ?, ?`;
    this.params.push(offset, limit);
    return this;
  }

  insert(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = new Array(fields.length).fill('?').join(', ');

    this.query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    this.params = values;
    return this;
  }

  update(table, data) {
    const setFields = Object.keys(data)
      .map(field => `${field} = ?`)
      .join(', ');

    this.query = `UPDATE ${table} SET ${setFields}`;
    this.params = Object.values(data);
    return this;
  }

  delete(table) {
    this.query = `DELETE FROM ${table}`;
    return this;
  }

  // Special queries for our application
  searchPatients(searchTerm) {
    return this
      .select([
        'p.*',
        'ec.name as emergency_contact_name',
        'ec.phone as emergency_contact_phone'
      ])
      .from('patients p')
      .leftJoin('emergency_contacts ec', 'p.id = ec.patient_id')
      .where({
        'p.first_name LIKE': `%${searchTerm}%`,
        'OR p.last_name LIKE': `%${searchTerm}%`,
        'OR p.patient_id LIKE': `%${searchTerm}%`,
        'OR p.contact_number LIKE': `%${searchTerm}%`
      });
  }

  getPatientTestHistory(patientId) {
    return this
      .select([
        'tr.*',
        'u.username as created_by_name',
        'ru.username as reviewed_by_name'
      ])
      .from('test_results tr')
      .leftJoin('users u', 'tr.created_by = u.id')
      .leftJoin('users ru', 'tr.reviewed_by = ru.id')
      .where({ 'tr.patient_id': patientId })
      .orderBy('tr.test_date', 'DESC');
  }

  getReferenceRangesByAge(age, gender) {
    return this
      .select()
      .from('reference_ranges')
      .where({
        'min_age <= ': age,
        'max_age >= ': age,
        'AND (gender IS NULL OR gender': gender,
        'AND is_active': true
      })
      .orderBy('test_type');
  }

  getTestStatistics(startDate, endDate) {
    return this
      .select([
        'COUNT(*) as total_tests',
        'AVG(IgG) as avg_IgG',
        'AVG(IgA) as avg_IgA',
        'AVG(IgM) as avg_IgM',
        'AVG(IgE) as avg_IgE',
        'COUNT(CASE WHEN status = "completed" THEN 1 END) as completed_tests',
        'COUNT(CASE WHEN status = "pending" THEN 1 END) as pending_tests'
      ])
      .from('test_results')
      .where({
        'test_date >= ': startDate,
        'AND test_date <= ': endDate
      });
  }

  build() {
    return {
      sql: this.query,
      params: this.params
    };
  }
}

module.exports = QueryBuilder;
