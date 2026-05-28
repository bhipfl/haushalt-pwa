import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Faengt Render-Fehler ab, damit nie die ganze App auf einen leeren Screen faellt. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App-Fehler:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <div className="text-4xl">😵‍💫</div>
        <h1 className="text-lg font-bold">Etwas ist schiefgelaufen</h1>
        <p className="max-w-xs text-sm text-slate-500">
          Die Ansicht konnte nicht geladen werden. Lade die App neu – deine Daten sind sicher.
        </p>
        <pre className="max-w-xs overflow-auto rounded-lg bg-slate-100 p-2 text-left text-[11px] text-slate-500 dark:bg-slate-800">
          {this.state.error.message}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={() => location.reload()}
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white"
          >
            Neu laden
          </button>
          <button
            onClick={() => {
              ["haushalt:memberId"].forEach((k) => localStorage.removeItem(k));
              location.href = import.meta.env.BASE_URL;
            }}
            className="rounded-xl bg-slate-200 px-5 py-2.5 font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }
}
