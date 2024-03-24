import { Button, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useMission } from '../../contexts/MissionProvider';
import { AgentInfo } from './AgentInfo';
import { AgentMenu } from './AgentMenu';
import { useAgents } from '@/hooks/useAgents';

export const AgentList: React.FC = () => {
  const { mission } = useMission();

  const { agents, deleteAgent } = useAgents(mission);

  const [newAgent, newAgentModal] = useDisclosure();

  return (
    <Stack gap="sm" p="md">
      {agents.map((agent) => (
        <AgentMenu key={agent.id} agent={agent} onDelete={deleteAgent} />
      ))}
      <Button variant="transparent" leftSection={<IconPlus />} onClick={newAgentModal.open}>
        Add agent
      </Button>
      <AgentInfo agent={{ name: '', id: '' }} onClose={newAgentModal.close} opened={newAgent} />
    </Stack>
  );
};
