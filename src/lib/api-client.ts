import { env } from "./env";

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[] | string>;
  status?: number;
}

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[] | string>;
  data?: any;

  constructor(message: string, status: number, errors?: Record<string, string[] | string>, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.data = data;
  }
}

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isV1 = endpoint.startsWith("/api/v1/") || endpoint.startsWith("api/v1/");
  const isLocalApi = (endpoint.startsWith("/api/") || endpoint.startsWith("api/")) && !isV1;

  let url: string;
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    url = endpoint;
  } else if (isLocalApi) {
    url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  } else {
    url = `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  }

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(`Failed to connect to backend: ${errorMsg}`, 0);
  }

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    let fieldErrors: Record<string, string[] | string> | undefined = undefined;

    if (data && typeof data === "object") {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (typeof data.error === "string") {
        errorMessage = data.error;
      } else if (typeof data.message === "string") {
        errorMessage = data.message;
      } else {
        fieldErrors = data;
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          if (Array.isArray(val) && val.length > 0) {
            errorMessage = `${firstKey}: ${val[0]}`;
          } else if (typeof val === "string") {
            errorMessage = `${firstKey}: ${val}`;
          }
        }
      }
    }

    throw new ApiError(errorMessage, response.status, fieldErrors, data);
  }

  return data as T;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
