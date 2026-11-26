const defaultDestination = "/dashboard";
const invitationPath = /^\/invite\/[A-Za-z0-9_-]{43}$/;

export function isInvitationToken(token: string) {
  return invitationPath.test(`/invite/${token}`);
}

export function getAuthDestination(next: string | string[] | undefined) {
  return typeof next === "string" && invitationPath.test(next) ? next : defaultDestination;
}

export function authHref(page: "/login" | "/signup", destination: string) {
  return destination === defaultDestination
    ? page
    : `${page}?${new URLSearchParams({ next: destination })}`;
}
