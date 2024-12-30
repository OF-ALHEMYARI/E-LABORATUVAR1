import { Request, Response } from "express";
import db, {
  insertGuide,
  getGuides,
  getPatientData,
  getComparison,
  analyzeTestResult
} from "../db/database";

export const createGuide = async (req: Request, res: Response) => {
  try {
    const { name, min, max } = req.body;
    await insertGuide(name, min, max);
    res.status(201).json({ message: "Guide created successfully." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchGuides = async (_req: Request, res: Response) => {
  try {
    const guides = await getGuides();
    res.status(200).json(guides);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const trackPatients = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const data = await getPatientData(name);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const compareTests = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query;
    const data = await getComparison(patientId as string);
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const analyzePatientTest = async (req: Request, res: Response) => {
  try {
    const { patientId, testType, testDate, guideName } = req.query;
    const value = parseFloat(req.query.value as string);

    // الحصول على معلومات المريض
    const patient : any = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // تحليل النتيجة
    const analysis = await analyzeTestResult(
      testType as string,
      value,
      patient.birth_date,
      testDate as string,
      guideName as string
    );

    res.json({
      patient,
      testType,
      value,
      analysis,
      testDate,
      guideName
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
