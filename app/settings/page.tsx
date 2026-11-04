"use client";

import { useState } from "react";
import { ArrowLeft, LoaderCircle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { Card } from "@/components/ui/card";

function AccountSettings() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const deleteAccount = async () => {
    const confirmed = window.confirm("Permanently delete your account and saved learning progress? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "Account deletion failed.");
      }
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Account deletion failed.");
      setDeleting(false);
    }
  };

  return (
    <main className="lesson-page">
      <Card className="lesson-card">
        <button className="lesson-back" onClick={() => router.push("/")}><ArrowLeft size={15} /> Dashboard</button>
        <h1 className="mt-7 text-2xl font-bold text-slate-900">Account settings</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Manage your ZSYSPRO HUB account and saved learning progress.</p>
        <section className="mt-8 rounded-xl border border-rose-100 bg-rose-50/50 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 text-rose-600" size={19} />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Delete your account</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">This permanently removes your profile and saved learning progress. You can create a new account later by signing in again.</p>
              {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
              <button onClick={deleteAccount} disabled={deleting} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg bg-rose-700 px-3 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
                {deleting && <LoaderCircle className="animate-spin" size={14} />}
                {deleting ? "Deleting…" : "Permanently delete account"}
              </button>
            </div>
          </div>
        </section>
      </Card>
    </main>
  );
}

export default function SettingsPage() {
  return <AuthGate><AccountSettings /></AuthGate>;
}
