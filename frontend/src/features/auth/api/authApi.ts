import type { AuthDTO, LoginParameters, SignupParameters } from '../types';
import { AuthError, authErrorFromResponse } from '../errors/AuthError';

const baseUrl = import.meta.env.VITE_API_URL;

export const login = async ({ email, password }: LoginParameters) => {
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new AuthError('Network request failed', 'NETWORK', { cause: err });
  }

  let data: { error?: string; token?: string; user?: unknown };
  try {
    data = await res.json();
  } catch (err) {
    throw new AuthError('Invalid server response', 'INVALID_RESPONSE', {
      cause: err,
      status: res.status,
    });
  }

  if (!res.ok) {
    throw authErrorFromResponse(
      data.error ?? res.statusText,
      res.status,
      data,
    );
  }

  if (!data.token) {
    throw new AuthError('No token in response', 'INVALID_RESPONSE', {
      status: res.status,
    });
  }

  return data as AuthDTO;
};

export const signup = async ({ email, password }: SignupParameters) => {
  console.log(email, password);
};
