import { UserService } from '../services/auth.js';
import type { Request, Response, NextFunction } from 'express';

export const UserController = {
  signup: async function(req: Request, res: Response, next: NextFunction) {
    try {
      
      const result = await UserService.signup({email: req.body.email, password: req.body.password, name: req.body.name});

      return res.status(201).json(result);

    } catch (error) {
      next(error);
    }  
  },
  login: async function(req: Request, res: Response, next: NextFunction) {
    try {

      const result = await UserService.login({email: req.body.email, password: req.body.password});

      return res.status(200).json(result);

    } catch (error) {
      next(error);
    }
  }
};