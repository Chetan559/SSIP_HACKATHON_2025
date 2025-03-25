import api from "./api";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupCredentials = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>("/login", credentials, {
      withCredentials: true,
    }); // ✅ Fix
    return response.data;
  },

  signup: async (credentials: SignupCredentials) => {
    const response = await api.post<AuthResponse>("/signup", credentials, {
      withCredentials: true,
    }); // ✅ Fix
    return response.data;
  },
};

export default authService;
