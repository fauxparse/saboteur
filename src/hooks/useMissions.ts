import { useCallback, useEffect, useState } from 'react';
import { generateSlug } from 'random-word-slugs';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  collection,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Mission, PartialWithId } from '@/types';
import { omit } from 'lodash-es';
import { z } from 'zod';

export const MissionSchema = z.object({
  id: z.string(),
  startsAt: z
    .instanceof(Timestamp)
    .nullable()
    .optional()
    .transform((val) => val?.toDate() || null),
  endsAt: z
    .instanceof(Timestamp)
    .nullable()
    .optional()
    .transform((val) => val?.toDate() || null),
  saboteurId: z.string().nullable().optional(),
});

export const MissionFirebaseSchema = z
  .object({
    startsAt: z.date().nullable().optional(),
    endsAt: z.date().nullable().optional(),
    saboteurId: z.string().nullable().optional(),
  })
  .transform((mission) => {
    const updates = {} as {
      startsAt?: Timestamp | null;
      endsAt?: Timestamp | null;
      saboteurId?: string | null;
    };
    if ('startsAt' in mission) {
      updates.startsAt = mission.startsAt ? Timestamp.fromDate(mission.startsAt) : null;
    }
    if ('endsAt' in mission) {
      updates.endsAt = mission.endsAt ? Timestamp.fromDate(mission.endsAt) : null;
    }
    if ('saboteurId' in mission) {
      updates.saboteurId = mission.saboteurId;
    }

    return updates;
  });

export const parseMission = (doc: DocumentSnapshot | QueryDocumentSnapshot): Mission =>
  MissionSchema.parse({ id: doc.id, ...doc.data() });

export const useMissions = () => {
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'missions'), (snapshot) => {
      setMissions(snapshot.docs.map(parseMission));
    });

    return unsubscribe;
  }, []);

  const createMission = useCallback(async () => {
    const mission: Mission = {
      id: generateSlug(3, { format: 'kebab' }),
      startsAt: null,
      endsAt: null,
      saboteurId: null,
    };

    await setDoc(doc(db, 'missions', mission.id), omit(mission, ['id', 'agents']));

    return mission;
  }, []);

  const updateMission = useCallback(async (mission: PartialWithId<Mission>) => {
    await setDoc(doc(db, 'missions', mission.id), MissionFirebaseSchema.parse(mission));
  }, []);

  return {
    missions,
    createMission,
    updateMission,
  };
};
