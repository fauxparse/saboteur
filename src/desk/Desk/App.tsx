import { ActionIcon, AppShell, Button, Divider, Flex, Stack, Title } from '@mantine/core';
import {
  IconArrowLeft,
  IconHandFinger,
  IconHelpCircle,
  IconMasksTheater,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { AgentList } from './AgentList';
import { Clock } from './Clock';
import { Milestone } from './Milestone';
import { useMission } from '@/contexts/MissionProvider';
import { useAgents } from '@/hooks/useAgents';
import { useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { Elimination } from '@/types/Event';
import { sortBy } from 'lodash-es';
import { AgentsProvider } from '@/contexts/AgentsProvider';

import classes from './Desk.module.css';
import { EventBlock } from './EventBlock';
import { SaboteurBlock } from './SaboteurBlock';

export const App: React.FC = () => {
  const { mission } = useMission();

  const { agents } = useAgents(mission);

  const { events, createQuiz, createScene, createSuspicional, deleteEvent } = useEvents(mission);

  const allEvents = useMemo(() => {
    const eliminations: Elimination[] = agents
      .filter((a) => !!a.eliminatedAt)
      .map(
        (a) =>
          ({
            id: a.id,
            type: 'elimination',
            startsAt: a.eliminatedAt,
            agentId: a.id,
          }) as Elimination
      );
    return sortBy([...events, ...eliminations], ({ startsAt }) => startsAt.valueOf());
  }, [events, agents]);

  return (
    <AgentsProvider agents={agents}>
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
          <Divider />
          <Stack gap="md" p="md">
            <Button
              onClick={createScene}
              variant="outline"
              justify="start"
              leftSection={<IconMasksTheater />}
            >
              Add scene
            </Button>
            <Button
              onClick={createSuspicional}
              variant="outline"
              justify="start"
              leftSection={<IconHandFinger />}
            >
              Add suspicional
            </Button>
            <Button
              onClick={createQuiz}
              variant="outline"
              justify="start"
              leftSection={<IconHelpCircle />}
            >
              Add quiz
            </Button>
          </Stack>
        </AppShell.Navbar>
        <AppShell.Main>
          <div className={classes.grid}>
            {mission.startsAt && <Milestone time={mission.startsAt}>Mission start</Milestone>}
            <SaboteurBlock />
            {allEvents.map((event) => (
              <EventBlock key={event.id} event={event} onDelete={deleteEvent} />
            ))}
            {mission.endsAt && <Milestone time={mission.endsAt}>Mission end</Milestone>}
          </div>
        </AppShell.Main>
      </AppShell>
    </AgentsProvider>
  );
};
