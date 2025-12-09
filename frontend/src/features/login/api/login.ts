import {useMutation} from "@tanstack/react-query";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  id: number;
  token: string;
  email: string;
  fullName: string;
};

type ApiError = {
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorBody: ApiError | undefined;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // ignore parse error; we'll fall back to generic message
    }

    const message =
      errorBody?.message ||
      (response.status === 401
        ? "Invalid email or password."
        : "Failed to log in.");

    throw new Error(message);
  }

  return (await response.json()) as LoginResponse;
}

export function useLoginMutation() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationKey: ["login"],
    mutationFn: login,
  });
}