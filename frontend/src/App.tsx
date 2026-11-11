import { useEffect, useState, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import TerminalView from "./components/Terminal";
import Login from "./components/Login";
import {
  type SessionSummary,
  type AuthUser,
  listSessions,
  createSession,
  killSession,
  getUser,
  clearAuth,
} from "./api";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => getUser());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const list = await listSessions();
      setSessions(list);
    } catch (e) {
      setError("Backend'e ulasilamadi.");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const t = setInterval(refresh, 4000);
    return () => clearInterval(t);
  }, [user, refresh]);

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const session = await createSession();
      setSessions((prev) => [...prev, session]);
      setActiveId(session.id);
    } catch (e) {
      setError("Yeni konsol baslatilamadi.");
    } finally {
      setCreating(false);
    }
  };

  const handleKill = async (id: string) => {
    await killSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setSessions([]);
    setActiveId(null);
  };

  const active = sessions.find((s) => s.id === activeId) || null;

  return (
    <div className="h-screen w-screen flex bg-ink">
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={handleCreate}
        onKill={handleKill}
        creating={creating}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 shrink-0 border-b border-line flex items-center justify-between px-4">
          <div className="flex items-center gap-2 min-w-0">
            {active ? (
              <>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active.status === "running" ? "bg-live" : "bg-danger"
                  }`}
                />
                <span className="font-mono text-sm text-bone truncate">{active.label}</span>
                <span className="text-fog text-xs">— baslatan: {active.owner}</span>
              </>
            ) : (
              <span className="text-fog text-sm">Bir konsol secin veya yenisini baslatin</span>
            )}
          </div>
          {error && <span className="text-danger text-xs">{error}</span>}
        </header>

        <div className="flex-1 min-h-0 bg-ink">
          {active ? (
            <TerminalView sessionId={active.id} />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <p className="text-fog text-sm leading-relaxed">
                  Sol panelden <span className="text-amber-soft">+ Yeni konsol</span> ile gercek
                  bir <span className="font-mono text-bone">msfconsole</span> sureci baslat.
                  Her oturum backend uzerinde kendi pty sureciyle calisir ve erisim loglanir.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
