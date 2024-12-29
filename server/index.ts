import express from "express";
import cors from "cors";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
import { createTables } from "./db/migrations";
import { seedDatabase } from "./db/seeders";

const app = express();

app.use(express.json());
app.use(cors());

// إنشاء الجداول وإدخال البيانات عند بدء التشغيل
createTables();
seedDatabase();

// مسارات المستخدم
app.use("/users", userRoutes);

// مسارات المسؤول
app.use("/admin", adminRoutes);

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
