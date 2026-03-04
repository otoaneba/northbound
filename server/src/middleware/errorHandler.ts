import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  console.error("ERROR:", {
    message: err.message,
    stack: err.stack,
    details: err.details,
    path: req.path,
  });
  // isOperational = whether the error is operational (user error) or programmer error
  // If it's an operational error, return the error to the user
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details || null,
    });
  }

  // If we reach here → it's a developer (my) error
  return res.status(500).json({
    error: "Internal Server Error",
  });
}
