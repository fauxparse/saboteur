import { createFileRoute } from '@tanstack/react-router';
import { app } from '@/firebase';
import { getAuth, signInAnonymously } from 'firebase/auth';

export const Route = createFileRoute('/agent/_missions')({
  loader: async () => {
    const auth = getAuth(app);
    await signInAnonymously(auth);

    return {
      user: auth.currentUser,
    };
  },
});
