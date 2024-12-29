import { Request, Response } from "express";
import {
  insertGuide,
  getGuides,
  getPatientData,
  getComparison,
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
