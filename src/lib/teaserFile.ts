// The free teaser file for a Reading key, public/readings/<key>.json. Read by
// the Reading tab (the opening) and by the shell (the upgrade modal's
// excerpt), so it is fetched once per key and shared. A miss or a good file
// is remembered; a network error is not, so a retry asks again.

export type TeaserLoad =
  | { status: 'ok'; teaser: string; excerpt: string | null }
  | { status: 'missing' }
  | { status: 'error' };

const cache = new Map<string, Promise<TeaserLoad>>();

async function fetchTeaserFile(key: string, fetchImpl: typeof fetch): Promise<TeaserLoad> {
  try {
    const r = await fetchImpl(`/readings/${encodeURIComponent(key)}.json`);
    if (r.status === 404) return { status: 'missing' };
    if (!r.ok) return { status: 'error' };
    const body = (await r.json().catch(() => null)) as { teaser?: unknown; excerpt?: unknown } | null;
    const teaser = body?.teaser;
    // A static host answering a miss with a page is a miss, not an error.
    if (typeof teaser !== 'string' || !teaser.trim()) return { status: 'missing' };
    const excerpt = typeof body?.excerpt === 'string' && body.excerpt.trim() ? body.excerpt.trim() : null;
    return { status: 'ok', teaser, excerpt };
  } catch {
    return { status: 'error' };
  }
}

/** The teaser file for `key`, fetched at most once per page load unless it errored. */
export function loadTeaserFile(key: string, fetchImpl: typeof fetch = fetch): Promise<TeaserLoad> {
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetchTeaserFile(key, fetchImpl).then((res) => {
    if (res.status === 'error') cache.delete(key);
    return res;
  });
  cache.set(key, p);
  return p;
}

/** Tests only. */
export function clearTeaserCache(): void {
  cache.clear();
}
