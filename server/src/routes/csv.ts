import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { CsvController } from '../controllers/csv.js';

export const csvRoutes = express.Router();

csvRoutes.post("/upload/:bankAccountId", authMiddleware, upload.single("file"), CsvController.uploadCsv)