import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/express.js';
import { PlaidService } from '../services/plaid.js';

export const PlaidController = {
  sandboxGetAccessToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const response = await PlaidService.sandboxGetAccessToken({ userId });
      return res.status(200).json({ accessToken: response?.accessToken, itemId: response?.itemId });
    } catch (error) {
      next(error);
    }
  },

  createLinkToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const linkToken = await PlaidService.createLinkToken({ userId });
      return res.status(200).json({ link_token: linkToken });
    } catch (error) {
      next(error);
    }
  },

  exchangePublicToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const { public_token } = req.body;
      const result = await PlaidService.exchangePublicToken({ userId, publicToken: public_token });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
