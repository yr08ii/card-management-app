/**
 * Home tab's nested stack (design spec §3.1): card overview → card details
 * → reveal. `card/[cardId].tsx` and `card/[cardId]/reveal.tsx` coexist at
 * the same path segment without conflict — Expo Router keys routes by their
 * full route string ("card/[cardId]" vs. "card/[cardId]/reveal"), not by
 * filesystem file-vs-directory shape, and there is no `card/_layout.tsx` or
 * `card/[cardId]/_layout.tsx` turning `card/` into its own nested
 * navigator, so both files register as flat sibling screens of this Stack.
 * (Verified against `getRoutesCore.js`'s route-conflict checks, which only
 * throw when two files resolve to the *same* route string.)
 */

import { Stack } from 'expo-router';

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="card/[cardId]" options={{ headerShown: true, title: 'Card details' }} />
      <Stack.Screen
        name="card/[cardId]/reveal"
        options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false, animation: 'fade' }}
      />
    </Stack>
  );
}
