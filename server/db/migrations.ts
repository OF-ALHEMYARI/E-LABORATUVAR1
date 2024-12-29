import db from "./database";

export const createTables = () => {
  db.serialize(() => {
    // جدول المستخدمين
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    // جدول التحاليل
    db.run(`
      CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        test_name TEXT,
        test_date TEXT,
        test_values TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // جدول القيم المرجعية
    db.run(`
      CREATE TABLE IF NOT EXISTS reference_ranges (
        test_name TEXT PRIMARY KEY,
        min_value REAL,
        max_value REAL
      )
    `);

    // جدول الكتيبات
    db.run(`
      CREATE TABLE IF NOT EXISTS guides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        min_value REAL NOT NULL,
        max_value REAL NOT NULL
      )
    `);

    console.log("Tables created successfully!");
  });
};
