import express from "express";
import { createGuide, fetchGuides, trackPatients, compareTests } from "../controllers/adminController";

const router = express.Router();

// إنشاء كتيب جديد
router.post("/guides", createGuide);

// جلب الكتيبات
router.get("/guides", fetchGuides);

// تتبع المرضى
router.get("/patients/:name", trackPatients);

// مقارنة التغيرات في التحاليل
router.get("/tests/compare", compareTests);

export default router;
