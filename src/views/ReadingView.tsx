import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Feather,
  GitMerge,
  Hash,
  Heart,
  KeyRound,
  Printer,
  RotateCcw,
  Shuffle,
  User,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../components/Card';
import { LettersAsk } from '../components/LettersAsk';
import { ProGate } from '../components/ProGate';
import { SectionHeading } from '../components/SectionHeading';
import { temperamentForMbti } from '../data/personality';
import { READING_GATE, READING_SECTIONS } from '../data/tiers';
import { ASIDE, BODY, FOCUS_RING, MICRO_LABEL } from '../design/tokens';
import { load } from '../kit';
import { KIT_CONFIG } from '../../kit.config';
import { trackReadingTeaserShown } from '../lib/funnel';
import { isReading, readCachedReading, writeCachedReading, type Reading } from '../lib/readingCache';
import { useGate } from '../store/useGate';
import { useNav } from '../store/useNav';
import { useProfile } from '../store/useProfile';
import { BIRTHDATE_INPUT_ID } from './LifePathView';
import { readingKey } from '../lib/readingKey';
import { withArticle } from '../lib/article';
import { loadTeaserFile } from '../lib/teaserFile';

/** "a 7", or "a 16/7" when the compound carries a label, with the letters. */
function describeKey(key: string): string | null {
  const m = /^(\d+)-(\d+)-([A-Za-z]{4})$/.exec(key);
  if (!m) return null;
  const [, number, compound, letters] = m;
  return `${compound === '0' ? number : `${compound}/${number}`} · ${letters.toUpperCase()}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** An ISO date as "14 March 1991", read from the parts (no time zone shift). */
function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((p) => parseInt(p, 10));
  if (!y || !m || !d || m > 12) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const ADMIN_TOKEN_KEY = `${KIT_CONFIG.app.storagePrefix}reading_admin`;

function readAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeAdminToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* private mode: the prompt comes back next time */
  }
}

const PRIMARY = `inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 ${FOCUS_RING}`;
const SECONDARY = `inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 ${FOCUS_RING}`;

const SECTION_ICONS: Record<(typeof READING_SECTIONS)[number]['field'], LucideIcon> = {
  number: Hash,
  type: User,
  love: Heart,
  agree: GitMerge,
  pull: Shuffle,
  closing: Feather,
};

// ── The view ───────────────────────────────────────────────────────────

/**
 * The Reading tab (Phase 2). One document, written for this number and
 * these four letters. The opening is free; the six sections after it are
 * behind the Reading gate. Nothing about the reader leaves the browser
 * except the key, which is the same for everyone with the same pills.
 */
export const ReadingView = () => {
  const { ownBirthDate, lettersKnown } = useProfile();

  if (!ownBirthDate) return <StartWithBirthdate />;
  if (!lettersKnown) return <LettersAsk />;
  return <ReadingDocument />;
};

const StartWithBirthdate = () => {
  const { go } = useNav();
  const { restore, isPro } = useGate();
  return (
    <Card variant="tinted">
      <SectionHeading icon={Calendar} tone="indigo" className="!mb-3">
        Start with your birthdate
      </SectionHeading>
      <p className={`${BODY} max-w-2xl`}>
        The Reading is written for one Life Path and one set of four letters. The number comes from a birthdate, so
        that comes first. It stays in this browser.
      </p>
      <button type="button" className={`${PRIMARY} mt-4`} onClick={() => go('lifepath', BIRTHDATE_INPUT_ID)}>
        Enter a birthdate on the Life Path tab <ArrowRight size={14} aria-hidden="true" />
      </button>
      {!isPro && (
      <div className="mt-3">
        <button
          type="button"
          onClick={restore}
          className={`rounded text-[11px] text-slate-400 underline underline-offset-2 hover:text-slate-600 ${FOCUS_RING}`}
        >
          Already purchased? Restore
        </button>
      </div>
      )}
    </Card>
  );
};

type TeaserState =
  | { key: string; status: 'ok'; text: string }
  | { key: string; status: 'missing' }
  | { key: string; status: 'error' };

const ReadingDocument = () => {
  const store = useProfile();
  const { isPro } = useGate();
  const key = readingKey(store.lifePath.number, store.lifePath.compound, store.typeCode) ?? '';
  const [attempt, setAttempt] = useState(0);
  const [teaser, setTeaser] = useState<TeaserState | null>(null);
  // A Pro reader with the whole thing cached needs nothing from the network.
  const cached = isPro ? readCachedReading(key) : null;
  const hasCache = cached !== null;

  useEffect(() => {
    if (hasCache) return;
    // Shared with the shell, which quotes the file's excerpt in the upgrade modal.
    let live = true;
    void loadTeaserFile(key).then((res) => {
      if (!live) return;
      setTeaser(res.status === 'ok' ? { key, status: 'ok', text: res.teaser } : { key, status: res.status });
    });
    return () => {
      live = false;
    };
  }, [key, attempt, hasCache]);

  const current = teaser?.key === key ? teaser : null;
  const opening = cached?.teaser ?? (current?.status === 'ok' ? current.text : null);

  useEffect(() => {
    if (opening) trackReadingTeaserShown(key);
  }, [opening, key]);

  return (
    <article id="reading-article" className="space-y-4" aria-labelledby="reading-title">
      <ReadingHeader />

      {opening ? (
        <>
          <Card className="reading-section">
            <SectionHeading icon={BookOpen} tone="indigo">
              The opening
            </SectionHeading>
            <Prose text={opening} />
          </Card>
          <ProGate gate={READING_GATE} surface="reading" buttonLabel="Read the whole thing">
            {cached ? <FullText reading={cached} /> : <PaidReading readingKey={key} />}
          </ProGate>
        </>
      ) : !current ? (
        <Card data-print-hide="">
          <p className={ASIDE} role="status">
            Finding the opening…
          </p>
        </Card>
      ) : current.status === 'missing' ? (
        <NotWritten />
      ) : (
        <TryAgain onRetry={() => setAttempt((n) => n + 1)}>The opening did not load.</TryAgain>
      )}
    </article>
  );
};

const ReadingHeader = () => {
  const { typeCode, lifePath, profile } = useProfile();
  const pills = [typeCode, `Life Path ${lifePath.number}`, temperamentForMbti(typeCode)];
  return (
    <Card variant="hero">
      <div className={`${MICRO_LABEL} !text-indigo-300 mb-3 flex flex-wrap gap-2`}>
        {pills.map((p) => (
          <span key={p} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-white">
            {p}
          </span>
        ))}
      </div>
      <h1 id="reading-title" className="text-3xl font-bold mb-1">
        The Reading
      </h1>
      <p className="text-sm text-indigo-200" data-reading-written-for="">
        Written for {withArticle(lifePath.number)} born {longDate(profile.birthDate)}
      </p>
    </Card>
  );
};

const Prose = ({ text }: { text: string }) => (
  <div className="space-y-3">
    {text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p, i) => (
        <p key={i} className={`${BODY} max-w-2xl`}>
          {p}
        </p>
      ))}
  </div>
);

const NotWritten = () => (
  <Card variant="muted">
    <SectionHeading icon={AlertCircle} className="!mb-3">
      No reading written for this pairing yet
    </SectionHeading>
    <p className={`${BODY} max-w-2xl`}>
      This number and these four letters do not have a Reading on file, so there is nothing here to sell. The Life Path
      and Profile tabs still read the two together.
    </p>
  </Card>
);

const TryAgain = ({ children, onRetry }: { children: ReactNode; onRetry: () => void }) => (
  <Card variant="warm" data-print-hide="">
    <p className={BODY} role="alert">
      {children} The connection may have dropped, or the server did not answer.
    </p>
    <button type="button" className={`${SECONDARY} mt-3`} onClick={onRetry}>
      <RotateCcw size={14} aria-hidden="true" /> Try again
    </button>
  </Card>
);

// ── The paid half ──────────────────────────────────────────────────────

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; reading: Reading }
  | { status: 'other'; boundKey: string | null }
  | { status: 'unverified' }
  | { status: 'refunded' }
  | { status: 'missing' }
  | { status: 'bad-token' }
  | { status: 'error' };

/**
 * Fetches the full text for a Pro reader. Admins viewing as admin use the
 * admin token (asked for once per session); everyone else uses the
 * Checkout session id this browser kept after the purchase.
 */
const PaidReading = ({ readingKey }: { readingKey: string }) => {
  const { adminView } = useGate();
  const [token, setToken] = useState<string | null>(() => (adminView ? readAdminToken() : null));
  const [tokenRejected, setTokenRejected] = useState(false);

  if (adminView) {
    if (!token) {
      return (
        <AdminTokenForm
          rejected={tokenRejected}
          onSubmit={(t) => {
            writeAdminToken(t);
            setTokenRejected(false);
            setToken(t);
          }}
        />
      );
    }
    return (
      <FetchReading
        readingKey={readingKey}
        header="x-reading-admin"
        credential={token}
        onBadToken={() => {
          writeAdminToken(null);
          setTokenRejected(true);
          setToken(null);
        }}
      />
    );
  }

  const sessionId = load<string | null>('stripe_session_id', null);
  if (typeof sessionId !== 'string' || !sessionId) return <RestoreCard />;
  return <FetchReading readingKey={readingKey} header="x-reading-session" credential={sessionId} />;
};

const FetchReading = ({
  readingKey,
  header,
  credential,
  onBadToken,
}: {
  readingKey: string;
  header: 'x-reading-session' | 'x-reading-admin';
  credential: string;
  /** Admin only: the token was refused, so ask for it again. */
  onBadToken?: () => void;
}) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ tag: string; state: FetchState } | null>(null);
  const tag = `${readingKey}|${header}|${credential}|${attempt}`;
  const isAdmin = header === 'x-reading-admin';

  useEffect(() => {
    const ctrl = new AbortController();
    const done = (state: FetchState) => setResult({ tag, state });
    fetch(`/api/reading?key=${encodeURIComponent(readingKey)}`, {
      headers: { [header]: credential },
      signal: ctrl.signal,
    })
      .then(async (r) => {
        const body = (await r.json().catch(() => null)) as {
          reading?: unknown;
          error?: string;
          boundKey?: string;
        } | null;
        if (r.ok) {
          const reading = body?.reading;
          if (isReading(reading) && reading.key === readingKey) {
            writeCachedReading(reading);
            return done({ status: 'ok', reading });
          }
          return done({ status: 'error' });
        }
        if (r.status === 404) return done({ status: 'missing' });
        if (r.status === 402 || r.status === 401 || r.status === 403) {
          if (isAdmin) return done({ status: 'bad-token' });
          if (body?.error === 'other reading') return done({ status: 'other', boundKey: body.boundKey ?? null });
          if (body?.error === 'refunded') return done({ status: 'refunded' });
          return done({ status: 'unverified' });
        }
        done({ status: 'error' });
      })
      .catch(() => {
        if (!ctrl.signal.aborted) done({ status: 'error' });
      });
    return () => ctrl.abort();
  }, [tag, readingKey, header, credential, isAdmin]);

  const badToken = result?.tag === tag && result.state.status === 'bad-token';
  useEffect(() => {
    if (badToken) onBadToken?.();
  }, [badToken, onBadToken]);

  const state: FetchState = result?.tag === tag ? result.state : { status: 'loading' };

  switch (state.status) {
    case 'loading':
      return (
        <Card data-print-hide="">
          <p className={ASIDE} role="status">
            Opening the Reading…
          </p>
        </Card>
      );
    case 'ok':
      return <FullText reading={state.reading} />;
    case 'other':
      return <OtherReading boundKey={state.boundKey} />;
    case 'refunded':
      return (
        <Card variant="muted" data-print-hide="">
          <SectionHeading icon={AlertCircle} className="!mb-3">
            This purchase was refunded
          </SectionHeading>
          <p className={`${BODY} max-w-2xl`}>
            The payment behind this browser&rsquo;s unlock was refunded, so the full Reading is closed. The opening
            above stays free.
          </p>
        </Card>
      );
    case 'missing':
      return <NotWritten />;
    case 'unverified':
      return <RestoreCard unverified />;
    case 'bad-token':
      return null;
    case 'error':
      return <TryAgain onRetry={() => setAttempt((n) => n + 1)}>The rest of the Reading did not load.</TryAgain>;
  }
};

const RestoreCard = ({ unverified = false }: { unverified?: boolean }) => {
  const { restore } = useGate();
  return (
    <Card variant="tinted" data-print-hide="">
      <SectionHeading icon={KeyRound} tone="indigo" className="!mb-3">
        Restore purchase
      </SectionHeading>
      <p className={`${BODY} max-w-2xl`}>
        {unverified
          ? 'This browser is marked as paid, but the payment could not be confirmed for this Reading.'
          : 'This browser is marked as paid, but it does not hold the receipt the Reading is opened with.'}{' '}
        Restore with the email used at checkout and the full text opens here.
      </p>
      <button type="button" className={`${PRIMARY} mt-4`} onClick={restore}>
        <KeyRound size={14} aria-hidden="true" /> Restore purchase
      </button>
    </Card>
  );
};

const OtherReading = ({ boundKey }: { boundKey: string | null }) => {
  const label = boundKey ? describeKey(boundKey) : null;
  return (
    <Card variant="muted" data-print-hide="">
      <SectionHeading icon={AlertCircle} className="!mb-3">
        This purchase is for another pairing
      </SectionHeading>
      <p className={`${BODY} max-w-2xl`}>
        {label ? (
          <>
            The Reading bought in this browser is the one for <span className="font-bold">{label}</span>.
          </>
        ) : (
          'The Reading bought in this browser is for a different number and letters.'
        )}{' '}
        The birthdate or the letters on this device have changed since. Each pairing is its own Reading; switch back on
        the Life Path and Your Data tabs to read the one that was bought.
      </p>
    </Card>
  );
};

const AdminTokenForm = ({ rejected, onSubmit }: { rejected: boolean; onSubmit: (token: string) => void }) => {
  const [value, setValue] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (t) onSubmit(t);
  };
  return (
    <Card variant="muted" data-print-hide="">
      <form onSubmit={submit}>
        <SectionHeading icon={KeyRound} className="!mb-3">
          Admin token
        </SectionHeading>
        <label htmlFor="reading-admin-token" className={`${BODY} block mb-3`}>
          Admin mode opens any Reading with the admin token. It is kept for this browser session only.
        </label>
        {rejected && (
          <p className="mb-3 text-xs text-rose-600" role="alert">
            That token did not open the Reading. Check it and try again.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="reading-admin-token"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 ${FOCUS_RING}`}
          />
          <button type="submit" className={PRIMARY} disabled={!value.trim()}>
            Open the Reading
          </button>
        </div>
      </form>
    </Card>
  );
};

/** The six sections, in contract order, then the print control. */
const FullText = ({ reading }: { reading: Reading }) => {
  const { typeCode, lifePath } = useProfile();
  const print = () => {
    const before = document.title;
    document.title = `The Reading · ${lifePath.number} · ${typeCode}`;
    const restore = () => {
      document.title = before;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  return (
    <div className="space-y-4">
      {READING_SECTIONS.map(({ field, title }) => (
        <Card key={field} className="reading-section">
          <SectionHeading icon={SECTION_ICONS[field]} tone="indigo">
            {title}
          </SectionHeading>
          <Prose text={reading[field]} />
        </Card>
      ))}
      <div className="flex flex-wrap items-center gap-3" data-print-hide="">
        <button type="button" className={PRIMARY} onClick={print}>
          <Printer size={14} aria-hidden="true" /> Print / Save as PDF
        </button>
        <span className={ASIDE}>Saved to this browser. Opens without a connection next time.</span>
      </div>
    </div>
  );
};
