import { Agent } from '@/types';
import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from 'react';
import { useMission } from './MissionProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

type Context = { agent: Agent; signOut: () => void };

type AgentProviderProps = PropsWithChildren<{ agent: Agent }>;

const AgentContext = createContext<Context>({} as Context);

export const AgentProvider: React.FC<AgentProviderProps> = ({ agent, children }) => {
  const { mission } = useMission();

  const signOut = useCallback(async () => {
    if (!agent || !mission) return;
    await updateDoc(doc(db, 'missions', mission.id, 'agents', agent.id), { userId: null });
  }, [agent, mission]);

  const value = useMemo(() => ({ agent, signOut }), [agent, signOut]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgent = () => useContext(AgentContext);
