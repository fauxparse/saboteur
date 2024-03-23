import { Desk } from '@/desk/Desk';
import { db } from '@/firebase';
import { Mission } from '@/types';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { doc, getDoc } from 'firebase/firestore';

const Component = () => {
  const { mission } = Route.useLoaderData();
  return <Desk mission={mission} />;
};

export const Route = createFileRoute('/desk/_authenticated/$missionId')({
  component: Component,
  loader: async ({ params }) => {
    const mission = await getDoc(doc(db, 'missions', params.missionId));

    if (!mission.exists()) {
      throw notFound();
    }

    return {
      mission: {
        id: mission.id,
        ...mission.data(),
      } as Mission,
    };
  },
});
