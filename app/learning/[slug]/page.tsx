"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Check, LoaderCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/auth-gate";
import { Card } from "@/components/ui/card";

const lessons = {
  "jcl-fundamentals": {
    title: "JCL Fundamentals",
    level: "Beginner",
    intro: "JCL (Job Control Language) describes the work a z/OS batch job should perform. A job is made of statements that identify the job, allocate data sets, and run programs.",
    sections: [
      { heading: "The three statements to recognize", body: "A JOB statement identifies the job and its accounting information. An EXEC statement selects a program or procedure. A DD statement describes the data a step uses, such as a data set or a temporary file." },
      { heading: "Read a simple job", body: "This example runs a system utility. A real installation may require additional site-specific job-card values and permissions.", code: "//REPORT  JOB (ACCT),'DAILY REPORT'\n//STEP1   EXEC PGM=IEFBR14\n//OUTPUT  DD  SYSOUT=*"},
      { heading: "What to remember", body: "JCL is interpreted by the job entry subsystem before program execution. Check statement names, continuation rules, data-set names, and the return code of each step when troubleshooting." },
    ],
  },
  "jes2-essentials": {
    title: "Understanding JES2",
    level: "Beginner",
    intro: "JES2 is a z/OS subsystem that accepts batch jobs, queues work, schedules jobs for execution, and manages job output.",
    sections: [
      { heading: "Job lifecycle", body: "A job is submitted to JES2, checked, queued, selected for execution when resources are available, and then its output is held or routed according to installation policy." },
      { heading: "Useful operator commands", body: "Installations configure command authorization and syntax. Commonly encountered commands include displaying jobs and spool usage; always consult your site's operations procedures before issuing commands.", code: "$D JOBQ\n$D SPOOL"},
      { heading: "Troubleshooting a held job", body: "Start with the job's status and JESMSGLG/JESYSMSG output. Identify whether the job is held, awaiting a class or resource, or ended with a non-zero return code. Avoid changing production queues without authorization." },
    ],
  },
  "tso-ispf": {
    title: "TSO/ISPF Essentials",
    level: "Beginner",
    intro: "TSO provides an interactive time-sharing environment. ISPF adds panel-driven tools for editing data sets, browsing output, and navigating development workflows.",
    sections: [
      { heading: "Data set naming", body: "Mainframe data sets use qualified names such as USERID.JCL.DAILY. Naming rules and access permissions are installation-specific. A catalog connects a data set name with its storage location." },
      { heading: "The ISPF editor", body: "ISPF edit commands can navigate, insert, delete, copy, and change lines. Use the site-approved editor settings and save changes deliberately; production libraries may have strict change controls.", code: "Command line: SAVE\nCommand line: FIND 'EXEC PGM'"},
      { heading: "Browse before changing", body: "For unfamiliar data, use a read-only browse first. Confirm the member, environment, and change-management approval before editing or submitting operational JCL." },
    ],
  },
} as const;

type LessonSlug = keyof typeof lessons;

function LessonContent() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug as LessonSlug;
  const lesson = lessons[slug];
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (lesson) {
      fetch("/api/session", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Your session could not be verified.");
          const dashboard = await response.json();
          setSaved(dashboard.courses.find((course: { slug: string }) => course.slug === slug)?.percent_complete === 100);
        })
        .catch(() => setError("Could not load your saved lesson status. Please refresh."));
    }
  }, [lesson, slug]);

  if (!lesson) {
    return <main className="lesson-page"><Card className="lesson-card"><h1 className="text-xl font-bold">Lesson not found</h1><button className="lesson-secondary" onClick={() => router.push("/")}>Back to dashboard</button></Card></main>;
  }

  const completeLesson = async () => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/learning/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percent_complete: 100 }),
      });
      if (!response.ok) throw new Error("Progress could not be saved. Please try again.");
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Progress could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="lesson-page">
      <article className="lesson-card">
        <button className="lesson-back" onClick={() => router.push("/")}><ArrowLeft size={15} /> Dashboard</button>
        <div className="mt-7 flex items-center gap-2 text-[10px] font-bold tracking-[0.17em] text-violet-600"><BookOpen size={14} /> {lesson.level.toUpperCase()} LEARNING</div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{lesson.title}</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{lesson.intro}</p>
        <div className="mt-8 space-y-6">
          {lesson.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-slate-800">{section.heading}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
              {"code" in section && <pre className="mt-3 overflow-x-auto rounded-xl bg-[#111b2d] p-4 text-sm leading-6 text-indigo-100"><code>{section.code}</code></pre>}
            </section>
          ))}
        </div>
        {error && <p className="mt-5 text-sm text-rose-600" role="alert">{error}</p>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <span className="text-sm text-slate-500">{saved ? "Completed — progress saved to your account." : "Finish reading, then mark this module complete."}</span>
          <button className="lesson-primary" onClick={completeLesson} disabled={saving || saved}>
            {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}
            {saved ? "Completed" : saving ? "Saving…" : "Mark module complete"}
          </button>
        </div>
      </article>
    </main>
  );
}

export default function LearningLessonPage() {
  return <AuthGate><LessonContent /></AuthGate>;
}
