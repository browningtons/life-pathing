import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LAST_UPDATED, PrivacyView } from './PrivacyView';

const html = renderToStaticMarkup(createElement(PrivacyView));

describe('PrivacyView', () => {
  it.each(['30 days', 'Stripe', 'local storage', 'Vercel', 'Reset to the sample profile', 'Forget this device', LAST_UPDATED])(
    'mentions %s',
    (needle) => {
      expect(html).toContain(needle);
    },
  );

  it('has every section, links back to the app, and keeps internal notes off the page', () => {
    for (const h of [
      'What stays on your device',
      'What leaves your device',
      'What the server stores',
      'Refunds',
      'What this is not',
    ]) {
      expect(html).toContain(h);
    }
    expect(html).toContain('href="/"');
    expect(html).not.toContain('Paul approves');
    expect(html).toContain('The Reading key');
    expect(LAST_UPDATED).toBe('24 October 2026');
  });
});
