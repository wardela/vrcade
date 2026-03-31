import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './theme/theme.css';
import App from './App.jsx';
import './i18n';
import { ThemeProvider, applyTheme, getStoredTheme } from './theme/ThemeProvider.jsx';

const initialTheme = getStoredTheme();
applyTheme(initialTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider initialTheme={initialTheme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
