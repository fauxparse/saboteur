import { Agent, AgentFirebaseSchema, COLORS, parseAgent } from '@/types/Agent';
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMission } from './MissionProvider';
import {
  DocumentReference,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { sortBy } from 'lodash-es';
import { db } from '@/firebase';
import { PartialWithId } from '@/types';

type AgentsProviderProps = PropsWithChildren;

const Context = createContext<{
  agents: Agent[];
  saboteur: Agent | null;
  getAgent: (id: string) => Agent | null;
  createAgent: (agent: Partial<Agent>) => Promise<DocumentReference>;
  updateAgent: (agent: PartialWithId<Agent>) => void;
  deleteAgent: (agent: Agent) => void;
  eliminateAgent: (agent: Agent) => void;
}>({
  agents: [],
  saboteur: null,
  getAgent: () => null,
  createAgent: () => Promise.resolve({} as DocumentReference),
  updateAgent: () => void 0,
  deleteAgent: () => void 0,
  eliminateAgent: () => void 0,
});

export const AgentsProvider: React.FC<AgentsProviderProps> = ({ children }) => {
  const { mission } = useMission();

  const [agents, setAgents] = useState<Agent[]>([]);

  const ref = useMemo(() => collection(db, 'missions', mission.id, 'agents'), [mission.id]);

  useEffect(() => {
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.docs.length) {
        setAgents(sortBy(snapshot.docs.map(parseAgent), 'position'));
      }
    });

    return unsubscribe;
  }, [ref]);

  const map = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const getAgent = useCallback((id: string) => map.get(id) || null, [map]);

  const createAgent = useCallback(
    async ({ name, color, image }: Partial<Agent>) => {
      const defaultColor = sortBy(COLORS, (c) => agents.filter((a) => a.color === c).length)[0];
      const doc = await addDoc(ref, {
        name,
        color: color || defaultColor,
        position: agents.length,
        image,
      });
      return doc;
    },
    [ref, agents]
  );

  const saboteur = useMemo(
    () => (mission.saboteurId && map.get(mission.saboteurId)) || null,
    [map, mission.saboteurId]
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
      for (const after of agents.filter((a) => a.position > agent.position)) {
        updateAgent({ id: after.id, position: after.position - 1 });
      }
    },
    [ref, agents, updateAgent]
  );

  const eliminateAgent = useCallback(
    async (agent: Agent) => {
      updateAgent({ id: agent.id, eliminatedAt: new Date() });
    },
    [updateAgent]
  );

  const value = useMemo(
    () => ({
      agents,
      saboteur,
      getAgent,
      createAgent,
      updateAgent,
      deleteAgent,
      eliminateAgent,
    }),
    [agents, saboteur, getAgent, createAgent, updateAgent, deleteAgent, eliminateAgent]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useAgents = () => useContextSelector(Context, (v) => v);
