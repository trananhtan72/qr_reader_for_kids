/** The origin printed into labels: the configured deploy origin, else wherever the app is running. */
export function labelOrigin(configured: string | undefined, current: string): string {
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to the current origin
    }
  }
  return current;
}

export function labelUrl(origin: string, id: string): string {
  return `${origin}/item/${id}`;
}

/** True when labels made for this origin won't work outside this network (or ever). */
export function isLocalOrigin(origin: string): boolean {
  let host: string;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:') return true;
    host = url.hostname;
  } catch {
    return true;
  }
  return (
    host === 'localhost' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '[::1]'
  );
}
