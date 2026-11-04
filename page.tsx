"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
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
import { Card } from "@/components/ui/card";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [{ label: "Overview", icon: Gauge }],
  },
  {
    label: "LEARN & GROW",
    items: [
      { label: "Learning paths", icon: GraduationCap, badge: "12" },
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

const activityData = [
  { day: "Mon", learning: 32, operations: 22 },
  { day: "Tue", learning: 46, operations: 29 },
  { day: "Wed", learning: 37, operations: 34 },
  { day: "Thu", learning: 62, operations: 30 },
  { day: "Fri", learning: 51, operations: 44 },
  { day: "Sat", learning: 72, operations: 38 },
  { day: "Sun", learning: 58, operations: 48 },
];

const newsItems = [
  {
    source: "IBM Z",
    category: "ANNOUNCEMENT",
    title: "IBM z17: designed for the age of AI",
    summary: "Explore the latest IBM Z platform and its on-chip AI accelerator.",
    time: "2 hours ago",
    tone: "purple",
  },
  {
    source: "Mainframe Digest",
    category: "INDUSTRY",
    title: "The next generation of mainframe talent",
    summary: "How organizations are building skills pipelines for the Z platform.",
    time: "5 hours ago",
    tone: "blue",
  },
  {
    source: "IBM Documentation",
    category: "RELEASE NOTES",
    title: " z/OS 3.2: what system programmers should know",
    summary: "A quick tour of updates, lifecycle notes, and migration resources.",
    time: "Yesterday",
    tone: "orange",
  },
];

const vendors = [
  { name: "IBM Support", detail: "All services operational", icon: Boxes, status: "Operational" },
  { name: "Broadcom", detail: "All services operational", icon: Layers3, status: "Operational" },
  { name: "Rocket Software", detail: "All services operational", icon: Cloud, status: "Operational" },
];

const initialLessons = [
  { title: "JCL Fundamentals", meta: "Module 4 of 8 · 18 min left", progress: 58, icon: Terminal, color: "violet" },
  { title: "Understanding JES2", meta: "Module 2 of 6 · 26 min left", progress: 32, icon: Server, color: "blue" },
  { title: "TSO/ISPF Essentials", meta: "Module 1 of 5 · 34 min left", progress: 18, icon: Database, color: "orange" },
];

type NewsItem = (typeof newsItems)[number];

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
}: {
  active: string;
  onNavigate: (label: string) => void;
  onClose?: () => void;
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
          <span className="text-xs font-bold text-violet-300">42%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-700">
          <div className="h-full w-[42%] rounded-full bg-gradient-to-r from-violet-500 to-indigo-400" />
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
              {group.items.map(({ label, icon: Icon, badge }) => (
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
                  {badge && <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-slate-300">{badge}</span>}
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
        <button onClick={() => onNavigate("Settings")} className="mt-4 flex w-full items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-white">
          <Settings2 size={15} /> Settings <ChevronRight className="ml-auto" size={14} />
        </button>
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

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group border-b border-line py-3.5 last:border-0 last:pb-0 first:pt-0">
      <div className="mb-2 flex items-center gap-2">
        <span className={`source-dot source-${item.tone}`} />
        <span className="text-[11px] font-semibold text-slate-600">{item.source}</span>
        <span className="ml-auto text-[10px] text-slate-400">{item.time}</span>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[8px] font-bold tracking-[0.13em] text-violet-600">{item.category}</span>
          <h3 className="mt-1 text-[13px] font-bold leading-snug text-ink group-hover:text-violet-700">{item.title}</h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.summary}</p>
        </div>
        <ArrowUpRight className="mt-4 shrink-0 text-slate-300 transition group-hover:text-violet-600" size={15} />
      </div>
    </article>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [lessons, setLessons] = useState(initialLessons);
  const [savedNews, setSavedNews] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()).toUpperCase());
  }, []);

  const filteredNews = useMemo(
    () => newsItems.filter((item) => `${item.title} ${item.summary} ${item.source}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const startLesson = (title: string) => {
    setToast(`Resuming ${title}`);
    window.setTimeout(() => setToast(""), 2600);
  };

  const toggleSavedNews = (title: string) => {
    const isSaved = savedNews.includes(title);
    setSavedNews((current) => isSaved ? current.filter((item) => item !== title) : [...current, title]);
    setToast(isSaved ? "Removed from saved updates" : "Announcement saved");
    window.setTimeout(() => setToast(""), 2600);
  };

  return (
    <div className="app-shell">
      <div className="hidden md:block"><Sidebar active={activeNav} onNavigate={setActiveNav} /></div>
      <AnimatePresence>
        {mobileNav && (
          <motion.div className="fixed inset-0 z-50 bg-slate-950/50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNav(false)}>
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 26, stiffness: 260 }} onClick={(event) => event.stopPropagation()}>
              <Sidebar active={activeNav} onNavigate={setActiveNav} onClose={() => setMobileNav(false)} />
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
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search hub..." aria-label="Search news and announcements" />
              <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[9px] text-slate-400 lg:inline">⌘ K</kbd>
            </label>
            <div className="relative">
              <button onClick={() => setShowNotifications((value) => !value)} className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100" aria-label="Notifications">
                <Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <AnimatePresence>
                {showNotifications && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-12 z-30 w-64 rounded-xl border border-line bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between font-bold text-sm">Notifications <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">2 new</span></div>
                  <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-slate-600">Your JCL Fundamentals learning path is ready to continue.</p>
                  <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-slate-600">IBM Support status: all services operational.</p>
                </motion.div>}
              </AnimatePresence>
            </div>
            <button onClick={() => setActiveNav("Profile")} className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 transition hover:bg-slate-100">
              <div className="avatar">RS</div><span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-700">Ravi Sharma</span><span className="mt-0.5 block text-[10px] text-slate-400">System Programmer</span></span><ChevronDown size={13} className="hidden text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <motion.section className="welcome-banner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="relative z-10 max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-[9px] font-bold tracking-[0.2em] text-violet-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{today || "YOUR MAINFRAME WORKSPACE"}</div>
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.04em] text-white sm:text-[32px]">Good morning, Ravi <span className="inline-block origin-bottom animate-[wave_1.7s_ease-in-out_infinite]">✦</span></h1>
              <p className="mt-2 max-w-lg text-[12px] leading-relaxed text-indigo-100/75 sm:text-[13px]">Your z/OS workspace is ready. Pick up where you left off or explore what’s new across the mainframe community.</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <button onClick={() => setActiveNav("Learning paths")} className="primary-button">Continue learning <ArrowRight size={14} /></button>
                <button onClick={() => setActiveNav("System tools")} className="ghost-button"><Terminal size={14} /> Open system tools</button>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-chip"><Command size={28} /></div>
              <div className="hero-float float-a"><Server size={15} /><span>z/OS 3.2</span></div>
              <div className="hero-float float-b"><Activity size={15} /><span>Systems online</span></div>
            </div>
            <div className="banner-grid" aria-hidden="true" />
          </motion.section>

          <section className="stats-grid">
            {[
              { title: "Learning streak", value: "12 days", note: "+3 from last week", icon: GraduationCap, color: "purple", trend: "up" },
              { title: "Modules completed", value: "24", note: "of 56 in your track", icon: BookOpen, color: "blue", trend: "up" },
              { title: "Knowledge points", value: "1,840", note: "Top 18% this month", icon: Sparkles, color: "orange", trend: "up" },
              { title: "System health", value: "All clear", note: "3 environments online", icon: ShieldCheck, color: "green", trend: "steady" },
            ].map((stat, index) => (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index }}>
                <Card className="stat-card">
                  <div className={`stat-icon icon-${stat.color}`}><stat.icon size={17} /></div>
                  <div className="mt-3 text-[11px] font-medium text-muted">{stat.title}</div>
                  <div className="mt-1 text-[20px] font-bold tracking-[-0.04em] text-ink">{stat.value}</div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                    {stat.trend === "up" ? <ArrowUpRight size={12} className="text-emerald-500" /> : <Activity size={12} className="text-emerald-500" />}
                    <span>{stat.note}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </section>

          <div className="content-grid">
            <div className="min-w-0 space-y-5">
              <Card className="p-5">
                <SectionHeading eyebrow="YOUR WORKSPACE" title="Activity overview" action={<button className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-medium text-slate-500 hover:bg-slate-50">This week <ChevronDown size={12} /></button>} />
                <div className="mb-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="chart-dot bg-violet-500" /> Learning</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="chart-dot bg-sky-400" /> Operations</div>
                  <span className="ml-auto text-[10px] text-slate-400"><ArrowUpRight size={12} className="mr-0.5 inline text-emerald-500" /> 18% vs last week</span>
                </div>
                <div className="h-[178px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData} margin={{ top: 5, right: 3, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="learningFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7769ee" stopOpacity={0.18} /><stop offset="95%" stopColor="#7769ee" stopOpacity={0} /></linearGradient>
                        <linearGradient id="opsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#43b7df" stopOpacity={0.15} /><stop offset="95%" stopColor="#43b7df" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#edf0f6" strokeDasharray="3 4" />
                      <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#98a1b3", fontSize: 10 }} dy={9} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#98a1b3", fontSize: 9 }} />
                      <Tooltip contentStyle={{ border: "1px solid #e9edf4", borderRadius: 10, fontSize: 11, boxShadow: "0 6px 20px #15223912" }} />
                      <Area type="monotone" dataKey="learning" name="Learning" stroke="#7668e9" strokeWidth={2} fill="url(#learningFill)" />
                      <Area type="monotone" dataKey="operations" name="Operations" stroke="#40b5dc" strokeWidth={2} fill="url(#opsFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeading eyebrow="PICK UP WHERE YOU LEFT OFF" title="Continue learning" action={<button onClick={() => setActiveNav("Learning paths")} className="text-[10px] font-semibold text-violet-600 hover:text-violet-800">All learning paths <ArrowRight className="ml-1 inline" size={12} /></button>} />
                <div className="space-y-2.5">
                  {lessons.map((lesson) => {
                    const Icon = lesson.icon;
                    return (
                      <div key={lesson.title} className="lesson-row">
                        <div className={`lesson-icon lesson-${lesson.color}`}><Icon size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3"><h3 className="truncate text-xs font-bold text-slate-700">{lesson.title}</h3><span className="shrink-0 text-[10px] font-semibold text-slate-500">{lesson.progress}%</span></div>
                          <p className="mt-1 text-[10px] text-slate-400">{lesson.meta}</p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full progress-${lesson.color}`} style={{ width: `${lesson.progress}%` }} /></div>
                        </div>
                        <button onClick={() => startLesson(lesson.title)} aria-label={`Resume ${lesson.title}`} className="play-button"><ArrowRight size={15} /></button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeading eyebrow="STAY IN THE KNOW" title="Mainframe news & IBM announcements" action={<button onClick={() => setActiveNav("Knowledge base")} className="text-[10px] font-semibold text-violet-600 hover:text-violet-800">View all <ArrowRight className="ml-1 inline" size={12} /></button>} />
                {filteredNews.length ? <div>{filteredNews.map((item) => <div key={item.title} className="news-interactive"><NewsCard item={item} /><button className={`save-news ${savedNews.includes(item.title) ? "saved-news" : ""}`} title={savedNews.includes(item.title) ? "Remove saved announcement" : "Save announcement"} aria-label={savedNews.includes(item.title) ? "Remove saved announcement" : "Save announcement"} onClick={() => toggleSavedNews(item.title)}><Bookmark size={13} fill={savedNews.includes(item.title) ? "currentColor" : "none"} /></button></div>)}</div> : <div className="py-8 text-center text-xs text-slate-400">No updates match “{search}”.</div>}
              </Card>
            </div>

            <div className="min-w-0 space-y-5">
              <Card className="p-5">
                <SectionHeading eyebrow="LIVE STATUS" title="System health" action={<span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600"><span className="pulse-dot" /> LIVE</span>} />
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="health-icon"><Server size={18} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-700">Production LPAR</div>
                      <div className="mt-0.5 text-[10px] text-slate-400">SYSPLEX-01 · z16</div>
                    </div>
                    <span className="status-pill"><span /> Healthy</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200/70 pt-3">
                    <div><div className="text-[9px] text-slate-400">CPU</div><div className="mt-1 text-xs font-bold text-slate-700">32%</div><div className="mini-meter"><span className="bg-emerald-400" style={{ width: "32%" }} /></div></div>
                    <div><div className="text-[9px] text-slate-400">MEMORY</div><div className="mt-1 text-xs font-bold text-slate-700">68%</div><div className="mini-meter"><span className="bg-violet-400" style={{ width: "68%" }} /></div></div>
                    <div><div className="text-[9px] text-slate-400">UPTIME</div><div className="mt-1 text-xs font-bold text-slate-700">99.98%</div><div className="mini-meter"><span className="bg-sky-400" style={{ width: "95%" }} /></div></div>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-line px-3.5 py-3">
                  <div className="flex items-center gap-2.5"><div className="health-icon health-icon-muted"><Database size={16} /></div><div><div className="text-[11px] font-semibold text-slate-700">Development LPAR</div><div className="mt-0.5 text-[9px] text-slate-400">SYSPLEX-DEV · z/OS 3.2</div></div></div><span className="status-pill"><span /> Healthy</span>
                </div>
                <button onClick={() => setActiveNav("System tools")} className="mt-3 w-full rounded-lg py-2 text-[10px] font-semibold text-violet-600 transition hover:bg-violet-50">View system dashboard <ArrowRight className="ml-1 inline" size={12} /></button>
              </Card>

              <Card className="p-5">
                <SectionHeading eyebrow="SERVICE AVAILABILITY" title="Vendor support status" action={<button onClick={() => setActiveNav("Support center")} className="text-[10px] font-semibold text-violet-600 hover:text-violet-800">Details</button>} />
                <div className="space-y-3.5">
                  {vendors.map(({ name, detail, icon: Icon, status }) => (
                    <div key={name} className="flex items-center gap-2.5">
                      <div className="vendor-icon"><Icon size={15} /></div>
                      <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold text-slate-700">{name}</div><div className="mt-0.5 text-[9px] text-slate-400">{detail}</div></div>
                      <span className="h-2 w-2 rounded-full bg-emerald-400" title={status} />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-[10px] font-medium text-emerald-700"><ShieldCheck size={14} /> No active incidents reported</div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-start gap-3 p-5 pb-4">
                  <div className="daily-icon"><Sparkles size={17} /></div>
                  <div><div className="text-[9px] font-bold tracking-[0.15em] text-violet-600">DAILY LEARNING</div><h2 className="mt-1 text-sm font-bold text-ink">The 5-minute mainframe</h2></div>
                </div>
                <div className="px-5 pb-4">
                  <div className="rounded-xl bg-gradient-to-br from-[#f3f2ff] to-[#f7f8ff] p-4">
                    <div className="text-[9px] font-bold tracking-[0.1em] text-violet-600">TODAY’S CONCEPT</div>
                    <h3 className="mt-2 text-[14px] font-bold leading-snug text-slate-800">What happens during an IPL?</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-slate-500">A look at the Initial Program Load sequence—from hardware reset to the first JES2 job.</p>
                    <div className="mt-3 flex items-center gap-2 text-[9px] text-slate-400"><span>5 min read</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>Beginner friendly</span></div>
                  </div>
                  <button onClick={() => startLesson("What happens during an IPL?")} className="mt-3 flex w-full items-center justify-between rounded-lg border border-line px-3 py-2.5 text-[10px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-700">Start today’s lesson <ArrowRight size={13} /></button>
                </div>
                <div className="border-t border-line bg-slate-50/60 px-5 py-3">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500"><Check size={13} className="text-emerald-500" /> <span><b className="text-slate-700">12-day streak!</b> Keep your learning momentum going.</span></div>
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
