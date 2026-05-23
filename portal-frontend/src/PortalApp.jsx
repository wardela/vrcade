import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LoginScreen from "./login/LoginScreen";
import MainScreen from "./mainscreen/mainscreen";
import {
  clearPortalToken,
  fetchPortalSession,
  getStoredPortalToken,
} from "./login/auth";

function PortalApp() {
  const { t } = useTranslation();
  const [authToken, setAuthToken] = useState(() => getStoredPortalToken());
  const [session, setSession] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(authToken));
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    if (!authToken) {
      setSession(null);
      setIsBootstrapping(false);
      return;
    }

    let mounted = true;

    const restoreSession = async () => {
      setIsBootstrapping(true);
      setBootError("");

      try {
        const payload = await fetchPortalSession(authToken);

        if (!mounted) {
          return;
        }

        setSession(payload);
      } catch (error) {
        if (!mounted) {
          return;
        }

        clearPortalToken();
        setAuthToken("");
        setSession(null);
        setBootError(error.message || t("portalAuth.errors.session_expired"));
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [authToken, t]);

  const handleLoginSuccess = ({ token, session: nextSession }) => {
    setAuthToken(token);
    setSession(nextSession);
    setBootError("");
  };

  const handleLogout = () => {
    clearPortalToken();
    setAuthToken("");
    setSession(null);
    setBootError("");
  };

  if (isBootstrapping) {
    return (
      <main className="portal-app portal-app--centered">
        <section className="portal-panel portal-loader">
          <div className="portal-loader__spinner" />
          <p>{t("portalAuth.states.restoring_session")}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} initialError={bootError} />;
  }

  return <MainScreen session={session} onLogout={handleLogout} />;
}

export default PortalApp;
