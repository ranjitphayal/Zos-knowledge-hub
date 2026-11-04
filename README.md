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

The login flow is real once the site owner provisions the database, deploys the API, and registers at least the Google OAuth application. Microsoft sign-in is optional. This project does not accept users' Google/Microsoft passwords directly.

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

Create an OAuth/OIDC web application in Google Cloud Console. Register the corresponding callback URL shown above for local use, and `https://<your-api-host>/auth/google/callback` for production. Set its client ID and secret in the API environment; never put secrets in frontend variables or source control.

## Azure API deployment

For a production deployment, create an Azure Database for PostgreSQL Flexible Server database and a Linux Azure App Service configured to run the `backend/Dockerfile` container. Configure these App Service environment settings:

- `APP_ENV=production`
- `DATABASE_URL=postgresql+asyncpg://...` for the Azure database, with SSL required by the database server (for example append `?ssl=require`)
- `JWT_SECRET` and `SESSION_SECRET`: distinct, cryptographically random values of at least 32 characters
- `FRONTEND_URL=https://zosknowledge-hu.vercel.app` (replace with your final Vercel/custom-domain origin)
- `BACKEND_URL=https://<your-api-host>.azurewebsites.net`
- `ALLOWED_ORIGINS` set to the frontend origin
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Optional `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT`, and `JWT_TTL_MINUTES` (default: 720 minutes)

Set App Service's container port to `8000`. Azure's managed database and app service may incur charges; confirm current plan pricing before enabling production resources.

## Free-tier backend for testing

The root `render.yaml` is a Render Blueprint for a free FastAPI web service. It is intended for testing, not production: Render free web services spin down after 15 minutes without traffic and can take about a minute to wake. For a test database, create a free Neon PostgreSQL project; its free plan has usage limits. Review both providers' current terms and limits.

1. Create a Neon project and copy its pooled or direct connection string. Use the SQLAlchemy async format `postgresql+asyncpg://...` and require TLS with `?ssl=require` (append it with `&` if the string already has query parameters).
2. In Render, create a Blueprint from this repository's `ranjit` branch. Select the `zsyspro-hub-api` service and enter its environment values: `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, and `BACKEND_URL`. Generate separate random secrets of at least 32 characters for the JWT and session secrets. Keep all secrets in Render's environment settings, not GitHub or Vercel.
3. After Render gives the API its `https://<service>.onrender.com` address, set `BACKEND_URL` to that exact origin. In Google Cloud Console, create an OAuth client ID of type **Web application**, add `https://<service>.onrender.com/auth/google/callback` as an authorized redirect URI, and set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render.
4. Wait for the Render service to deploy and verify `https://<service>.onrender.com/health` and `/ready`.
5. In Vercel project settings, set the server-only `BACKEND_API_URL` to `https://<service>.onrender.com`, then redeploy the frontend. The Google button becomes available when the API reports Google credentials configured.

Never paste OAuth credentials or generated secrets into chat. Do not use free-tier services for sensitive or production user data.

## Vercel frontend setup

In the Vercel project settings, set the server-only environment variable `BACKEND_API_URL` to the Azure API's HTTPS origin (for example `https://<your-api-host>.azurewebsites.net`). Redeploy after setting it. The Next.js server routes use this value to call the API and keep JWTs out of browser JavaScript.

The currently deployed starter project may still point to the earlier demo commit until these changes are committed and deployed. Use the `zosknowledgehub` project name in Vercel; its existing deployment URL may retain its previous slug. Add your own domain in Vercel when ready and update `FRONTEND_URL`, `ALLOWED_ORIGINS`, and provider callback setup to match.

## Personal data and future advertising

The API stores an OAuth provider subject, name, email when provided, avatar URL, learning progress, and progress activity. Account deletion is available under **Settings**. Before inviting the public or adding advertising, publish reviewed privacy/terms pages, explain analytics and ad cookies clearly, configure consent controls where applicable, and review Google/Microsoft and hosting-provider policies. Do not send secrets or z/OS production credentials through this learning portal.

## Current limitations

- Learning modules in this first iteration are a small introductory catalog; progress is saved when users explicitly mark a lesson complete.
- There is no live IBM/vendor news feed or z/OS telemetry connector. Those integrations require trusted data sources and a separately designed, secured integration.
- Self-service email/password registration, password reset, moderation, subscriptions, and ad integrations are not implemented.
