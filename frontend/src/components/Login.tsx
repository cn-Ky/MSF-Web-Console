import { useState, type FormEvent } from "react";
import { login, type AuthUser } from "../api";

interface Props {
  onSuccess: (user: AuthUser) => void;
}

export default function Login({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || "Giris basarisiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-ink">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-line bg-panel p-6"
      >
        <div className="mb-6">
          <div className="text-bone font-mono text-sm">msf-web-console</div>
          <div className="text-fog text-xs mt-1">Bu platform yalnizca davetli kullanicilara aciktir.</div>
        </div>

        <label className="block text-xs text-fog mb-1">Kullanici adi</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          className="w-full mb-4 rounded-md bg-ink border border-line px-3 py-2 text-sm text-bone
                     font-mono outline-none focus:border-amber-dim"
        />

        <label className="block text-xs text-fog mb-1">Sifre</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 rounded-md bg-ink border border-line px-3 py-2 text-sm text-bone
                     font-mono outline-none focus:border-amber-dim"
        />

        {error && <p className="text-danger text-xs mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full rounded-md border border-amber-dim bg-amber/10 text-amber-soft
                     text-sm font-medium py-2 hover:bg-amber/20 disabled:opacity-50
                     disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Giris yapiliyor..." : "Giris yap"}
        </button>

        <p className="text-fog text-[11px] mt-4 leading-relaxed">
          Hesabin yoksa yoneticinle iletisime gec. Yeni hesaplar yalnizca
          yonetici tarafindan eklenir, kendi kendine kayit yoktur.
        </p>
      </form>
    </div>
  );
}
