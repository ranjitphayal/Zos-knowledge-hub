"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  Database,
  FileText,
  Gauge,
  GraduationCap,
  Headphones,
  Layers3,
  LifeBuoy,
  Menu,
  MessageSquareText,
  Newspaper,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [{ label: "Overview", icon: Gauge }],
  },
  {
    label: "LEARN & GROW",
    items: [
      { label: "Learning paths", icon: GraduationCap },
      { label: "Knowledge base", icon: BookOpen },
      { label: "Career center", icon: Layers3 },
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      { label: "System tools", icon: Terminal },
      { label: "Troubleshooting", icon: Activity },
      { label: "Documentation", icon: FileText },
    ],
  },
  {
    label: "COMMUNITY",
    items: [
      { label: "Ask the community", icon: MessageSquareText },
      { label: "Support center", icon: LifeBuoy },
    ],
  },
];

type Course = {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  percent_complete: number;
};

type DashboardData = {
  user: { id: number; email: string | null; full_name: string; avatar_url: string | null };
  stats: {
    learning_progress_percent: number;
    modules_completed: number;
    knowledge_points: number;
    courses_count: number;
  };
  courses: Course[];
  activity: { day: string; learning: number }[];
  system_integrations: { zos_connected: boolean };
};

function Logo() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="brand-mark">
        <Command size={20} strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-extrabold tracking-[0.12em] text-white">ZSYSPRO</div>
        <div className="mt-1 text-[9px] font-semibold tracking-[0.31em] text-slate-400">HUB</div>
      </div>
    </div>
  );
}

