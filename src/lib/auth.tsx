import { createContext, useContext, useState, type ReactNode } from "react";

const PIN_KEY = "haushalt:pin";
const MEMBER_KEY = "haushalt:memberId";

interface AuthCtx {
  pin: string | null;
  memberId: string | null;
  setPin: (pin: string | null) => void;
  setMemberId: (id: string | null) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState<string | null>(() => localStorage.getItem(PIN_KEY));
  const [memberId, setMemberIdState] = useState<string | null>(() =>
    localStorage.getItem(MEMBER_KEY)
  );

  const setPin = (p: string | null) => {
    setPinState(p);
    if (p) localStorage.setItem(PIN_KEY, p);
    else localStorage.removeItem(PIN_KEY);
  };

  const setMemberId = (id: string | null) => {
    setMemberIdState(id);
    if (id) localStorage.setItem(MEMBER_KEY, id);
    else localStorage.removeItem(MEMBER_KEY);
  };

  const logout = () => {
    setPin(null);
    setMemberId(null);
  };

  return (
    <Ctx.Provider value={{ pin, memberId, setPin, setMemberId, logout }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
}
