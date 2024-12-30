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

    // إدخال البيانات المرجعية من Turk Med SCI
    const turkMedSciReferences = [
      // IgA references
      { guide: 'Turk Med SCI', min_age: 0, max_age: 3, age_unit: 'months', test_type: 'IgA', min_value: 0.0, max_value: 0.5, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 4, max_age: 6, age_unit: 'months', test_type: 'IgA', min_value: 0.1, max_value: 0.7, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 7, max_age: 12, age_unit: 'months', test_type: 'IgA', min_value: 0.2, max_value: 1.0, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 1, max_age: 2, age_unit: 'years', test_type: 'IgA', min_value: 0.3, max_value: 1.2, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 2, max_age: 3, age_unit: 'years', test_type: 'IgA', min_value: 0.4, max_value: 1.6, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 3, max_age: 6, age_unit: 'years', test_type: 'IgA', min_value: 0.5, max_value: 2.0, unit: 'g/L' },
      
      // IgM references
      { guide: 'Turk Med SCI', min_age: 0, max_age: 3, age_unit: 'months', test_type: 'IgM', min_value: 0.1, max_value: 0.6, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 4, max_age: 6, age_unit: 'months', test_type: 'IgM', min_value: 0.2, max_value: 0.8, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 7, max_age: 12, age_unit: 'months', test_type: 'IgM', min_value: 0.3, max_value: 1.0, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 1, max_age: 2, age_unit: 'years', test_type: 'IgM', min_value: 0.4, max_value: 1.4, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 2, max_age: 3, age_unit: 'years', test_type: 'IgM', min_value: 0.5, max_value: 1.8, unit: 'g/L' },
      { guide: 'Turk Med SCI', min_age: 3, max_age: 6, age_unit: 'years', test_type: 'IgM', min_value: 0.5, max_value: 2.0, unit: 'g/L' }
    ];

    // إدخال البيانات المرجعية من Turkish Journal Pediatrics
    const turkishJPedReferences = [
      // IgG1 references
      { guide: 'Turkish Journal Pediatrics', min_age: 0, max_age: 3, age_unit: 'months', test_type: 'IgG1', min_value: 2.4, max_value: 10.6, unit: 'g/L' },
      { guide: 'Turkish Journal Pediatrics', min_age: 4, max_age: 6, age_unit: 'months', test_type: 'IgG1', min_value: 1.8, max_value: 7.0, unit: 'g/L' },
      { guide: 'Turkish Journal Pediatrics', min_age: 7, max_age: 12, age_unit: 'months', test_type: 'IgG1', min_value: 2.0, max_value: 7.7, unit: 'g/L' },
      
      // IgG2 references
      { guide: 'Turkish Journal Pediatrics', min_age: 0, max_age: 3, age_unit: 'months', test_type: 'IgG2', min_value: 1.1, max_value: 4.9, unit: 'g/L' },
      { guide: 'Turkish Journal Pediatrics', min_age: 4, max_age: 6, age_unit: 'months', test_type: 'IgG2', min_value: 0.8, max_value: 3.5, unit: 'g/L' },
      { guide: 'Turkish Journal Pediatrics', min_age: 7, max_age: 12, age_unit: 'months', test_type: 'IgG2', min_value: 0.9, max_value: 4.1, unit: 'g/L' }
    ];

    // إدخال البيانات في قاعدة البيانات
    const insertReference = db.prepare(`
      INSERT INTO age_references (
        guide_name, min_age, max_age, age_unit, 
        test_type, min_value, max_value, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    [...turkMedSciReferences, ...turkishJPedReferences].forEach(ref => {
      insertReference.run([
        ref.guide, ref.min_age, ref.max_age, ref.age_unit,
        ref.test_type, ref.min_value, ref.max_value, ref.unit
      ]);
    });

    insertReference.finalize();

    console.log("Database seeded successfully with extended test cases!");
  });
};
