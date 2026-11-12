"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { BookOpen, LoaderCircle, LockKeyhole } from "lucide-react";

type ProviderStatus = {
  google: boolean;
  microsoft: boolean;
  email_password: boolean;
  configured: boolean;
};

type AuthMode = "login" | "register" | "forgot" | "verify";

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "signed-out" | "signed-in" | "unavailable">("loading");
  const [providers, setProviders] = useState<ProviderStatus>({
    google: false,
    microsoft: false,
    email_password: false,
    configured: false,
  });
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const authError = query.get("authError");
    const authMessage = query.get("authMessage");
    if (authError) {
      setError(authError.replaceAll("_", " "));
    }
    if (authMessage === "email_verified") {
      setMessage("Email verified. You can now sign in.");
    }
    if (authError || authMessage) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    Promise.all([
      fetch("/api/session", { cache: "no-store" }),
      fetch("/api/auth/providers", { cache: "no-store" }),
    ])
      .then(async ([sessionResponse, providersResponse]) => {
        if (sessionResponse.ok) {
          setStatus("signed-in");
        } else if (sessionResponse.status === 401) {
          setStatus("signed-out");
        } else {
          setStatus("unavailable");
        }
        if (providersResponse.ok) setProviders(await providersResponse.json());
      })
      .catch(() => setStatus("unavailable"));
  }, []);

  if (status === "signed-in") return children;
  if (status === "loading") {
    return <div className="auth-loading"><LoaderCircle className="animate-spin" size={22} /> Checking your secure session…</div>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const action = mode === "login" ? "login" : mode === "register" ? "register" : "forgot";
    const payload = mode === "register" ? { email, full_name: name, password } : mode === "login" ? { email, password } : { email };
    try {
      const response = await fetch(`/api/auth/email/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 403 && mode === "login") {
          setMode("verify");
          setMessage("Verify your email address before signing in. You can request another verification link below.");
        } else {
          setError(result.error || "The request could not be completed.");
        }
        return;
      }

      if (mode === "login") {
        window.location.assign("/");
      } else if (mode === "register") {
        setMode("verify");
        setMessage("If this address can be registered, a verification email will be sent.");
      } else {
        setMessage("If a verified account exists for this address, a password-reset email will be sent.");
      }
    } catch {
      setError("Unable to reach the account service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/email/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Could not request a verification email.");
      } else {
        setMessage("If the account needs verification, an email will be sent.");
      }
    } catch {
      setError("Unable to reach the account service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "register" ? "Create your account" : mode === "forgot" ? "Reset your password" : mode === "verify" ? "Check your email" : "Your z/OS workspace";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><BookOpen size={22} /></div>
        <div className="mt-5 text-[10px] font-bold tracking-[0.2em] text-violet-600">ZSYSPRO HUB</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {mode === "register"
            ? "Create an account to save your learning progress and use your own dashboard."
            : mode === "forgot"
              ? "Enter your account email and we’ll send a password-reset link if an account exists."
              : mode === "verify"
                ? `Follow the link sent to ${email || "your email"} to verify your account.`
                : "Sign in with your work or personal account to save your learning progress and use your own dashboard."}
        </p>

        {error && <p className="auth-message" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}
        {status === "unavailable" && (
          <p className="auth-message" role="status">
            The account service is not available yet. Please try again later.
          </p>
        )}

        {mode !== "verify" && (
          <>
            <div className="mt-6 space-y-3">
              <a className={`auth-provider ${providers.google ? "" : "auth-provider-disabled"}`} href={providers.google ? "/api/auth/login/google" : undefined} aria-disabled={!providers.google}>
                <GoogleMark /> Continue with Google
              </a>
              <a className={`auth-provider ${providers.microsoft ? "" : "auth-provider-disabled"}`} href={providers.microsoft ? "/api/auth/login/microsoft" : undefined} aria-disabled={!providers.microsoft}>
                <MicrosoftMark /> Continue with Microsoft
              </a>
            </div>
            <div className="auth-divider"><span>or use email</span></div>
          </>
        )}

        {providers.email_password ? (
          mode === "verify" ? (
            <div className="auth-form">
              <button className="auth-submit" type="button" disabled={busy || !email} onClick={resendVerification}>
                {busy ? "Sending…" : "Resend verification email"}
              </button>
              <button className="auth-link-button" type="button" onClick={() => { setMode("login"); setError(""); setMessage(""); }}>
                Back to sign in
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={submit}>
              {mode === "register" && (
                <label>
                  Full name
                  <input autoComplete="name" required maxLength={160} value={name} onChange={(event) => setName(event.target.value)} />
                </label>
              )}
              <label>
                Email address
                <input type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              {mode !== "forgot" && (
                <label>
                  Password
                  <input
                    type="password"
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    required
                    minLength={mode === "register" ? 12 : 1}
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              )}
              {mode === "register" && <p className="auth-hint">Use at least 12 characters for your password.</p>}
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Please wait…" : mode === "register" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
              </button>
              {mode === "login" && (
                <button className="auth-link-button" type="button" onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}>
                  Forgot password?
                </button>
              )}
            </form>
          )
        ) : (
          <p className="auth-message" role="status">
            Email registration is not configured yet. The site owner must configure SMTP email delivery.
          </p>
        )}

        {providers.email_password && mode !== "verify" && (
          <p className="auth-switch">
            {mode === "register" ? "Already have an account?" : mode === "forgot" ? "Remembered your password?" : "New here?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "register" || mode === "forgot" ? "login" : "register"); setError(""); setMessage(""); }}>
              {mode === "register" || mode === "forgot" ? "Sign in" : "Create account"}
            </button>
          </p>
        )}

        {!providers.configured && !providers.email_password && status !== "unavailable" && (
          <p className="mt-3 text-center text-xs text-slate-400">Sign-in methods will appear here after the site owner configures them.</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <LockKeyhole size={13} /> Passwords are securely hashed and never stored in plain text.
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return <span aria-hidden="true" className="google-mark">G</span>;
}

function MicrosoftMark() {
  return <span aria-hidden="true" className="microsoft-mark"><i /><i /><i /><i /></span>;
}
