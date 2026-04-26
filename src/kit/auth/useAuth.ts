import { useState, useEffect, useRef, useCallback } from 'react';
import { load, save } from '../persistence';
import { useKitConfig } from '../use-kit-config';
import { trackProPurchase, trackRestoreAttempt } from '../analytics';

const JUST_PURCHASED_KEY = 'just_purchased';

/**
 * Entitlement + admin state for the consuming app.
 *
 * - `isPro` is the boolean to gate UI on. It's `true` when the user has
 *   actually purchased OR when an admin is currently viewing as admin.
 * - `requirePro(action, source)` runs the action if Pro, else opens the
 *   upgrade modal with attribution. Use this everywhere — never check
 *   `isPro` inline before calling a premium action.
 *
 * URL activation paths (handled once on mount):
 *   #pro=1                   → instant unlock (used by Stripe Payment Link)
 *   #session_id=cs_...       → verified unlock via /api/verify-purchase
 *   #admin                   → flips admin on
 *
 * Hidden admin: tap the logo `logoTapsToToggle` times within `tapWindowMs`.
 */
export function useAuth() {
  const config = useKitConfig();
  const sessionStorageKey = `${config.app.storagePrefix}${JUST_PURCHASED_KEY}`;

  const [isAdmin, setIsAdmin] = useState(() => load('admin', false));
  const [viewAs, setViewAs] = useState<'admin' | 'user'>('admin');
  const [isProReal, setIsProReal] = useState(() => load('pro', false));
  const [upgradeSource, setUpgradeSource] = useState<string | null>(null);

  const openUpgrade = useCallback((source: string) => setUpgradeSource(source), []);
  const closeUpgrade = useCallback(() => setUpgradeSource(null), []);

  // Survives a refresh, clears on tab close. Used to show a celebration
  // banner once after a successful Stripe redirect.
  const [justPurchased, setJustPurchased] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(sessionStorageKey) === '1';
  });

  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const markJustPurchased = useCallback(() => {
    setJustPurchased(true);
    try {
      window.sessionStorage.setItem(sessionStorageKey, '1');
    } catch {
      /* private mode */
    }
  }, [sessionStorageKey]);

  const dismissJustPurchased = useCallback(() => {
    setJustPurchased(false);
    try {
      window.sessionStorage.removeItem(sessionStorageKey);
    } catch {
      /* private mode */
    }
  }, [sessionStorageKey]);

  // Effective Pro: an admin viewing-as-admin is always Pro. An admin
  // viewing-as-user falls back to the real flag, so admins can preview the
  // free experience by toggling.
  const isPro = isAdmin && viewAs === 'admin' ? true : isProReal;

  // One-time URL activation on mount.
  useEffect(() => {
    const raw = `${window.location.hash}${window.location.search}`;
    const tokens = raw.replace(/^[#?]/, '').split(/[#?&]/).filter(Boolean);
    const hasProFlag = tokens.includes('pro=1');
    const sessionToken = tokens.find((t) => t.startsWith('session_id='));
    const sessionId = sessionToken?.slice('session_id='.length);

    if (hasProFlag) {
      setIsProReal(true);
      save('pro', true);
      markJustPurchased();
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (sessionId && sessionId.startsWith('cs_')) {
      fetch(`/api/verify-purchase?session_id=${encodeURIComponent(sessionId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { verified?: boolean } | null) => {
          if (data?.verified) {
            setIsProReal(true);
            save('pro', true);
            save('stripe_session_id', sessionId);
            markJustPurchased();
            trackProPurchase();
          }
        })
        .catch(() => {
          /* network — swallow; restore flow covers the gap */
        });
    }
    if (tokens.includes('admin')) {
      setIsAdmin(true);
      save('admin', true);
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    save('pro', isProReal);
  }, [isProReal]);
  useEffect(() => {
    save('admin', isAdmin);
  }, [isAdmin]);

  // Secret logo tap → toggle admin.
  const handleLogoTap = useCallback(() => {
    const { logoTapsToToggle, tapWindowMs } = config.admin;
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (logoTapCount.current >= logoTapsToToggle) {
      logoTapCount.current = 0;
      const next = !isAdmin;
      setIsAdmin(next);
      save('admin', next);
    } else {
      logoTapTimer.current = setTimeout(() => {
        logoTapCount.current = 0;
      }, tapWindowMs);
    }
  }, [isAdmin, config.admin]);

  const requirePro = useCallback(
    (action: () => void, source = 'pro_gate') => {
      if (isPro) {
        action();
      } else {
        setUpgradeSource(source);
      }
    },
    [isPro],
  );

  const handleRestore = useCallback(async () => {
    const email = prompt('Enter the email address you used at checkout:');
    if (!email || !email.trim().includes('@')) return;
    try {
      const resp = await fetch('/api/verify-purchase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await resp.json()) as { verified?: boolean };
      if (data.verified) {
        setIsProReal(true);
        save('pro', true);
        setUpgradeSource(null);
        trackRestoreAttempt(true);
        alert('Pro unlocked. Welcome back.');
      } else {
        trackRestoreAttempt(false);
        alert(
          "We couldn't find a paid purchase for that email. Double-check the address on your Stripe receipt, or reply to the receipt email for help.",
        );
      }
    } catch {
      trackRestoreAttempt(false);
      alert('Something went wrong verifying your purchase. Try again in a moment.');
    }
  }, []);

  return {
    isAdmin,
    setIsAdmin,
    viewAs,
    setViewAs,
    isPro,
    isProReal,
    setIsProReal,
    upgradeSource,
    openUpgrade,
    closeUpgrade,
    justPurchased,
    dismissJustPurchased,
    handleLogoTap,
    requirePro,
    handleRestore,
  };
}
