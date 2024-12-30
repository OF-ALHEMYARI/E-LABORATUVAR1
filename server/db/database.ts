import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./lab_tests.db");

export default db;

export const getTests = (userId: string, query?: string) => {
  const sql = query
    ? `SELECT * FROM tests WHERE user_id = ? AND (test_name LIKE ? OR test_values LIKE ?)`
    : `SELECT * FROM tests WHERE user_id = ?`;
  const params = query ? [userId, `%${query}%`, `%${query}%`] : [userId];

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const getReferences = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM reference_ranges`, [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const insertGuide = (name: string, min: number, max: number) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO guides (name, min_value, max_value) VALUES (?, ?, ?)`,
      [name, min, max],
      (err) => {
        if (err) reject(err);
        resolve(true);
      }
    );
  });
};

export const getGuides = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM guides`, [], (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

export const getPatientData = (name: string) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tests WHERE user_id = (SELECT id FROM users WHERE name = ?)`,
      [name],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

export const getComparison = (patientId: string) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT test_name, test_date, test_values FROM tests WHERE user_id = ? ORDER BY test_date`,
      [patientId],
      (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      }
    );
  });
};

export const getReferenceRangeByAge = (
  testType: string,
  ageInMonths: number,
  guideName: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM age_references 
      WHERE test_type = ? 
      AND guide_name =?
      AND (
        (age_unit = 'months' AND ? >= min_age AND ? <= max_age)
        OR 
        (age_unit = 'years' AND ? >= min_age * 12 AND ? <= max_age * 12)
      )
    `;
    
    db.get(sql, [testType, guideName, ageInMonths, ageInMonths, ageInMonths, ageInMonths], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

export const analyzeTestResult = async (
  testType: string,
  value: number,
  birthDate: string,
  testDate: string,
  guideName: string
): Promise<{ status: 'low' | 'normal' | 'high', reference: any }> => {
  // حساب العمر بالأشهر
  const birthDateObj = new Date(birthDate);
  const testDateObj = new Date(testDate);
  const ageInMonths = 
    (testDateObj.getFullYear() - birthDateObj.getFullYear()) * 12 +
    (testDateObj.getMonth() - birthDateObj.getMonth());

  // الحصول على النطاق المرجعي
  const reference = await getReferenceRangeByAge(testType, ageInMonths, guideName);
  
  if (!reference) {
    throw new Error('No reference range found for this age and test type');
  }

  // تحليل النتيجة
  let status: 'low' | 'normal' | 'high';
  if (value < reference.min_value) {
    status = 'low';
  } else if (value > reference.max_value) {
    status = 'high';
  } else {
    status = 'normal';
  }

  return { status, reference };
};

