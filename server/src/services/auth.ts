import { UserModel } from "../models/user.js";
import { ValidationError, AlreadyExistsError, AuthenticationError } from "../utils/errors.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { env } from "../config/env.js";

interface SignupParams {
  email: string;
  password: string;
  name?: string;
}

interface LoginParams {
  email: string;
  password: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const UserService = {
  signup: async ({ email, password, name }: SignupParams) => {
    if (!email || !emailRegex.test(email)) {
      throw new ValidationError("Invalid email address");
    }

    if (!password || password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    const trimmedName = name?.trim() || undefined;

    const emailExists = await UserModel.findByEmail(email);
    if (emailExists) {
      throw new AlreadyExistsError("Email already registered", { email });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({ email, passwordHash, name: trimmedName });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as StringValue });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },

  login: async ({ email, password }: LoginParams) => {
    if (!email || !emailRegex.test(email)) {
      throw new ValidationError("Invalid email address");
    }

    if (!password) {
      throw new ValidationError("Password is required");
    }

    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as StringValue });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  },
};
