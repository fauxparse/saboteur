import { app } from '@/firebase';
import { createFileRoute } from '@tanstack/react-router';
import { getAuth } from 'firebase/auth';

export const Route = createFileRoute('/desk/_authenticated')({
  loader: async () => {
    const auth = getAuth(app);

    const user = auth.currentUser;

    return { user };
  },
});
