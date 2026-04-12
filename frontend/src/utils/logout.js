import { clearStoragePreservingTheme } from "../theme/ThemeProvider";

const getLoginLocation = () => {
  const currentLocation = window.location.href.split("#")[0] || window.location.href;
  return `${currentLocation}#/login`;
};

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

  window.location.replace(getLoginLocation());
}
