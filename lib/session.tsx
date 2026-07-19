"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "rumahku-session";

export interface Session {
  email: string;
  propertyId: string;
}

interface SessionCtx {
  session: Session | null;
  ready: boolean;
  signIn: (s: Session) => void;
  signOut: () => void;
}

const Ctx = createContext<SessionCtx | null>(null);

/** Test/SSR hook: harnesses can set globalThis.__RUMAHKU_SESSION__ to
 *  pre-authenticate synchronously (production leaves it undefined). */
function injectedSession(): Session | null | undefined {
  return (globalThis as unknown as { __RUMAHKU_SESSION__?: Session | null })
    .__RUMAHKU_SESSION__;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const injected = injectedSession();
  const [session, setSession] = useState<Session | null>(
    injected !== undefined ? injected : null
  );
  const [ready, setReady] = useState(injected !== undefined);

  useEffect(() => {
    if (ready) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      if (session) localStorage.setItem(KEY, JSON.stringify(session));
      else localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, [session, ready]);

  const value = useMemo<SessionCtx>(
    () => ({
      session,
      ready,
      signIn: (s) => setSession(s),
      signOut: () => setSession(null),
    }),
    [session, ready]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSession must be used within SessionProvider");
  return c;
}
