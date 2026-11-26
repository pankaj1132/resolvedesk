# ResolveDesk authentication

Implemented: email/password signup and login, Google OAuth signup/login, server-validated dashboard access, logout and persistent sessions. Better Auth uses the existing Prisma/Neon connection. No organization roles are granted by signing up.

## Start locally (Git Bash)

Stop the running Docker watcher with Ctrl+C before applying or installing updates.

```bash
cd /c/Users/saini/Desktop/resolvedesk/web
npm ci
```

Keep your existing DATABASE_URL and DIRECT_URL in `web/.env`. Add the keys shown in `web/auth.env.example`. Generate a secret locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set BETTER_AUTH_SECRET to that value, and BETTER_AUTH_URL to `http://localhost:3000`. Use the same secret on your office and personal laptops against this development database. Keep `.env` out of Git.

## Google credentials

Open https://console.cloud.google.com/apis/credentials and create a Web application OAuth client in your ResolveDesk project. Configure the consent screen and add your Google account as a test user if the app is in testing.

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- Put the client ID and secret in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `web/.env`.

Google is optional for email login; its button remains disabled until both credentials are present. The same button registers new Google users and signs in returning users. Automatic account linking is disabled: use the original method for an existing email. Email verification, password reset and explicit account linking are future work.

## Create auth tables and run

Run migrations on the host so the generated migration SQL is saved in your Git checkout. The existing Organization model is preserved.

```bash
npx prisma validate --config=prisma7.config.ts
npx prisma migrate dev --name add_auth --config=prisma7.config.ts
npx prisma generate --config=prisma7.config.ts
npm run lint
npx tsc --noEmit
cd ..
docker compose up --build --watch --force-recreate
```

If Prisma asks to reset the database, stop and inspect the migration history; do not confirm a reset. Open http://localhost:3000/signup.

## Acceptance checks

1. In a signed-out/private browser, `/dashboard` redirects to `/login`.
2. Create an email account; dashboard shows its name/email, and refresh stays signed in.
3. Sign out; dashboard is inaccessible until signing in again. Wrong password fails.
4. Mismatched signup passwords show a validation message.
5. With a different email, continue with Google: new account succeeds, logout and returning Google login succeed.
6. Cancel Google consent: the login page displays an error without showing raw provider data.

Email verification and reset emails are not implemented. This is the development authentication milestone. Workspace membership, tenant authorization and invitation acceptance must be implemented before exposing ticket data. In-memory rate limits currently apply to one app process.

## Office laptop

Commit changed source, `web/package.json`, `web/package-lock.json` and the generated `web/prisma/migrations` directory. After pulling on the office laptop, configure its ignored `.env`, run `npm ci` in `web`, then `npx prisma generate --config=prisma7.config.ts`. Both laptops use the same Neon development database, so a migration already applied there does not need to be recreated. Start Docker from the repository root.

## References

- https://better-auth.com/docs/integrations/next
- https://better-auth.com/docs/authentication/google
