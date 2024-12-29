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
