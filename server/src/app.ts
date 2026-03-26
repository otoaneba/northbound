import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { userRoutes } from './routes/auth.js';
import { plaidRoutes } from './routes/plaid.js';
import { csvRoutes } from './routes/csv.js';
import { transactionRoutes } from './routes/transactions.js';
import { bankAccountRoutes } from './routes/bankAccounts.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', userRoutes);
app.use('/plaid', plaidRoutes);
app.use('/csv', csvRoutes);
app.use('/bank-accounts', bankAccountRoutes);
app.use('/transactions', transactionRoutes);
 
// Error handling
app.use(errorHandler);

export default app;