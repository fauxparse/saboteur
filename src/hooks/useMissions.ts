import { useCallback, useEffect, useState } from 'react';
import { generateSlug } from 'random-word-slugs';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  collection,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Mission } from '@/types';
import { omit } from 'lodash-es';
import { z } from 'zod';

export const MissionSchema = z.object({
  id: z.string(),
});

export const parseMission = (doc: DocumentSnapshot | QueryDocumentSnapshot): Mission =>
  MissionSchema.parse({ id: doc.id, ...doc.data() });

export const useMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'missions'), (snapshot) => {
      setMissions(snapshot.docs.map(parseMission));
    });

    return unsub;
  }, []);

  const createMission = useCallback(async () => {
    const mission: Mission = {
      id: generateSlug(3, { format: 'kebab' }),
    };

    await setDoc(doc(db, 'missions', mission.id), omit(mission, ['id', 'agents']));
  }, []);

  return {
    missions,
    createMission,
  };
};
