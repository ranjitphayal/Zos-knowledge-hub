# ZSYSPRO HUB

**The Ultimate Workspace for z/OS System Programmers**

ZSYSPRO HUB is an account-based learning workspace for mainframe professionals. The web app uses Next.js on Vercel; its FastAPI API and PostgreSQL database are designed to run as an Azure App Service container.

## What is implemented

- Google and Microsoft OpenID Connect sign-in, backed by verified provider identities.
- Short-lived, one-use sign-in codes exchanged server-side for a JWT held in a `Secure`, `HttpOnly`, `SameSite=Lax` browser cookie.
- PostgreSQL user accounts and per-account learning progress.
- Dashboard stats and activity chart calculated from the signed-in user’s saved progress.
- Learning progress and account details are not shared across users.
- Unconnected system telemetry, news, and vendor status are shown as **not connected**. They are not represented with invented live data.

The login flow is real once the site owner provisions the database, deploys the API, and registers Google/Microsoft OAuth applications. Sign-in is via Google or Microsoft; this project does not accept users' Google/Microsoft passwords directly.

## Run locally

Requirements: Node.js 20.9+, Python 3.12, Docker Desktop.

1. Copy `backend/.env.example` to `backend/.env`, then set distinct random `JWT_SECRET` and `SESSION_SECRET` values.
2. From `backend`, start the local API and PostgreSQL:

   ```powershell
   docker compose up --build
   ```

3. In a separate terminal, from the project root:

   ```powershell
   npm install
   npm run dev
   ```

4. Open `http://localhost:3000`. Add OAuth app credentials to `backend/.env` and configure each provider’s redirect URI as `http://localhost:8000/auth/google/callback` or `http://localhost:8000/auth/microsoft/callback`.

The API container applies Alembic migrations before starting. Check `http://localhost:8000/health` and `http://localhost:8000/ready`.

## Provider setup

Create OAuth/OIDC web applications in Google Cloud Console and Microsoft Entra ID. Register the corresponding callback URL shown above for local use, and `https://<your-api-host>/auth/google/callback` or `https://<your-api-host>/auth/microsoft/callback` for production. Set the client IDs and secrets in the API environment; never put secrets in frontend variables or source control. Microsoft uses the `common` tenant by default; change `MICROSOFT_TENANT` if sign-in should be limited to a tenant.

## Azure API deployment

Create an Azure Database for PostgreSQL Flexible Server database and a Linux Azure App Service configured to run the `backend/Dockerfile` container. Configure these App Service environment settings:

- `APP_ENV=production`
- `DATABASE_URL=postgresql+asyncpg://...` for the Azure database, with SSL required by the database server (for example append `?ssl=require`)
- `JWT_SECRET` and `SESSION_SECRET`: distinct, cryptographically random values of at least 32 characters
- `FRONTEND_URL=https://zosknowledge-hu.vercel.app` (replace with your final Vercel/custom-domain origin)
- `BACKEND_URL=https://<your-api-host>.azurewebsites.net`
- `ALLOWED_ORIGINS` set to the frontend origin
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, and `MICROSOFT_CLIENT_SECRET`
- Optional `MICROSOFT_TENANT` and `JWT_TTL_MINUTES` (default: 720 minutes)

Set App Service's container port to `8000`. Azure's managed database and app service may incur charges; confirm current plan pricing before enabling production resources.

## Vercel frontend setup

In the Vercel project settings, set the server-only environment variable `BACKEND_API_URL` to the Azure API's HTTPS origin (for example `https://<your-api-host>.azurewebsites.net`). Redeploy after setting it. The Next.js server routes use this value to call the API and keep JWTs out of browser JavaScript.

The currently deployed starter project may still point to the earlier demo commit until these changes are committed and deployed. Use the `zosknowledgehub` project name in Vercel; its existing deployment URL may retain its previous slug. Add your own domain in Vercel when ready and update `FRONTEND_URL`, `ALLOWED_ORIGINS`, and provider callback setup to match.

## Personal data and future advertising

The API stores an OAuth provider subject, name, email when provided, avatar URL, learning progress, and progress activity. Account deletion is available under **Settings**. Before inviting the public or adding advertising, publish reviewed privacy/terms pages, explain analytics and ad cookies clearly, configure consent controls where applicable, and review Google/Microsoft and hosting-provider policies. Do not send secrets or z/OS production credentials through this learning portal.

## Current limitations

- Learning modules in this first iteration are a small introductory catalog; progress is saved when users explicitly mark a lesson complete.
- There is no live IBM/vendor news feed or z/OS telemetry connector. Those integrations require trusted data sources and a separately designed, secured integration.
- Self-service email/password registration, password reset, moderation, subscriptions, and ad integrations are not implemented.
