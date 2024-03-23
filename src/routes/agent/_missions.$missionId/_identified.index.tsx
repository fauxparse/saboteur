import { App } from '@/agent/App';
import { db } from '@/firebase';
import { parseMission } from '@/hooks/useMissions';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { doc, getDoc } from 'firebase/firestore';

export const Route = createFileRoute('/agent/_missions/$missionId/_identified/')({
  component: App,
  loader: async ({ params: { missionId } }) => {
    const mission = await getDoc(doc(db, 'missions', missionId));

    if (!mission) throw notFound();

    return { mission: parseMission(mission) };
  },
});