function Sidebar({
  active,
  onNavigate,
  onClose,
  progress,
}: {
  active: string;
  onNavigate: (label: string) => void;
  onClose?: () => void;
  progress: number;
}) {
  return (
    <aside className="sidebar scrollbar-hidden">
      <div className="flex items-center justify-between">
        <Logo />
        {onClose && (
          <button onClick={onClose} className="mr-4 rounded-lg p-2 text-slate-400 hover:bg-white/10 md:hidden" aria-label="Close navigation">
            <X size={18} />
          </button>
        )}
      </div>
      <div className="mx-5 mb-6 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-3">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Z/OS LEARNING TRACK
        </div>
        <div className="mt-3 flex items-end justify-between">
          <span className="text-sm font-semibold text-slate-100">Your progress</span>
          <span className="text-xs font-bold text-violet-300">{progress}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" style={{ width: `${progress}%` }} />
        </div>
        <button onClick={() => onNavigate("Learning paths")} className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-white">
          Continue learning <ArrowRight size={13} />
        </button>
      </div>
      <nav className="space-y-6 px-3">
        {navGroups.map((group) => (
          <section key={group.label}>
            <h2 className="mb-2 px-3 text-[9px] font-bold tracking-[0.18em] text-slate-500">{group.label}</h2>
            <div className="space-y-1">
              {group.items.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => {
                    onNavigate(label);
                    onClose?.();
                  }}
                  className={`nav-item ${active === label ? "nav-item-active" : ""}`}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span className="flex-1 text-left">{label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </nav>
      <div className="mt-auto px-5 pb-5 pt-8">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-violet-200"><Sparkles size={14} /> HUB ASSISTANT</div>
          <p className="mb-3 mt-2 text-[11px] leading-relaxed text-slate-400">Your z/OS questions, answered with context.</p>
          <button onClick={() => onNavigate("Ask the community")} className="text-xs font-semibold text-white hover:text-violet-200">Ask a question <ArrowRight className="ml-1 inline" size={12} /></button>
        </div>
        <a href="/settings" className="mt-4 flex w-full items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-white">
          <Settings2 size={15} /> Settings <ChevronRight className="ml-auto" size={14} />
        </a>
      </div>
    </aside>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="mb-1.5 text-[9px] font-bold tracking-[0.16em] text-violet-600">{eyebrow}</div>}
        <h2 className="text-[16px] font-bold tracking-[-0.025em] text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  return <AuthGate><Dashboard /></AuthGate>;
}

function Dashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [toast, setToast] = useState("");
  const [today, setToday] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setToday(new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()).toUpperCase());
    fetch("/api/session", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/");
          return;
        }
        if (!response.ok) throw new Error("Could not load your account data.");
        setDashboard(await response.json());
      })
      .catch(() => setError("Your account data could not be loaded. Please refresh the page."));
  }, []);

  const filteredCourses = useMemo(() => (
    dashboard?.courses.filter((course) => `${course.title} ${course.description}`.toLowerCase().includes(search.toLowerCase())) ?? []
  ), [dashboard, search]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  };

  if (!dashboard) {
    return <div className="auth-loading">{error || "Loading your personal workspace…"}</div>;
  }
  const firstName = dashboard.user.full_name.trim().split(/\s+/)[0] || "there";
  const initials = dashboard.user.full_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const stats = [
    { title: "Learning progress", value: `${dashboard.stats.learning_progress_percent}%`, note: "Across your learning modules", icon: GraduationCap, color: "purple" },
    { title: "Modules completed", value: String(dashboard.stats.modules_completed), note: `Of ${dashboard.stats.courses_count} available modules`, icon: BookOpen, color: "blue" },
    { title: "Knowledge points", value: dashboard.stats.knowledge_points.toLocaleString(), note: "Earned from completed modules", icon: Sparkles, color: "orange" },
    { title: "z/OS connection", value: dashboard.system_integrations.zos_connected ? "Connected" : "Not connected", note: "Connect a system to show live health", icon: ShieldCheck, color: dashboard.system_integrations.zos_connected ? "green" : "orange" },
  ];

  return (
    <div className="app-shell">
      <div className="hidden md:block"><Sidebar active={activeNav} onNavigate={setActiveNav} progress={dashboard.stats.learning_progress_percent} /></div>
      <AnimatePresence>
        {mobileNav && (
          <motion.div className="fixed inset-0 z-50 bg-slate-950/50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)}>
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 26, stiffness: 260 }} onClick={(event) => event.stopPropagation()}>
              <Sidebar active={activeNav} onNavigate={setActiveNav} onClose={() => setMobileNav(false)} progress={dashboard.stats.learning_progress_percent} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main-panel">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="Open navigation"><Menu size={19} /></button>
            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span>Workspace</span><ChevronRight size={13} /><span className="font-semibold text-slate-700">{activeNav}</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden text-xs font-semibold text-slate-700">{activeNav}</div>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search modules..." aria-label="Search learning modules" />
              <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-400 lg:inline">⌘ K</kbd>
            </label>
            <div className="relative">
              <button onClick={() => setShowNotifications((value) => !value)} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications">
                <Bell size={17} />
              </button>
              <AnimatePresence>
                {showNotifications && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-line bg-white p-4 shadow-xl">
                  <div className="font-bold text-sm">Notifications</div>
                  <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-slate-500">You’re all caught up. Notifications will appear here when available.</p>
                </motion.div>}
              </AnimatePresence>
            </div>
            <button onClick={signOut} title="Sign out" className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 transition hover:bg-slate-100">
              <div className="avatar">{initials}</div><span className="hidden max-w-36 text-left sm:block"><span className="block truncate text-xs font-semibold text-slate-700">{dashboard.user.full_name}</span><span className="mt-0.5 block truncate text-[10px] text-slate-400">{dashboard.user.email || "Signed-in member"}</span></span><ChevronDown size={13} className="hidden text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <motion.section className="welcome-banner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="relative z-10 max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-violet-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{today || "YOUR MAINFRAME WORKSPACE"}</div>
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.04em] text-white sm:text-[32px]">Welcome, {firstName} <span className="inline-block origin-bottom animate-[wave_1.7s_ease-in-out_infinite]">✦</span></h1>
              <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-indigo-100/75 sm:text-[13px]">Your account is ready. Your learning progress is saved to your profile on this device-independent account.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button onClick={() => setActiveNav("Learning paths")} className="primary-button">Continue learning <ArrowRight size={14} /></button>
                <button onClick={() => setActiveNav("System tools")} className="ghost-button"><Terminal size={14} /> Open system tools</button>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-chip"><Command size={28} /></div>
              <div className="hero-float float-a"><Server size={15} /><span>z/OS connection</span></div>
              <div className="hero-float float-b"><Activity size={15} /><span>{dashboard.system_integrations.zos_connected ? "Connected" : "Not connected"}</span></div>
            </div>
            <div className="banner-grid" aria-hidden="true" />
          </motion.section>

          <section className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index }}>
                <Card className="stat-card">
                  <div className={`stat-icon icon-${stat.color}`}><stat.icon size={17} /></div>
                  <div className="mt-3 text-[11px] font-medium text-muted">{stat.title}</div>
                  <div className="mt-1 text-[20px] font-bold tracking-[-0.04em] text-ink">{stat.value}</div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400"><span>{stat.note}</span></div>
                </Card>
              </motion.div>
            ))}
          </section>

          <div className="content-grid">
            <div className="min-w-0 space-y-5">
              <Card className="p-5">
                <SectionHeading eyebrow="YOUR ACCOUNT" title="Learning activity" action={<span className="text-[10px] text-slate-400">Last 7 days</span>} />
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="chart-dot bg-violet-500" /> Learning</div>
                  <span className="ml-auto text-[10px] text-slate-400">Recorded progress updates</span>
                </div>
                <div className="h-[178px] w-full">
                  {dashboard.activity.some((day) => day.learning > 0) ? <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dashboard.activity} margin={{ top: 5, right: 3, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="learningFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7769ee" stopOpacity={0.18} /><stop offset="95%" stopColor="#7769ee" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#edf0f6" strokeDasharray="3 4" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#98a1b3", fontSize: 10 }} dy={9} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#98a1b3", fontSize: 9 }} />
                      <Tooltip contentStyle={{ border: "1px solid #e9edf4", borderRadius: 10, fontSize: 11, boxShadow: "0 6px 20px #15223912" }} />
                      <Area type="monotone" dataKey="learning" name="Progress updates" stroke="#7668e9" strokeWidth={2} fill="url(#learningFill)" />
                    </AreaChart>
                  </ResponsiveContainer> : <div className="grid h-full place-items-center text-center text-xs text-slate-400">Your recorded learning activity will appear here.</div>}
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeading eyebrow="PICK UP WHERE YOU LEFT OFF" title="Continue learning" action={<button onClick={() => setActiveNav("Learning paths")} className="text-[10px] font-semibold text-violet-600 hover:text-violet-800">All learning paths <ArrowRight className="ml-1 inline" size={12} /></button>} />
                <div className="space-y-2.5">
                  {filteredCourses.map((course, index) => {
                    const icons = [Terminal, Server, Database];
                    const colors = ["violet", "blue", "orange"];
                    const Icon = icons[index % icons.length];
                    const color = colors[index % colors.length];
                    return (
                      <div key={course.slug} className="lesson-row">
                        <div className={`lesson-icon lesson-${color}`}><Icon size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3"><h3 className="truncate text-xs font-bold text-slate-700">{course.title}</h3><span className="shrink-0 text-[10px] font-semibold text-slate-500">{course.percent_complete}%</span></div>
                          <p className="mt-1 text-[10px] text-slate-400">{course.description}</p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full progress-${color}`} style={{ width: `${course.percent_complete}%` }} /></div>
                        </div>
                        <button onClick={() => router.push(`/learning/${course.slug}`)} title={`Open ${course.title}`} aria-label={`Open ${course.title}`} className="play-button"><ArrowRight size={15} /></button>
                      </div>
                    );
                  })}
                  {filteredCourses.length === 0 && <p className="py-5 text-center text-xs text-slate-400">{search ? "No learning modules match your search." : "No learning modules are available yet."}</p>}
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeading eyebrow="NEWS & ANNOUNCEMENTS" title="Mainframe news" />
                <div className="rounded-xl bg-slate-50 px-4 py-5 text-center">
                  <Newspaper className="mx-auto text-slate-300" size={22} />
                  <p className="mt-2 text-xs font-semibold text-slate-600">News feed not connected</p>
                  <p className="mx-auto mt-1 max-w-sm text-[11px] leading-relaxed text-slate-400">We’ll show verified IBM and mainframe announcements here when a live news source is configured.</p>
                </div>
              </Card>
            </div>

            <div className="min-w-0 space-y-5">
              <Card className="p-5">
                <SectionHeading eyebrow="SYSTEM CONNECTION" title="z/OS system health" />
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="health-icon health-icon-muted"><Server size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-700">No system connected</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">Live metrics are not available</div>
                    </div>
                    <span className="connection-pill">Not connected</span>
                  </div>
                  <p className="mt-4 border-t border-slate-200/70 pt-3 text-[10px] leading-relaxed text-slate-400">Connect a customer-managed monitoring integration to display real system metrics. No z/OS credentials are collected by this demo.</p>
                </div>
                <button onClick={() => setActiveNav("System tools")} className="mt-3 w-full rounded-lg py-2 text-[10px] font-semibold text-violet-600 transition hover:bg-violet-50">Explore integration options <ArrowRight className="ml-1 inline" size={12} /></button>
              </Card>

              <Card className="p-5">
                <SectionHeading eyebrow="SERVICE AVAILABILITY" title="Vendor support status" />
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold text-slate-600">No support feeds connected</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">Vendor incidents are not monitored yet. Status will appear here after a verified vendor feed is configured.</p>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-start gap-3 p-5 pb-4">
                  <div className="daily-icon"><Sparkles size={17} /></div>
                  <div><div className="text-[9px] font-bold tracking-[0.15em] text-violet-600">DAILY LEARNING</div><h2 className="mt-1 text-sm font-bold text-ink">The 5-minute mainframe</h2></div>
                </div>
                <div className="px-5 pb-4">
                  <div className="rounded-xl bg-gradient-to-br from-[#f3f2ff] to-[#f7f8ff] p-4">
                    <div className="text-[9px] font-bold tracking-[0.1em] text-violet-600">FEATURED LEARNING NOTE</div>
                    <h3 className="mt-2 text-[14px] font-bold leading-snug text-slate-800">What happens during an IPL?</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">A look at the Initial Program Load sequence—from hardware reset to the first JES2 job.</p>
                    <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-400"><span>5 min read</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>Beginner friendly</span></div>
                  </div>
                  <button onClick={() => router.push("/learning/jcl-fundamentals")} className="mt-3 flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700">Open JCL Fundamentals <ArrowRight size={13} /></button>
                </div>
                <div className="border-t border-line bg-slate-50/60 px-5 py-3">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500"><Check size={13} className="text-emerald-500" /> <span>Progress updates are tied to your signed-in account.</span></div>
                </div>
              </Card>

              <div className="help-card">
                <div className="flex items-center gap-2 text-white"><Headphones size={17} /><span className="text-xs font-bold">Need a hand?</span></div>
                <p className="mt-2 text-[10px] leading-relaxed text-indigo-100/75">Connect with mainframe experts and get unstuck faster.</p>
                <button onClick={() => setActiveNav("Ask the community")} className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-white hover:text-violet-200">Visit support center <ArrowRight size={12} /></button>
              </div>
            </div>
          </div>
          <footer className="dashboard-footer"><span>© 2026 ZSYSPRO HUB</span><span>Built for the Z community <span className="text-rose-400">♥</span></span><button onClick={() => setActiveNav("Support center")}><CircleHelp size={12} /> Help & feedback</button></footer>
        </div>
      </main>
      <AnimatePresence>
        {toast && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="toast"><Check size={15} />{toast}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
