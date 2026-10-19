/** The URL an invitee opens to accept a page invite. */
export function getPageInviteUrl(key: string, origin = location.origin) {
  return new URL(`/invites/accept/${key}`, origin).href;
}

/** The URL an invitee opens to join a workspace. */
export function getWorkspaceInviteUrl(key: string, origin = location.origin) {
  return new URL(`/invites/join-workspace/${key}`, origin).href;
}
