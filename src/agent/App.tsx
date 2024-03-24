import { useAgent } from '@/contexts/AgentProvider';
import { useMission } from '@/contexts/MissionProvider';
import { ActionIcon, AppShell, Flex, Title } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect } from 'react';

import classes from './Agent.module.css';

export const App: React.FC = () => {
  const { mission } = useMission();
  const { agent, signOut } = useAgent();

  useEffect(() => {
    console.log(mission);
  }, [mission]);

  return (
    <AppShell layout="alt" header={{ height: 72 }}>
      <AppShell.Header className={classes.header} p="md">
        <Flex align="center" gap="sm">
          <ActionIcon variant="transparent" aria-label="Back" onClick={signOut}>
            <IconArrowLeft />
          </ActionIcon>
          <Title order={1} size="h4" ff="mono">
            {mission.id}
          </Title>
        </Flex>
        <Flex align="center" gap="sm">
          <Title order={2} size="h4">
            {agent.name}
          </Title>
        </Flex>
      </AppShell.Header>
      <AppShell.Main>
        <p>Content</p>
      </AppShell.Main>
    </AppShell>
  );
};
