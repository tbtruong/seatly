import {useMutation, useQuery} from "@tanstack/react-query";
import {useAuth} from "@/features/auth/AuthContext";

export type Desk = {
  id: number;
  name: string;
  location: string | null;
};

type ApiError = {
  message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchDesks(accessToken: string | null): Promise<Desk[]> {
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/desks`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
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
        ? "You are not authorized to view desks."
        : "Failed to load desks.");

    throw new Error(message);
  }

  return (await response.json()) as Desk[];
}

export function useDesksQuery() {
  const {accessToken} = useAuth();

  return useQuery<Desk[], Error>({
    queryKey: ["desks"],
    queryFn: () => fetchDesks(accessToken),
    enabled: !!accessToken,
  });
}

export type CreateDeskInput = {
  name: string;
  location: string | null;
};

async function createDesk(
  accessToken: string | null,
  input: CreateDeskInput,
): Promise<Desk> {
  if (!accessToken) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}/desks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
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
        ? "You are not authorized to create desks."
        : "Failed to create desk.");

    throw new Error(message);
  }

  return (await response.json()) as Desk;
}

export function useCreateDeskMutation() {
  const {accessToken} = useAuth();

  return useMutation<Desk, Error, CreateDeskInput>({
    mutationFn: (input) => createDesk(accessToken, input),
  });
}