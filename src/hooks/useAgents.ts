import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { Agent, AgentFirebaseSchema, COLORS, parseAgent } from '@/types/Agent';
import { Mission } from '@/types';
import { sortBy } from 'lodash-es';

export const useAgents = (mission: Mission) => {
  const [agents, setAgents] = useState<Agent[]>([]);

  const ref = useMemo(() => collection(db, 'missions', mission.id, 'agents'), [mission]);

  useEffect(() => {
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setAgents(snapshot.docs.map(parseAgent));
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
      await deleteDoc(doc(ref, agent.id));
    },
    [ref]
  );

  const eliminateAgent = useCallback(
    async (agent: Agent) => {
      updateAgent({ id: agent.id, eliminatedAt: new Date() });
    },
    [updateAgent]
  );

  return {
    agents,
    createAgent,
    updateAgent,
    deleteAgent,
    eliminateAgent,
  };
};
