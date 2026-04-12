const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";
const runtimeHostname = typeof window !== "undefined" ? window.location.hostname : "";

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (runtimeHostname === "localhost") {
    return "http://localhost:8000";
  }

  if (runtimeHostname === "127.0.0.1") {
    return "http://127.0.0.1:8000";
  }

  if (runtimeOrigin) {
    return runtimeOrigin.replace(/:\d+$/, ":8000");
  }

  return "http://localhost:8000";
};

export const API_BASE_URL = getDefaultApiBaseUrl();

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export function isUnauthorizedError(error) {
  return error?.status === 401 || /unauthorized/i.test(String(error?.message || ""));
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const message = data?.message || (response.status === 401 ? "Unauthorized access. Please sign in again." : "Request failed");
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function getHealth() {
  return apiFetch("/api/v1/health", { method: "GET" });
}
