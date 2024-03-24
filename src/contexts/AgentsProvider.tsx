import { Agent } from '@/types/Agent';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMission } from './MissionProvider';

type AgentsProviderProps = PropsWithChildren<{ agents: Agent[] }>;

const Context = createContext<{
  agents: Map<string, Agent>;
  saboteur: Agent | null;
  getAgent: (id: string) => Agent | null;
}>({
  agents: new Map(),
  saboteur: null,
  getAgent: () => null,
});

export const AgentsProvider: React.FC<AgentsProviderProps> = ({ agents, children }) => {
  const { mission } = useMission();

  const map = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const getAgent = useCallback((id: string) => map.get(id) || null, [map]);

  const saboteur = useMemo(
    () => (mission.saboteurId && map.get(mission.saboteurId)) || null,
    [map, mission.saboteurId]
  );

  const value = useMemo(() => ({ agents: map, saboteur, getAgent }), [map, saboteur, getAgent]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useAgents = () => useContextSelector(Context, (v) => v);
