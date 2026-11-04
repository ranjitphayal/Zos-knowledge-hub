"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, LoaderCircle, LockKeyhole } from "lucide-react";

type ProviderStatus = {
  google: boolean;
  microsoft: boolean;
  configured: boolean;
};

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"loading" | "signed-out" | "signed-in" | "unavailable">("loading");
  const [providers, setProviders] = useState<ProviderStatus>({
    google: false,
    microsoft: false,
    configured: false,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const authError = query.get("authError");
    if (authError) {
      setError(authError.replaceAll("_", " "));
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

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand"><BookOpen size={22} /></div>
        <div className="mt-5 text-[10px] font-bold tracking-[0.2em] text-violet-600">ZSYSPRO HUB</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Your z/OS workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign in with your work or personal account to save your learning progress and use your own dashboard.
        </p>

        {error && <p className="auth-message" role="alert">Sign-in did not complete ({error}). Please try again.</p>}
        {status === "unavailable" && (
          <p className="auth-message" role="status">
            The account service is not available yet. The site owner must configure its backend URL and identity-provider credentials.
          </p>
        )}

        <div className="mt-6 space-y-3">
          <a className={`auth-provider ${providers.google ? "" : "auth-provider-disabled"}`} href={providers.google ? "/api/auth/login/google" : undefined} aria-disabled={!providers.google}>
            <GoogleMark /> Continue with Google
          </a>
          <a className={`auth-provider ${providers.microsoft ? "" : "auth-provider-disabled"}`} href={providers.microsoft ? "/api/auth/login/microsoft" : undefined} aria-disabled={!providers.microsoft}>
            <MicrosoftMark /> Continue with Microsoft
          </a>
        </div>
        {!providers.configured && status !== "unavailable" && (
          <p className="mt-3 text-center text-xs text-slate-400">Sign-in providers will appear here after the site owner configures them.</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <LockKeyhole size={13} /> Secure sign-in. Your password is never shared with ZSYSPRO HUB.
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
