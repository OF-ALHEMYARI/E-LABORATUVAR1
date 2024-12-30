import sqlite3 from "sqlite3";
import { DATABASE_PATH } from "../config";

const db = new sqlite3.Database(DATABASE_PATH);

export const createTables = () => {
  db.serialize(() => {
    // جدول المستخدمين
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'doctor', 'patient')) NOT NULL DEFAULT 'patient',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول المرضى
    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        birth_date DATE NOT NULL,
        gender TEXT CHECK(gender IN ('M', 'F')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // جدول المراجع
    db.run(`
      CREATE TABLE IF NOT EXISTS guides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guide_name TEXT NOT NULL,
        test_type TEXT NOT NULL,
        age_group TEXT NOT NULL,
        min_value REAL NOT NULL,
        max_value REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // جدول نتائج التحاليل
    db.run(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        test_type TEXT NOT NULL,
        test_value REAL NOT NULL,
        test_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
      )
    `);

    // جدول السجلات
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  });
};

export const dropTables = () => {
  db.serialize(() => {
    db.run("DROP TABLE IF EXISTS logs");
    db.run("DROP TABLE IF EXISTS test_results");
    db.run("DROP TABLE IF EXISTS guides");
    db.run("DROP TABLE IF EXISTS patients");
    db.run("DROP TABLE IF EXISTS users");
  });
};

export default db;
