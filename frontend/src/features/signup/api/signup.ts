import { useMutation } from "@tanstack/react-query";

export type CreateUserRequest = {
    email: string;
    password: string;
    fullName?: string | null;
};

export type UserResponse = {
    id: number | null;
    email: string;
    fullName: string | null;
};

type ApiError = {
    message?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function createUser(data: CreateUserRequest): Promise<UserResponse> {
    const response = await fetch(`${API_BASE_URL}/users`, {
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
            (response.status === 409
                ? "Email is already in use."
                : "Failed to create user.");

        throw new Error(message);
    }

    return (await response.json()) as UserResponse;
}

export function useSignupMutation() {
    return useMutation<UserResponse, Error, CreateUserRequest>({
        mutationKey: ["signup"],
        mutationFn: createUser,
    });
}