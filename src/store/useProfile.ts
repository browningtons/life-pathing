import { useContext } from 'react';
import { ProfileContext, type ProfileStore } from './context-internal';

/** Read the shared profile store. Must be used under <ProfileProvider>. */
export function useProfile(): ProfileStore {
  const store = useContext(ProfileContext);
  if (!store) {
    throw new Error('useProfile() must be used inside <ProfileProvider>.');
  }
  return store;
}
