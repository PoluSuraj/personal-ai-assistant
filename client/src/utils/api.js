import { getDeviceActivities, getDeviceProfile, hasDeviceSession, isDeviceStorageEnabled, saveDeviceActivity, saveDeviceProfile } from "./deviceStorage";

const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : "";
const runtimeHostname = typeof window !== "undefined" ? window.location.hostname : "";
const ACCESS_TOKEN_STORAGE_KEY = "personal_ai_access_token";
const SESSION_EXPIRY_STORAGE_KEY = "personal_ai_session_expires_at";
const PRODUCTION_API_BASE_URL = "https://personal-ai-assistant-api-4atn.onrender.com";

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return PRODUCTION_API_BASE_URL;
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
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

export const getStoredAccessToken = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
};

export const setStoredAccessToken = (token) => {
  if (typeof window === "undefined") return;
  if (!token) {
    clearStoredAccessToken();
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  try {
    const payload = JSON.parse(window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    setStoredSessionExpiry(payload.exp ? payload.exp * 1000 : Date.now() + 60 * 60 * 1000);
  } catch {
    setStoredSessionExpiry(Date.now() + 60 * 60 * 1000);
  }
};

export const setStoredSessionExpiry = (expiresAt = Date.now() + 60 * 60 * 1000) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_EXPIRY_STORAGE_KEY, String(expiresAt));
};

export const getStoredSessionExpiry = () => {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(SESSION_EXPIRY_STORAGE_KEY) || 0);
};

export const clearStoredAccessToken = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(SESSION_EXPIRY_STORAGE_KEY);
};

export function isUnauthorizedError(error) {
  return error?.status === 401 || /unauthorized/i.test(String(error?.message || ""));
}

export async function apiFetch(path, options = {}) {
  const localMode = isDeviceStorageEnabled();
  const method = String(options.method || "GET").toUpperCase();
  const requestBody = options.body && typeof options.body === "string" ? JSON.parse(options.body) : (options.body || {});
  const cachedEmail = getDeviceProfile(window.localStorage.getItem("paa_device_last_email"))?.email;
  const currentEmail = cachedEmail && hasDeviceSession(cachedEmail) ? cachedEmail : "";

  if (localMode && currentEmail && method === "GET" && path.startsWith("/api/v1/users/getCurrentUser")) {
    return { data: getDeviceProfile(currentEmail), message: "Loaded from this device" };
  }
  if (localMode && currentEmail && method === "PATCH" && path.startsWith("/api/v1/users/update-account")) {
    const profile = saveDeviceProfile({ ...getDeviceProfile(currentEmail), ...requestBody, preferences: { ...getDeviceProfile(currentEmail)?.preferences, ...requestBody.preferences } });
    return { data: profile, message: "Saved on this device" };
  }
  if (localMode && currentEmail && method === "DELETE" && path.startsWith("/api/v1/users/removeAvatar")) {
    const profile = saveDeviceProfile({ ...getDeviceProfile(currentEmail), avatar: "" });
    return { data: profile, message: "Profile photo removed from this device" };
  }
  if (localMode && currentEmail && method === "GET" && path.startsWith("/api/v1/chat/activity/mine")) {
    const [, queryString = ""] = path.split("?");
    const query = new URLSearchParams(queryString);
    const limit = Math.max(1, Math.min(Number(query.get("limit") || 20), 100));
    const records = getDeviceActivities(currentEmail);
    const cursorValue = query.get("cursor");
    const cursor = cursorValue ? JSON.parse(cursorValue) : null;
    const filtered = cursor ? records.filter((item) => new Date(item.createdAt) < new Date(cursor.createdAt)) : records;
    const items = filtered.slice(0, limit);
    const last = items.at(-1);
    return { data: { items, hasMore: filtered.length > limit, nextCursor: filtered.length > limit && last ? JSON.stringify({ createdAt: last.createdAt, id: last._id }) : null }, message: "Device history loaded" };
  }
  if (localMode && currentEmail && method === "POST" && path.startsWith("/api/v1/chat/activity/quiz")) {
    const questions = requestBody.questions || [];
    const answers = requestBody.answers || {};
    const score = questions.reduce((total, question, index) => total + (answers[index] === question.correct ? 1 : 0), 0);
    saveDeviceActivity(currentEmail, { ...requestBody, kind: "quiz", score, total: questions.length, percentage: questions.length ? Math.round((score / questions.length) * 100) : 0 });
    return { data: { savedLocally: true }, message: "Quiz result saved on this device" };
  }

  const accessToken = getStoredAccessToken();
  let fetchOptions = options;
  if (localMode && currentEmail && method === "POST" && path.startsWith("/api/v1/chat/getResponse")) {
    const onlineBody = { ...requestBody };
    delete onlineBody.activityQuestion;
    delete onlineBody.activityChannel;
    onlineBody.saveActivity = false;
    fetchOptions = { ...options, body: JSON.stringify(onlineBody) };
  }
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...fetchOptions,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
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
    if (response.status === 401) {
      clearStoredAccessToken();
    }
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  if (localMode && currentEmail && method === "POST" && path.startsWith("/api/v1/chat/getResponse")) {
    const answer = data?.data || {};
    saveDeviceActivity(currentEmail, {
      kind: requestBody.activityChannel === "voice" ? "voice" : "chat",
      prompt: requestBody.activityQuestion || requestBody.question,
      response: answer.ai_response || "",
      topic: answer.topic || "",
    });
  }

  if (localMode && data?.data?.email) saveDeviceProfile(data.data);

  return data;
}

export async function getHealth() {
  return apiFetch("/api/v1/health", { method: "GET" });
}
