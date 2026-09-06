import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";

function mensajeError(raw: string) {
  if (/already exists|USER_ALREADY/i.test(raw)) {
    return "Ese correo ya tiene cuenta. Prueba a entrar.";
  }
  if (/invalid.*(email|password)|INVALID_EMAIL_OR_PASSWORD/i.test(raw)) {
    return "Correo o contraseña no válidos.";
  }
  if (/too short|min(imum)?|PASSWORD/i.test(raw) && /8|short/i.test(raw)) {
    return "La contraseña tiene que tener al menos 8 caracteres.";
  }
  return raw || "No se ha podido. Prueba otra vez.";
}

export function EmailAuthForm({
  onOk,
  onIntentar,
}: {
  onOk?: () => void;
  onIntentar?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    onIntentar?.();
    const correo = email.trim();
    if (!correo || password.length < 8) {
      setError("Pon un correo y una contraseña de al menos 8 caracteres.");
      return;
    }
    setPendiente(true);
    const nombre = correo.split("@")[0] || "Opositor";
    try {
      const res =
        modo === "crear"
          ? await authClient.signUp.email({
              email: correo,
              password,
              name: nombre,
            })
          : await authClient.signIn.email({
              email: correo,
              password,
            });
      if (res.error) throw new Error(res.error.message);
      await authClient.getSession();
      onOk?.();
    } catch (err) {
      setError(
        mensajeError(err instanceof Error ? err.message : ""),
      );
    } finally {
      setPendiente(false);
    }
  }

  return (
    <form onSubmit={(e) => void enviar(e)} className="space-y-2">
      <p className="text-xs font-medium text-muted">O con correo</p>
      <input
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Correo"
        className="h-11 w-full rounded-full border-0 bg-surface-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        type="password"
        autoComplete={modo === "crear" ? "new-password" : "current-password"}
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña (8 o más)"
        className="h-11 w-full rounded-full border-0 bg-surface-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pendiente}
        className="h-11 w-full rounded-full bg-surface-2 text-sm font-semibold disabled:opacity-40"
      >
        {pendiente
          ? "Un momento…"
          : modo === "crear"
            ? "Crear cuenta"
            : "Entrar con correo"}
      </button>
      <button
        type="button"
        onClick={() => {
          setModo((m) => (m === "crear" ? "entrar" : "crear"));
          setError(null);
        }}
        className="h-11 w-full text-sm font-medium text-muted"
      >
        {modo === "crear"
          ? "Ya tengo cuenta"
          : "Crear cuenta con correo"}
      </button>
    </form>
  );
}
