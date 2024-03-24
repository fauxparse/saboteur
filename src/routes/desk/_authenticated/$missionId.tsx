import { MissionProvider } from '@/contexts/MissionProvider';
import { App } from '@/desk/Desk/App';
import { db } from '@/firebase';
import { parseMission } from '@/hooks/useMissions';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { doc, getDoc } from 'firebase/firestore';

const Component = () => {
  const { mission } = Route.useLoaderData();
  return (
    <MissionProvider mission={mission}>
      <App />
    </MissionProvider>
  );
};

export const Route = createFileRoute('/desk/_authenticated/$missionId')({
  component: Component,
  loader: async ({ params }) => {
    const mission = await getDoc(doc(db, 'missions', params.missionId));

    if (!mission.exists()) {
      throw notFound();
    }

    return {
      mission: parseMission(mission),
    };
  },
});
