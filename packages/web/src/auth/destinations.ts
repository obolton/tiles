export function validateDestination(destination: string) {
  if (destination.match(/^invites\/(accept|join-workspace)\/[A-Za-z0-9_-]+$/)) {
    return true;
  }
  return false;
}
