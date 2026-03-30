import * as authApi from '../api/authApi';
import { toAuthError } from '../errors/AuthError';
import type { LoginParameters, AuthDTO } from '../types';

const toAuthVM = (dto: AuthDTO) => ({
  token: dto.token,
  user: {
    id: dto.user.id,
    name: dto.user.name ?? '',
    email: dto.user.email,
  },
});

export const login = async ({ email, password }: LoginParameters) => {
  try {
    const data = await authApi.login({ email, password });

    const vm = toAuthVM(data);

    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY, vm.token);

    return vm;
  } catch (error) {
    throw toAuthError(error);
  }
};

export const signup = async ({ email, password }: LoginParameters) => {
  try {
    const data = await authApi.login({ email, password });

    const vm = toAuthVM(data);

    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY, vm.token);

    return vm;
  } catch (error) {
    throw toAuthError(error);
  }
};

export function logout(): void {
  localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
}
