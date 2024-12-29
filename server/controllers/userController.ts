import { Request, Response } from "express";
import { getTests, getReferences } from "../db/database";

export const fetchTests = async (req: Request, res: Response) => {
  const { userId } = req.query;
  try {
    const tests = await getTests(userId as string);
    res.status(200).json(tests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const searchTests = async (req: Request, res: Response) => {
  const { userId, query } = req.query;
  try {
    const tests = await getTests(userId as string, query as string);
    res.status(200).json(tests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const fetchReferences = async (_req: Request, res: Response) => {
  try {
    const references = await getReferences();
    res.status(200).json(references);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
