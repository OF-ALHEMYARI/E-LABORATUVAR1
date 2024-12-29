import db from "./database";

export const seedDatabase = () => {
  db.serialize(() => {
    // إدخال بيانات المستخدمين
    db.run(`
        INSERT OR IGNORE INTO users (id, name) VALUES
        (1, 'John Doe'),
        (2, 'Jane Smith')
      `);

    // إدخال بيانات التحاليل
    db.run(`
        INSERT OR IGNORE INTO tests (id, user_id, test_name, test_date, test_values) VALUES
        (1, 1, 'IgA', '2023-01-01', '25'), -- مرتفع
        (2, 1, 'IgM', '2023-01-02', '10'), -- منخفض
        (3, 1, 'IgG', '2023-01-03', '22'), -- طبيعي
        (4, 2, 'IgA', '2023-02-01', '8'),  -- منخفض
        (5, 2, 'IgM', '2023-02-02', '30'), -- مرتفع
        (6, 2, 'IgG', '2023-02-03', '19')  -- منخفض
        (7, 2, 'IgA', '2023-02-04', '15'), -- طبيعي
        (8, 2, 'IgM', '2023-02-05', '20'), -- طبيعي
        (9, 2, 'IgG', '2023-02-06', '25')
        (10, 2, 'IgA', '2023-02-07', '17'), -- طبيعي
      `);

    // إدخال القيم المرجعية
    db.run(`
        INSERT OR IGNORE INTO reference_ranges (test_name, min_value, max_value) VALUES
        ('IgA', 10, 20),
        ('IgM', 15, 25),
        ('IgG', 20, 30)
      `);

    // إدخال بيانات الكتيبات
    db.run(`
        INSERT OR IGNORE INTO guides (id, name, min_value, max_value) VALUES
        (1, 'IgA Guide', 10, 20),
        (2, 'IgM Guide', 15, 25),
        (3, 'IgG Guide', 20, 30)
      `);

    console.log("Database seeded successfully with extended test cases!");
  });
};
