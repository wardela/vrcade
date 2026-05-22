import i18n from "../i18n";

const TOKEN_STORAGE_KEY = "portal_auth_token";

const normalizeErrorMessage = async (response, fallbackMessage) => {
  try {
    const payload = await response.json();
    return payload?.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

export const getStoredPortalToken = () =>
  localStorage.getItem(TOKEN_STORAGE_KEY) || "";

export const storePortalToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearPortalToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const loginToPortal = async (credentials) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(
      await normalizeErrorMessage(response, i18n.t("portalAuth.errors.sign_in_failed"))
    );
  }

  return response.json();
};

export const fetchPortalSession = async (token) => {
  const response = await fetch("/api/portal/session", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      await normalizeErrorMessage(
        response,
        i18n.t("portalAuth.errors.session_expired")
      )
    );
  }

  return response.json();
};
