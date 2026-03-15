import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/express.js';
import { PlaidService } from '../services/plaid.js';
import { TransactionService } from '../services/transaction/transaction.service.js';

export const PlaidController = {
  sandboxGetAccessToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const savedItem = await PlaidService.sandboxGetAccessToken({ userId });
      return res.status(200).json(savedItem);
    } catch (error) {
      next(error);
    }
  },

  createLinkToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const linkToken = await PlaidService.createLinkToken(userId);
      return res.status(200).json({ link_token: linkToken });
    } catch (error) {
      next(error);
    }
  },

  exchangePublicToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const { public_token } = req.body;
      const result = await PlaidService.exchangePublicToken(userId, public_token);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  getPlaidItems: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const items = await PlaidService.getAllPlaidItems({ userId });
      return res.status(200).json(items);
    } catch (error) {
      next(error);
    }
  }, 

  getPlaidAccounts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plaidId } = req.params as { plaidId: string };
      const accounts = await PlaidService.fetchPlaidItemAccounts(plaidId);
      return res.status(200).json(accounts);
    } catch (error) {
      next(error)
    }
  }, 

  syncPlaidAccounts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plaidId } = req.params as { plaidId: string };
      const accounts = await PlaidService.syncAccounts(plaidId);
      return res.status(200).json(accounts);
    } catch (error) {
      next(error)
    }
  }, 

  syncPlaidTransactions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const { plaidId } = req.params as { plaidId: string };
      const transactions = await PlaidService.syncPlaidTransactions({ plaidId, userId });
      return res.status(200).json(transactions);
    } catch (error) {
      next(error)
    }
  }, 

  getPlaidItemCursor: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { plaidId } = req.params as { plaidId: string };
      const cursor = await PlaidService.getPlaidItemCursor(plaidId);
      return res.status(200).json(cursor);
    } catch (error) {
      next(error)
    }
  }, 

  testSync: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: userId } = (req as AuthenticatedRequest).user;
      const { plaidId } = req.params as { plaidId: string };
      
      const syncResult = await PlaidService.syncPlaidTransactions({
        plaidId,
        userId
      })

      const summary = await TransactionService.applyPlaidSyncResult(plaidId, syncResult)
      return res.status(200).json({...summary});
    } catch (error) {
      next(error)
    }
  }

};
