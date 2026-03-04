import pool from "../config/db.js";
import { QueryError } from "../utils/errors.js";

export interface CreateUserParams {
  email: string;
  passwordHash: string;
  name?: string | undefined;
}

export const UserModel = {
  findByEmail: async (email: string) => {
    try {
      const sql = "SELECT * FROM users WHERE email = $1";
      const result = await pool.query(sql, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] ?? null;
    } catch (error) {
      throw new QueryError("Failed to query user by email", { email, cause: error });
    }
  },

  createUser: async ({ email, passwordHash, name }: CreateUserParams) => {
    let result;
    try {
      const sql = "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *";
      result = await pool.query(sql, [email, passwordHash, name]);
    } catch (error) {
      throw new QueryError("Failed to create user", { email, cause: error });
    }

    if (!result.rows[0]) {
      throw new QueryError("Failed to create user — no row returned");
    }

    return result.rows[0];
  },

  findById: async (id: string) => {
    try {
      const sql = "SELECT * FROM users WHERE id = $1";
      const result = await pool.query(sql, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] ?? null;
    } catch (error) {
      throw new QueryError("Failed to find user by id", { id, cause: error });
    }
  },
};
