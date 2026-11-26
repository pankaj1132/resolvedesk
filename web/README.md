# ResolveDesk

## Run locally

From the `web` directory, install the dependencies and set `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` in `.env`. Use `http://localhost:3000` for the local auth URL and a secret of at least 32 characters.

```powershell
npm ci
npx prisma migrate deploy --config=prisma7.config.ts
npx prisma generate --config=prisma7.config.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You can create an account at `/signup` or sign in at `/login`.

On the dashboard, choose **Create workspace**. As its owner, you can create a private link for an Agent or Requester and share it with the invited address. The link expires in 48 hours, works once, and must be accepted while signed in with that address. Creating another link for the same workspace and email replaces the earlier link.

Open a workspace and choose **View tickets**. Requesters can submit issues and view or reply to their own tickets. Owners and Agents can work the shared inbox, set priority and status, assign tickets to workspace staff, and post private notes. A requester reply reopens a ticket that was waiting on the customer or marked resolved.

Staff can filter the inbox by **Assigned to me**, **Unassigned**, and staff-only ticket tags. Resolve a ticket before closing it. Closed tickets retain their conversation and attachments. Staff can reopen them to allow new replies and uploads. Closed tickets stay out of active backlog and SLA escalations, while recorded resolution times still count in reports.

Tickets accept PDF, PNG, JPEG and UTF-8 text attachments up to 5 MB each. Each ticket supports 10 requester-visible files and 10 staff-only files. Ticket history includes existing replies and notes, uploads and new status changes. Assignment changes and priority history are visible to staff.

**Operations** shows live SLA escalations and workspace reports to Owners and Agents. Owners can edit first-response and resolution targets per priority. The defaults are Low 24h/96h, Normal 8h/48h, High 4h/24h, and Urgent 1h/8h. All targets use elapsed calendar hours. Policy edits affect future tickets and recalculated deadlines. Staff can override an individual resolution deadline. Requester replies and attachments can reopen a ticket while keeping its original timeline and SLA clock.

**Notifications** lists ticket events in the app. Workspace owners get new-ticket notifications, assignees get assignment notifications, and assignees or owners get requester replies and attachments. Requesters get public staff replies, public attachments and status updates. The staff inbox evaluates SLA escalations when opened. Reports show all active backlog and overdue tickets, with timing averages for tickets opened in the last 30 days. First response means the first public support reply from a staff member other than the requester. Resolution uses the latest recorded resolution of a currently resolved ticket.

For Google sign-in, set both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. In the Google OAuth web client, register `http://localhost:3000` as an authorized origin and `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

With the app running, `node --env-file=.env scripts/auth-smoke.mjs` checks signed-out access to the dashboard, login page, and session endpoint.

**Knowledge Base** lets Owners and Agents create plain-text drafts, publish articles for staff or customers, and unpublish live articles. Saving a draft preserves the published version until staff publish again. Requesters can search and read only customer-facing articles published in their own workspace. In a public ticket reply, staff can use **Find articles** and **Add link** to share a published customer-facing article.
