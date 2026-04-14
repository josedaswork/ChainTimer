/**
 * @history
 * 2026-04-14 — Wrapped in I18nProvider for multi-language support
 */
import { Toaster } from "sonner"
import Home from './pages/Home';
import { I18nProvider } from './lib/i18n';

function App() {
  return (
    <I18nProvider>
      <Home />
      <Toaster />
    </I18nProvider>
  )
}

export default App
