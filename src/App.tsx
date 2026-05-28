import { Routes, Route } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "./lib/auth";
import { useAppDataQuery } from "./lib/store";
import { APPDATA_KEY } from "./lib/query";
import { AuthError } from "./lib/backend";
import { FullLoader } from "./components/Loader";
import { Button } from "./components/ui";
import { Layout } from "./components/Layout";
import { PinScreen, SetupScreen, ChooseMemberScreen } from "./features/auth/AuthScreens";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { ShoppingPage } from "./features/shopping/ShoppingPage";
import { BudgetPage } from "./features/budget/BudgetPage";
import { TasksPage } from "./features/tasks/TasksPage";
import { SettingsPage } from "./features/settings/SettingsPage";

export default function App() {
  const { pin, setPin, memberId } = useAuth();
  const qc = useQueryClient();
  const query = useAppDataQuery();

  const submitPin = (p: string) => {
    setPin(p);
    qc.resetQueries({ queryKey: APPDATA_KEY });
  };

  if (!pin) return <PinScreen onSubmit={submitPin} loading={false} />;

  if (query.isError) {
    if (query.error instanceof AuthError) {
      return <PinScreen onSubmit={submitPin} error={query.error.message} />;
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">
        <AlertTriangle className="text-amber-500" size={36} />
        <p className="text-sm text-slate-500">
          Verbindung fehlgeschlagen.
          <br />
          {(query.error as Error)?.message}
        </p>
        <Button onClick={() => query.refetch()}>Erneut versuchen</Button>
      </div>
    );
  }

  if (query.isLoading || !query.data) return <FullLoader label="Lade Haushalt…" />;

  const data = query.data;
  if (data.members.length === 0) return <SetupScreen />;

  const meValid = !!memberId && data.members.some((m) => m.id === memberId);
  if (!meValid) return <ChooseMemberScreen members={data.members} />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="einkauf" element={<ShoppingPage />} />
        <Route path="konto" element={<BudgetPage />} />
        <Route path="aufgaben" element={<TasksPage />} />
        <Route path="einstellungen" element={<SettingsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
