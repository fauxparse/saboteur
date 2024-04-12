import { Elimination } from '@/types/Event';
import { Milestone } from './Milestone';
import { IconSlice } from '@tabler/icons-react';
import { useAgents } from '@/contexts/AgentsProvider';
import { useMemo } from 'react';
import { AgentName } from './AgentName';

type EliminationBlockProps = {
  event: Elimination;
  onDelete: (elimination: Elimination) => void;
};

export const EliminationBlock: React.FC<EliminationBlockProps> = ({ event: elimination }) => {
  const { getAgent } = useAgents();

  const agent = useMemo(() => getAgent(elimination.agentId), [elimination.agentId, getAgent]);

  return (
    agent && (
      <Milestone time={elimination.timestamp} icon={<IconSlice />}>
        <span>
          <AgentName agent={agent} /> was eliminated!
        </span>
      </Milestone>
    )
  );
};
