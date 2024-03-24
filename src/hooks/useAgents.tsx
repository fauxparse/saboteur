import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Agent, COLORS, Mission } from '@/types';
import { z } from 'zod';
import { sortBy } from 'lodash-es';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string().nullable().optional(),
  color: z.enum(COLORS).optional(),
});

export const parseAgent = (doc: DocumentSnapshot | QueryDocumentSnapshot): Agent =>
  AgentSchema.parse({ id: doc.id, ...doc.data() });

export const AgentFirebaseSchema = z.object({
  name: z.string().optional(),
  color: z.enum(COLORS).optional(),
});

export const useAgents = (mission: Mission) => {
  const [agents, setAgents] = useState<Agent[]>([]);

  const ref = useMemo(() => collection(db, 'missions', mission.id, 'agents'), [mission]);

  useEffect(() => {
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setAgents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Agent[]
      );
    });

    return unsubscribe;
  }, [ref]);

  const createAgent = useCallback(
    async ({ name, color }: Partial<Agent>) => {
      const defaultColor = sortBy(COLORS, (c) => agents.filter((a) => a.color === c).length)[0];
      await addDoc(ref, { name, color: color || defaultColor });
    },
    [ref, agents]
  );

  const updateAgent = useCallback(
    async (agent: Pick<Agent, 'id'> & Record<string, unknown>) => {
      const ref = doc(db, 'missions', mission.id, 'agents', agent.id);
      const updates = AgentFirebaseSchema.parse(agent);
      await updateDoc(ref, updates);
    },
    [mission]
  );

  const deleteAgent = useCallback(
    async (agent: Agent) => {
      console.log(doc(ref, agent.id));
      await deleteDoc(doc(ref, agent.id));
      console.log('deleted', agent);
    },
    [ref]
  );

  return {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
  };
};
