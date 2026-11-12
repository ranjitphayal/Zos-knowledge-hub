"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/email/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "The reset link may have expired. Request a new one.");
      } else {
        setMessage("Password updated. You can now sign in with your new password.");
      }
    } catch {
      setError("Unable to reach the account service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand" aria-hidden="true">Z</div>
        <div className="mt-5 text-[10px] font-bold tracking-[0.2em] text-violet-600">ZSYSPRO HUB</div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Choose a password with at least 12 characters.</p>
        {error && <p className="auth-message" role="alert">{error}</p>}
        {message && <p className="auth-success" role="status">{message}</p>}
        {!message && (
          <form className="auth-form" onSubmit={submit}>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="auth-submit" type="submit" disabled={busy || !token}>
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
        <Link className="auth-link" href="/">Back to sign in</Link>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-loading">Loading password reset…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
