import express from 'express';
import { PlaidController } from '../controllers/plaid.js';
import { authMiddleware } from '../middleware/auth.js';

export const plaidRoutes = express.Router();

// POST 
plaidRoutes.post('/sandbox/get-access-token', authMiddleware, PlaidController.sandboxGetAccessToken);
plaidRoutes.post('/create-link-token', authMiddleware, PlaidController.createLinkToken);
plaidRoutes.post('/exchange-public-token', authMiddleware, PlaidController.exchangePublicToken);
plaidRoutes.post('/items/:plaidId/accounts/sync', authMiddleware, PlaidController.syncPlaidAccounts);
plaidRoutes.post('/items/:plaidId/transactions/sync', authMiddleware, PlaidController.syncPlaidTransactions);

// GET
plaidRoutes.get('/items/:plaidId/accounts', authMiddleware, PlaidController.getPlaidAccounts);
plaidRoutes.get('/items/:plaidId/cursor', authMiddleware, PlaidController.getPlaidItemCursor);

