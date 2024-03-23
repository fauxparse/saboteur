import { MissionProvider } from '@/contexts/MissionProvider';
import { db } from '@/firebase';
import { parseMission } from '@/hooks/useMissions';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { getDoc, doc } from 'firebase/firestore';

const Component = () => {
  const { mission } = Route.useLoaderData();

  return (
    <MissionProvider mission={mission}>
      <Outlet />
    </MissionProvider>
  );
};

export const Route = createFileRoute('/agent/_missions/$missionId')({
  component: Component,
  loader: async ({ params: { missionId } }) => {
    const missionSnapshot = await getDoc(doc(db, 'missions', missionId));

    return {
      mission: parseMission(missionSnapshot),
    };
  },
});
