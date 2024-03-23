import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/firebase';
import { Agent, Mission } from '@/types';
import { z } from 'zod';

export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  userId: z.string().nullable().optional(),
});

export const parseAgent = (doc: DocumentSnapshot | QueryDocumentSnapshot): Agent =>
  AgentSchema.parse({ id: doc.id, ...doc.data() });

export const useAgents = (mission: Mission) => {
  const [agents, setAgents] = useState<Agent[]>([]);

  const ref = useMemo(() => collection(db, 'missions', mission.id, 'agents'), [mission]);

  useEffect(() => {
    const unsub = onSnapshot(ref, (snapshot) => {
      setAgents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Agent[]
      );
    });

    return unsub;
  }, [ref]);

  const createAgent = useCallback(
    async (name: string) => {
      await addDoc(ref, { name });
    },
    [ref]
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
    deleteAgent,
  };
};
