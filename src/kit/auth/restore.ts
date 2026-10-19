// Email restore: asks /api/verify-purchase (POST) whether this email paid
// for this product, and returns what the modal should show. Pure apart from
// the fetch it is handed, so it is unit-tested without a browser.

export type RestoreResult =
  | { ok: true; sessionId?: string }
  | { ok: false; message: string };

export const RESTORE_MESSAGES = {
  invalid: 'Enter the email address you used at checkout.',
  notFound:
    "We couldn't find a paid purchase for that email. Double-check the address on your Stripe receipt, or reply to the receipt email for help.",
  failed: 'Something went wrong verifying your purchase. Try again in a moment.',
} as const;

export function isPlausibleEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(email.trim());
}

export async function restorePurchase(
  email: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RestoreResult> {
  const trimmed = email.trim();
  if (!isPlausibleEmail(trimmed)) return { ok: false, message: RESTORE_MESSAGES.invalid };
  try {
    const resp = await fetchImpl('/api/verify-purchase', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: trimmed }),
    });
    if (!resp.ok) return { ok: false, message: RESTORE_MESSAGES.failed };
    const data = (await resp.json()) as { verified?: boolean; sessionId?: unknown };
    if (!data?.verified) return { ok: false, message: RESTORE_MESSAGES.notFound };
    const sessionId =
      typeof data.sessionId === 'string' && data.sessionId.startsWith('cs_') ? data.sessionId : undefined;
    return sessionId ? { ok: true, sessionId } : { ok: true };
  } catch {
    return { ok: false, message: RESTORE_MESSAGES.failed };
  }
}
