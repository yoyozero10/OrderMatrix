import type { ErrorResponse } from "@/lib/api/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:3001/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: object;
};

export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;
  path?: string;

  constructor(message: string, statusCode: number, errorCode?: string, path?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.path = path;
  }
}

function buildUrl(path: string, query?: object) {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
      const isAllowed =
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean";
      if (isAllowed && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, token, query } = options;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorPayload = payload as ErrorResponse | null;
    throw new ApiError(
      errorPayload?.message ?? "Unexpected error",
      errorPayload?.statusCode ?? response.status,
      errorPayload?.errorCode,
      errorPayload?.path
    );
  }

  return payload as T;
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
