import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { userRoutes } from './routes/auth.js';


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', userRoutes)
 
// Error handling
app.use(errorHandler);

export default app;