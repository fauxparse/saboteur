import { Milestone } from './Milestone';
import { IconEyeglass2 } from '@tabler/icons-react';
import { useAgents } from '@/contexts/AgentsProvider';
import { AgentName } from './AgentName';

export const SaboteurBlock: React.FC = () => {
  const { saboteur } = useAgents();

  if (!saboteur) return null;

  return (
    <Milestone icon={<IconEyeglass2 />}>
      <span>
        <AgentName agent={saboteur} /> is the Saboteur!
      </span>
    </Milestone>
  );
};
