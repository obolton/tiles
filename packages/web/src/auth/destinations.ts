export function validateDestination(destination: string) {
  if (destination.match(/^invites\/accept\/[A-Za-z0-9_-]+$/)) {
    return true;
  }
  return false;
}
