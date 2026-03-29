import * as authApi from '../api/authApi';
import type { LoginParameters, SignupParameters, AuthDTO } from '../types';

export const login = async ({email, password}: LoginParameters) => {
  try {
    const data = await authApi.login({email, password})
  
    const vm = toAuthVM(data)
  
    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY, vm.token);
  
    return vm;
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

const toAuthVM = (dto: AuthDTO) => ({
  token: dto.token,
  user: {
    id: dto.user.id,
    name: dto.user.name ?? '',
    email: dto.user.email,
  }
});

const normalizeAuthError = (err: any) => {
  return {
    message: err.message || 'Something went wrong',
    code: 'AUTH_ERROR',
  };
};