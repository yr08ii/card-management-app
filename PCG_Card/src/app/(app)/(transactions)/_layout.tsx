/** Transactions tab's nested stack (design spec §3.1): list → detail. */

import { Stack } from 'expo-router';

export default function TransactionsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[txnId]" options={{ headerShown: true, title: 'Transaction' }} />
    </Stack>
  );
}
