import { ActionIcon, AppShell, Flex, Title } from '@mantine/core';
import { IconArrowLeft, IconEyeglass2 } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { AgentList } from './AgentList';
import { Clock } from './Clock';
import { Milestone } from './Milestone';
import { useMission } from '@/contexts/MissionProvider';
import { useAgents } from '@/hooks/useAgents';
import { useMemo } from 'react';

import classes from './Desk.module.css';
import { AgentName } from './AgentName';

export const App: React.FC = () => {
  const { mission } = useMission();

  const { agents } = useAgents(mission);

  const saboteur = useMemo(
    () => agents.find((a) => a.id === mission.saboteurId),
    [agents, mission.saboteurId]
  );

  return (
    <AppShell
      className={classes.shell}
      header={{ height: 72 }}
      navbar={{ width: 300, breakpoint: 'md' }}
    >
      <AppShell.Header className={classes.header} p="md">
        <Flex align="center" gap="sm">
          <ActionIcon component={Link} to="/desk" variant="transparent" aria-label="Back">
            <IconArrowLeft />
          </ActionIcon>
          <Title order={1} size="h4" ff="mono">
            {mission.id}
          </Title>
        </Flex>
        <Clock />
      </AppShell.Header>
      <AppShell.Navbar>
        <AgentList />
      </AppShell.Navbar>
      <AppShell.Main>
        <div className={classes.grid}>
          {mission.startsAt && <Milestone time={mission.startsAt}>Mission start</Milestone>}
          {saboteur && (
            <Milestone icon={<IconEyeglass2 />}>
              <AgentName agent={saboteur} /> is the Saboteur!
            </Milestone>
          )}
          {mission.endsAt && <Milestone time={mission.endsAt}>Mission end</Milestone>}
        </div>
      </AppShell.Main>
    </AppShell>
  );
};
