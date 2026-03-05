import express from 'express';
import { PlaidController } from '../controllers/plaid.js';
import { authMiddleware } from '../middleware/auth.js';

export const plaidRoutes = express.Router();

plaidRoutes.post('/sandbox/get-access-token', authMiddleware, PlaidController.sandboxGetAccessToken)
plaidRoutes.post('/create-link-token', authMiddleware, PlaidController.createLinkToken);
plaidRoutes.post('/exchange-public-token', authMiddleware, PlaidController.exchangePublicToken);
