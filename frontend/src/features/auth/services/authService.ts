import * as authApi from '../api/authApi';
import type { LoginParameters, SignupParameters } from '../types';

export const loginUser = async ({email, password}: LoginParameters) => {
  const data = await authApi.login({email, password})

  const vm = toAuthVM(data)

  localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_KEY, data.token);

  return vm;
}

const toAuthVM = (dto: any) => ({
  token: dto.token,
  user: {
    id: dto.user.id,
    name: dto.user.name ?? '',
    email: dto.user.email,
  }
})