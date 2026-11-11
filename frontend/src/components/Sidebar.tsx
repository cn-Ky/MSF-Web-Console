import type { SessionSummary, AuthUser } from "../api";

interface Props {
  sessions: SessionSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onKill: (id: string) => void;
  creating: boolean;
  user: AuthUser;
  onLogout: () => void;
}

export default function Sidebar({
  sessions,
  activeId,
  onSelect,
  onCreate,
  onKill,
  creating,
  user,
  onLogout,
}: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-line bg-panel flex flex-col">
      <div className="px-4 py-5 border-b border-line">
        <div className="text-bone font-mono text-sm tracking-tight">msf-web-console</div>
        <div className="text-fog text-xs mt-1">msfconsole icin web kabugu</div>
      </div>

      <button
        onClick={onCreate}
        disabled={creating}
        className="mx-4 mt-4 flex items-center justify-center gap-2 rounded-md border border-amber-dim
                   bg-amber/10 text-amber-soft text-sm font-medium py-2 hover:bg-amber/20
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {creating ? "Baslatiliyor..." : "+ Yeni konsol"}
      </button>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {sessions.length === 0 && (
          <p className="text-fog text-xs px-2 py-6 text-center leading-relaxed">
            Henuz aktif oturum yok.
            <br />
            "Yeni konsol" ile bir msfconsole baslat.
          </p>
        )}
        {sessions.map((s) => {
          const isActive = s.id === activeId;
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`group flex items-center justify-between gap-2 rounded-md px-3 py-2 cursor-pointer
                text-sm transition-colors
                ${isActive ? "bg-ink border border-line text-bone" : "text-fog hover:bg-ink/60 hover:text-bone"}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    s.status === "running" ? "bg-live" : "bg-danger"
                  }`}
                />
                <span className="truncate font-mono text-xs">{s.label}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onKill(s.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-fog hover:text-danger text-xs transition-opacity"
                title="Oturumu sonlandir"
              >
                ✕
              </button>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-bone text-xs font-mono truncate">{user.username}</div>
          <div className="text-fog text-[11px]">{user.role}</div>
        </div>
        <button
          onClick={onLogout}
          className="text-fog hover:text-danger text-xs shrink-0"
        >
          Cikis
        </button>
      </div>
    </aside>
  );
}
