import {useAuth} from "@/features/auth/AuthContext";

export const useApiClient = () => {
  const {accessToken, logout} = useAuth();

  const apiFetch = async <TResponse>(
    input: RequestInfo | URL,
    init: RequestInit = {},
  ): Promise<TResponse> => {
    const headers = new Headers(init.headers || {});
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const res = await fetch(input, {
      ...init,
      headers,
    });

    if (res.status === 401) {
      logout();
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed with status ${res.status}`);
    }

    return (await res.json()) as TResponse;
  };

  return {apiFetch};
};