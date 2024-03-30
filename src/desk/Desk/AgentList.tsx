import { Button, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { AgentInfo } from './AgentInfo';
import { AgentMenu } from './AgentMenu';
import { useAgents } from '@/contexts/AgentsProvider';
import { Agent } from '@/types/Agent';
import { useCallback } from 'react';

export const AgentList: React.FC = () => {
  const { agents, deleteAgent, eliminateAgent, updateAgent } = useAgents();

  const [newAgent, newAgentModal] = useDisclosure();

  const reinstateAgent = useCallback(
    (agent: Agent) => {
      updateAgent({ id: agent.id, eliminatedAt: null });
    },
    [updateAgent]
  );

  return (
    <Stack gap="sm" p="md">
      {agents.map((agent) => (
        <AgentMenu
          key={agent.id}
          agent={agent}
          onDelete={deleteAgent}
          onEliminate={eliminateAgent}
          onReinstate={reinstateAgent}
        />
      ))}
      <Button
        variant="transparent"
        justify="start"
        leftSection={<IconPlus />}
        onClick={newAgentModal.open}
      >
        Add agent
      </Button>
      <AgentInfo
        agent={{ name: '', id: '', position: agents.length }}
        onClose={newAgentModal.close}
        opened={newAgent}
      />
    </Stack>
  );
};
