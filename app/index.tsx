// app/index.tsx — entry route. Sends the user straight to the login screen.
// Uses <Redirect> (not router.replace in an effect) so navigation only happens
// once the root layout has mounted.
// FRONTEND ONLY: no token check (no backend wiring yet).
import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/(auth)/login" />;
}
