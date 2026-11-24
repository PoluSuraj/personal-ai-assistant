const MODE_KEY = "paa_storage_mode";
const PROFILE_PREFIX = "paa_device_profile:";
const SESSION_PREFIX = "paa_device_session:";
const ACTIVITY_PREFIX = "paa_device_activity:";

const identityKey = (email) => encodeURIComponent(String(email || "").trim().toLowerCase());
const readJson = (key, fallback) => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

export const getStorageMode = () => window.localStorage.getItem(MODE_KEY) || "account";
export const isDeviceStorageEnabled = () => getStorageMode() === "device";

export const getDeviceProfile = (email) => readJson(`${PROFILE_PREFIX}${identityKey(email)}`, null);

export const saveDeviceProfile = (profile) => {
  if (!profile?.email) return profile;
  const safeProfile = { ...profile };
  delete safeProfile.password;
  delete safeProfile.refreshToken;
  window.localStorage.setItem(`${PROFILE_PREFIX}${identityKey(profile.email)}`, JSON.stringify(safeProfile));
  window.localStorage.setItem("paa_device_last_email", profile.email);
  return safeProfile;
};

export const setStorageMode = (mode, profile) => {
  window.localStorage.setItem(MODE_KEY, mode === "device" ? "device" : "account");
  if (mode === "device" && profile?.email) {
    saveDeviceProfile(profile);
    window.localStorage.setItem(`${SESSION_PREFIX}${identityKey(profile.email)}`, String(Date.now() + 60 * 60 * 1000));
  } else if (profile?.email) {
    clearDeviceSession(profile.email);
  }
};

export const activateDeviceSession = (profile) => {
  if (!isDeviceStorageEnabled() || !profile?.email) return;
  saveDeviceProfile(profile);
  window.localStorage.setItem(`${SESSION_PREFIX}${identityKey(profile.email)}`, String(Date.now() + 60 * 60 * 1000));
};

export const hasDeviceSession = (email) => {
  const expiresAt = Number(window.localStorage.getItem(`${SESSION_PREFIX}${identityKey(email)}`) || 0);
  if (!expiresAt || expiresAt <= Date.now()) {
    clearDeviceSession(email);
    return false;
  }
  return true;
};
export const clearDeviceSession = (email) => window.localStorage.removeItem(`${SESSION_PREFIX}${identityKey(email)}`);

export const getDeviceActivities = (email) => readJson(`${ACTIVITY_PREFIX}${identityKey(email)}`, []);

export const saveDeviceActivity = (email, activity) => {
  const key = `${ACTIVITY_PREFIX}${identityKey(email)}`;
  const existing = readJson(key, []);
  if (activity.attemptId && existing.some((item) => item.attemptId === activity.attemptId)) return existing.find((item) => item.attemptId === activity.attemptId);
  const record = { ...activity, _id: activity._id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`, createdAt: activity.createdAt || new Date().toISOString() };
  const records = [record, ...existing].slice(0, 200);
  while (records.length) {
    try {
      window.localStorage.setItem(key, JSON.stringify(records));
      break;
    } catch (error) {
      if (error.name !== "QuotaExceededError" || records.length === 1) throw new Error("This browser is running low on storage. Export or clear older device history.");
      records.pop();
    }
  }
  return record;
};

export const clearDeviceData = (email) => {
  const key = identityKey(email);
  window.localStorage.removeItem(`${PROFILE_PREFIX}${key}`);
  window.localStorage.removeItem(`${SESSION_PREFIX}${key}`);
  window.localStorage.removeItem(`${ACTIVITY_PREFIX}${key}`);
};
