import express from 'express';
import { UserController } from '../controllers/auth.js';

export const userRoutes = express.Router();

userRoutes.post('/signup', UserController.signup);
userRoutes.post('/login', UserController.login);
