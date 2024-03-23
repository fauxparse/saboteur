import { useAgent } from '@/contexts/AgentProvider';
import { useMission } from '@/contexts/MissionProvider';
import { ActionIcon, AppShell } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useEffect } from 'react';

export const App: React.FC = () => {
  const { mission } = useMission();
  const { agent, signOut } = useAgent();

  useEffect(() => {
    console.log(mission);
  }, [mission]);

  return (
    <AppShell>
      <AppShell.Header>
        <ActionIcon variant="transparent" aria-label="Back" onClick={signOut}>
          <IconArrowLeft />
        </ActionIcon>
        <h1>{mission.id}</h1>
        <h2>{agent.name}</h2>
      </AppShell.Header>
      <AppShell.Main>
        <p>Content</p>
      </AppShell.Main>
    </AppShell>
  );
};
