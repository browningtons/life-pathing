import { useContext } from 'react';
import { GateContext, type Gate } from './gate-internal';

/** Read entitlement state. Must be used under the app shell's GateContext. */
export function useGate(): Gate {
  const gate = useContext(GateContext);
  if (!gate) {
    throw new Error('useGate() must be used inside the app shell.');
  }
  return gate;
}
