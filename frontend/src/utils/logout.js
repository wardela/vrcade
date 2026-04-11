import { clearStoragePreservingTheme } from "../theme/ThemeProvider";

export function logoutToLogin({ reason } = {}) {
  clearStoragePreservingTheme(localStorage);

  try {
    sessionStorage.clear();
  } catch {
    // Ignore session storage failures and continue to the login screen.
  }

  if (reason) {
    localStorage.setItem("logout_reason", reason);
  }

  window.location.replace("/#/login");
}
