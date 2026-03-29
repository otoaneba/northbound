import * as authApi from '../api/authApi';
import { toAuthError } from '../errors/AuthError';
import type { LoginParameters, AuthDTO } from '../types';

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

const toAuthVM = (dto: AuthDTO) => ({
  token: dto.token,
  user: {
    id: dto.user.id,
    name: dto.user.name ?? '',
    email: dto.user.email,
  },
});
