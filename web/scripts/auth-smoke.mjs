import assert from "node:assert/strict";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

const dashboard = await fetch(new URL("/dashboard", baseURL), { redirect: "manual" });
assert.equal(dashboard.status, 307);
assert.equal(new URL(dashboard.headers.get("location"), baseURL).pathname, "/login");

const workspace = await fetch(new URL("/workspaces/example", baseURL), { redirect: "manual" });
assert.equal(workspace.status, 307);
assert.equal(new URL(workspace.headers.get("location"), baseURL).pathname, "/login");

for (const section of ["operations", "notifications", "knowledge", "knowledge/new", "knowledge/example", "tickets/example/knowledge"]) {
  const response = await fetch(new URL(`/workspaces/example/${section}`, baseURL), { redirect: "manual" });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location"), baseURL).pathname, "/login");
}

for (const suffix of ["", "/new", "/example", "/example/attachments/example"]) {
  const ticket = await fetch(new URL(`/workspaces/example/tickets${suffix}`, baseURL), { redirect: "manual" });
  assert.equal(ticket.status, 307);
  assert.equal(new URL(ticket.headers.get("location"), baseURL).pathname, "/login");
}

const invitePath = `/invite/${"a".repeat(43)}`;
const invite = await fetch(new URL(invitePath, baseURL), { redirect: "manual" });
assert.equal(invite.status, 307);
const signIn = new URL(invite.headers.get("location"), baseURL);
assert.equal(signIn.pathname, "/login");
assert.equal(signIn.searchParams.get("next"), invitePath);

const login = await fetch(new URL("/login", baseURL));
assert.equal(login.status, 200);
assert.match(await login.text(), /Sign in to ResolveDesk/);

const session = await fetch(new URL("/api/auth/get-session", baseURL));
assert.equal(session.status, 200);
assert.equal(await session.json(), null);

console.log("Signed-out dashboard, workspace and invite redirects, login page, and session endpoint passed.");
