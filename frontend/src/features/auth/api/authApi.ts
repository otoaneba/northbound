import type { LoginParameters, SignupParameters } from "../types";

const baseUrl = import.meta.env.VITE_API_URL;

export const login = async ({email, password}: LoginParameters) => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({email, password}),
  });

  let data;
  try {
    data = await res.json()
  } catch {
    throw new Error("Invalid server response");
  }
  if (!res.ok) {
    throw new Error(data.error ?? res.statusText);
  }
  if (!data.token) {
    throw new Error("No token in response");
  }
  return data;
}

export const signup = async ({ email, password, name }: SignupParameters) => {
  console.log(email,password)
}


