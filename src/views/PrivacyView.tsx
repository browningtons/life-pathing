// The privacy and refund page, served at /privacy. Plain, short, true of the
// app as it is and as the Reading (Phase 2) makes it. No personality data
// lives here, so the guard in noHardcodedPersonality.test.ts passes as-is.
//
// DRAFT WORDING: legal text is Paul's alone to approve. Change it only with
// his sign-off, and bump LAST_UPDATED when you do.

import { FOCUS_RING, FONT, PAGE_BG, PAGE_TEXT } from '../design/tokens';

export const LAST_UPDATED = '23 October 2026';

export const PRIVACY_PATH = '/privacy';

const SECTION = 'bg-white border border-slate-100 rounded-2xl shadow-sm p-6 mb-4';
const H2 = 'text-lg font-extrabold text-slate-900 tracking-tight mb-2';
const P = 'text-sm leading-relaxed text-slate-700 mb-2 last:mb-0';
const LI = 'text-sm leading-relaxed text-slate-700';

export function PrivacyView() {
  return (
    <div className={`min-h-screen ${PAGE_BG} ${FONT} ${PAGE_TEXT} pb-12`}>
      <header className="bg-white border-b border-slate-200 mb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Privacy &amp; refunds</h1>
          <a href="/" className={`rounded-md text-sm font-bold text-indigo-700 hover:text-indigo-900 ${FOCUS_RING}`}>
            Back to the app
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        <p className={`${P} mb-4`}>
          Short version: your numbers stay in your browser, the readings are written in advance, and a refund is one
          reply away.
        </p>

        <section aria-labelledby="stays" className={SECTION}>
          <h2 id="stays" className={H2}>
            What stays on your device
          </h2>
          <p className={P}>
            Your birthdate, your four letters, your facet scores, the purchase flag and the Reading once it has been
            fetched all live in this browser&rsquo;s local storage. Nothing else holds them.
          </p>
          <p className={P}>
            &ldquo;Reset to the sample profile&rdquo; on the Your Data tab clears the numbers. It does not clear a
            purchase. Clearing this site&rsquo;s data in your browser clears everything, the purchase flag included;
            Restore brings the purchase back.
          </p>
        </section>

        <section aria-labelledby="leaves" className={SECTION}>
          <h2 id="leaves" className={H2}>
            What leaves your device
          </h2>
          <p className={P}>Nothing about you goes to this app&rsquo;s server, with these exceptions:</p>
          <ul className="list-disc pl-5 space-y-1.5 mb-2">
            <li className={LI}>
              The Reading key: your Life Path number and your four letters. It rides on the
              Stripe checkout link, so Stripe can bind the purchase to them, and on the request that fetches your
              Reading. Your birthdate and your quiz answers are not part of it.
            </li>
            <li className={LI}>
              The Stripe Checkout session id, when a purchase is verified or a Reading is fetched. It is a receipt
              number, not a name.
            </li>
            <li className={LI}>
              An email address you type into Restore. It goes to Stripe&rsquo;s records to find your purchase, and for
              nothing else.
            </li>
            <li className={LI}>Stripe handles the payment and keeps the receipt. This app never sees your card.</li>
            <li className={LI}>
              Vercel Web Analytics counts page views and a few funnel events without identifying you: a number was
              shown, a quiz was opened, letters were entered, a tab was opened, a gate was seen, an upgrade offer was
              seen, a purchase was verified, a restore was tried. The events carry no birthdate and no letters. Any
              UTM tags on the link you arrived on ride along, so we can tell which post brought you.
            </li>
          </ul>
        </section>

        <section aria-labelledby="stores" className={SECTION}>
          <h2 id="stores" className={H2}>
            What the server stores
          </h2>
          <p className={P}>
            Nothing. The Readings are written in advance and served by key. No birthdates, emails or session ids are
            kept.
          </p>
        </section>

        <section aria-labelledby="refunds" className={SECTION}>
          <h2 id="refunds" className={H2}>
            Refunds
          </h2>
          <p className={P}>
            30 days, no questions. Reply to your Stripe receipt email and say so. The purchase is one-time: no
            subscription, no account. A refunded purchase stops unlocking the Reading.
          </p>
        </section>

        <section aria-labelledby="not" className={SECTION}>
          <h2 id="not" className={H2}>
            What this is not
          </h2>
          <p className={P}>A reader&rsquo;s tool, not psychological or life advice.</p>
        </section>

        <p className="text-xs text-slate-500">Last updated {LAST_UPDATED}.</p>
      </main>
    </div>
  );
}
