export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

export type LoginParameters = {
  email: string,
  password: string
}

export type SignupParameters = {
  email: string,
  password: string,
  name?: string
}

export type AuthVM = {
  token: string,
  user: {
    id: string;
    name: string;
    email: string;
  }
}