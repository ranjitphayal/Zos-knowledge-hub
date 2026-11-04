# ZSYSPRO HUB

**The Ultimate Workspace for z/OS System Programmers**

ZSYSPRO HUB is an enterprise-oriented workspace concept for z/OS system programmers, from first-time learners through experienced IBM Z professionals.

## Initial dashboard

This first iteration focuses on an interactive, responsive dashboard:

- Personalized workspace overview, learning streak, progress, and knowledge points.
- Learning activity visualization and resumable learning modules.
- Mainframe news and IBM announcements with in-page search and save feedback.
- Daily z/OS learning card, vendor support indicators, and sample system health panels.
- Responsive sidebar, notifications, profile menu, and in-app navigation states.

Dashboard telemetry and news are currently sample frontend data. The system health panel is **not connected to a live z/OS environment**, and support status is illustrative. Authentication, API persistence, and production telemetry integrations are not implemented yet.

## Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS and shadcn/ui-style Card primitive
- Recharts and Framer Motion
- Lucide icon set

## Run locally

Install Node.js 20.9 or later, then from the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To create a production build:

```bash
npm run build
npm run start
```

## Next steps

The original feature requirements were incomplete after the Home Page's "System..." section. The remaining information architecture, authentication providers, backend API, database schema, admin functionality, and deployment requirements should be defined before implementing those production features. The dashboard can be extended once those details are available.
