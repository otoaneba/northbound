import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { userRoutes } from './routes/auth.js';
import { plaidRoutes } from './routes/plaid.js';
import { csvRoutes } from './routes/csv.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', userRoutes);
app.use('/plaid', plaidRoutes);
app.use('/csv', csvRoutes);
 
// Error handling
app.use(errorHandler);

export default app;