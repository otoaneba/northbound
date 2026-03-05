import { AuthenticationError } from "../utils/errors.js";
import { env } from '../config/env.js';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


export const authMiddleware = async function(req: Request, res: Response, next: NextFunction) {
  try {

    const header = req.get("Authorization");

    if (header == null || header.trim() === "") { // check if entire authorization header is null or undefined
      throw new AuthenticationError("Token is invalid.")
    } else if (!header.startsWith("Bearer ")) { // check if token header starts with Bearer (case sensitive)
      throw new AuthenticationError("Token is invalid.")
    }
  
    const headerArr = header.trim().split(" ");
  
    if (headerArr.length !== 2) {
      throw new AuthenticationError("Token is invalid.")
    }
  
    const token = headerArr[1]!;
  
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as { userId: string };
  
    (req as Request & { user: { id: string } }).user = { id: decoded.userId };

    next()
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        throw new AuthenticationError("Token expired.");
      }
      
      if (error.name === "JsonWebTokenError") {
        throw new AuthenticationError("Invalid token.");
      }
    }
    return next(error);
  }
}