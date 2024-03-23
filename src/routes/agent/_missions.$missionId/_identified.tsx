import { AgentSelector } from '@/agent/AgentSelector';
import { app } from '@/firebase';
import { createFileRoute } from '@tanstack/react-router';
import { getAuth, signInAnonymously } from 'firebase/auth';

export const Route = createFileRoute('/agent/_missions/$missionId/_identified')({
  component: AgentSelector,
  loader: async () => {
    const auth = getAuth(app);
    await signInAnonymously(auth);
  },
});
