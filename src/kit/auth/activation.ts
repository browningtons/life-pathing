// URL activation tokens, parsed once on mount by useAuth.
//
// Pure so it can be tested without a DOM. Only two tokens are honoured:
//
//   session_id=cs_...   → verified unlock via /api/verify-purchase
//   admin               → flips admin mode on (preview-as-user tooling)
//
// There is deliberately no client-side "instant unlock" token. An earlier
// version honoured `#pro=1`, which meant anyone who read the source could
// grant themselves Pro. Entitlement now only comes from a Stripe session
// the server has verified, or from the email restore path.

export interface Activation {
  /** A Stripe Checkout session id to verify, or null. */
  sessionId: string | null;
  /** True when the URL carried the admin token. */
  admin: boolean;
}

const SESSION_PREFIX = 'session_id=';

export function parseActivation(hash: string, search: string): Activation {
  const raw = `${hash}${search}`;
  const tokens = raw.replace(/^[#?]/, '').split(/[#?&]/).filter(Boolean);

  const sessionToken = tokens.find((t) => t.startsWith(SESSION_PREFIX));
  const candidate = sessionToken?.slice(SESSION_PREFIX.length) ?? '';
  const sessionId = candidate.startsWith('cs_') ? candidate : null;

  return { sessionId, admin: tokens.includes('admin') };
}
