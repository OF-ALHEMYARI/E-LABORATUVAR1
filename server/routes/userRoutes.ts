import express from "express";
import { fetchTests, searchTests, fetchReferences } from "../controllers/userController";

const router = express.Router();

// جلب التحاليل
router.get("/tests", fetchTests);

// البحث في التحاليل
router.get("/tests/search", searchTests);

// جلب القيم المرجعية
router.get("/references", fetchReferences);

export default router;
