// The upgrade modal's first paint, rendered to markup (no DOM needed): the
// restore form stays collapsed until asked, the pairing line and the excerpt
// show only when the app passes them, and the Buy link sits before the
// conditional features and the restore link.

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { KitConfig } from '../config';
import { KitProvider } from '../context';
import { RESTORE_SOURCE } from '../auth/useAuth';
import UpgradeModal from './UpgradeModal';

const CONFIG: KitConfig = {
  app: { name: 'Test', shortName: 'T', storagePrefix: 't_' },
  stripe: {
    publishableKey: 'pk_test_x',
    buyButtonId: 'buy_btn_REPLACE_ME',
    paymentUrl: 'https://buy.stripe.com/test',
    priceIdHint: '',
    productIdHint: '',
  },
  upgrade: {
    headerTitle: 'Title',
    headerSubtitle: 'Subtitle',
    price: '$9',
    priceCaption: 'One-time purchase',
    features: ['Feature one'],
    conditionalFeatures: { heading: 'With an upload', features: ['Feature two'] },
    trustLine: 'Trust line.',
    pairingNote: 'For {pairing}. Change it first.',
  },
  analytics: { eventPrefix: 't_' },
  admin: { logoTapsToToggle: 5, tapWindowMs: 3000 },
};

type Props = Partial<Parameters<typeof UpgradeModal>[0]>;

function render(props: Props = {}, config: KitConfig = CONFIG): string {
  return renderToStaticMarkup(
    <KitProvider config={config}>
      <UpgradeModal
        onClose={() => {}}
        onRestore={async () => ({ ok: true })}
        source="reading_reading"
        {...props}
      />
    </KitProvider>,
  );
}

describe('UpgradeModal', () => {
  it('opens with the restore form collapsed behind its link, and no message', () => {
    const html = render();
    expect(html).toContain('Already purchased? Restore');
    expect(html).not.toContain('<form');
    expect(html).not.toContain('kit-restore-email');
    expect(html).not.toContain('Enter the email');
  });

  it('opens straight to the form from a gate restore link, still with no message', () => {
    const html = render({ source: RESTORE_SOURCE });
    expect(html).toContain('kit-restore-email');
    expect(html).not.toContain('Enter the email');
  });

  it('names the pairing under the price when the app passes it', () => {
    const html = render({ pairingLabel: 'INFP · Life Path 6' });
    expect(html).toContain('For INFP · Life Path 6. Change it first.');
    expect(html.indexOf('One-time purchase')).toBeLessThan(html.indexOf('For INFP'));
  });

  it('shows no pairing line without the prop, or without the config line', () => {
    expect(render()).not.toContain('upgrade-pairing');
    const bare = { ...CONFIG, upgrade: { ...CONFIG.upgrade, pairingNote: undefined } };
    expect(render({ pairingLabel: 'INFP · Life Path 6' }, bare)).not.toContain('upgrade-pairing');
  });

  it('quotes the excerpt under the features, with its label, before the Buy link', () => {
    const html = render({ excerpt: { label: 'From your In love section', text: 'A sentence.' } });
    expect(html).toContain('“A sentence.”');
    expect(html).toContain('From your In love section');
    expect(html.indexOf('Feature one')).toBeLessThan(html.indexOf('A sentence.'));
    expect(html.indexOf('A sentence.')).toBeLessThan(html.indexOf('Buy now'));
    expect(render()).not.toContain('upgrade-excerpt');
  });

  it('orders price, features, Buy, conditional features, restore, trust', () => {
    const html = render();
    const at = (s: string) => {
      const i = html.indexOf(s);
      expect(i, s).toBeGreaterThan(-1);
      return i;
    };
    const order = ['$9', 'Feature one', 'Buy now', 'With an upload', 'Already purchased? Restore', 'Trust line.'].map(at);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('binds the Buy link to the Reading key', () => {
    const html = render({ readingKey: '6-0-INFP' });
    expect(html).toMatch(/href="https:\/\/buy\.stripe\.com\/test\?client_reference_id=6-0-INFP/);
  });
});
