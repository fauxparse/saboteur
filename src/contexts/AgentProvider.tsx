import { Agent } from '@/types';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import { useMission } from './MissionProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useNavigate } from '@tanstack/react-router';
import { createContext, useContextSelector } from 'use-context-selector';

type Context = { agent: Agent; signOut: () => void };

type AgentProviderProps = PropsWithChildren<{ agent: Agent }>;

export const AgentContext = createContext<Context>({} as Context);

export const AgentProvider: React.FC<AgentProviderProps> = ({ agent, children }) => {
  const { mission } = useMission();

  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    if (!agent || !mission) return;
    await updateDoc(doc(db, 'missions', mission.id, 'agents', agent.id), { userId: null });
    navigate({ to: '/agent' });
  }, [agent, mission, navigate]);

  const value = useMemo(() => ({ agent, signOut }), [agent, signOut]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgent = () => useContextSelector(AgentContext, (v) => v);
